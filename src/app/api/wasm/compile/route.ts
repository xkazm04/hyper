import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { serializeStory, bundleToBytes, validateBundle } from '@/app/features/wasm-runtime/lib/serializer'
import { compressData, generateChecksum } from '@/app/features/wasm-runtime/lib/utils'
import type { CompileOptions } from '@/app/features/wasm-runtime/lib/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { stackId, options = {} } = body as { stackId: string; options?: Partial<CompileOptions> }

    if (!stackId) {
      return NextResponse.json({ error: 'Stack ID is required' }, { status: 400 })
    }

    // Fetch story data
    const storyService = new StoryService()

    const stack = await storyService.getStoryStack(stackId)
    if (!stack) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Verify ownership
    if (stack.ownerId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to compile this story' }, { status: 403 })
    }

    // Fetch all story data
    const [cards, allChoices, characters] = await Promise.all([
      storyService.getStoryCards(stackId),
      Promise.all(
        (await storyService.getStoryCards(stackId)).map((card) =>
          storyService.getChoices(card.id)
        )
      ).then((results) => results.flat()),
      storyService.getCharacters(stackId),
    ])

    if (cards.length === 0) {
      return NextResponse.json(
        { error: 'Cannot compile empty story' },
        { status: 400 }
      )
    }

    // Compile the bundle
    const compileOptions: CompileOptions = {
      embedAssets: options.embedAssets ?? true,
      compressAssets: options.compressAssets ?? true,
      maxAssetSize: options.maxAssetSize ?? 5 * 1024 * 1024,
      maxBundleSize: options.maxBundleSize ?? 50 * 1024 * 1024,
      includeDebugInfo: options.includeDebugInfo ?? false,
      optimizeForSize: options.optimizeForSize ?? true,
      targetFormat: options.targetFormat ?? 'wasm',
    }

    const startTime = performance.now()

    const bundle = await serializeStory(
      stack,
      cards,
      allChoices,
      characters,
      compileOptions
    )

    const validation = validateBundle(bundle)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Bundle validation failed',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    // Convert to bytes and optionally compress
    let bytes = bundleToBytes(bundle)
    if (compileOptions.compressAssets) {
      bytes = await compressData(bytes)
    }

    const compileDurationMs = performance.now() - startTime

    // Return stats and download info
    return NextResponse.json({
      success: true,
      stats: {
        totalCards: cards.length,
        totalChoices: allChoices.length,
        totalCharacters: characters.length,
        totalAssets: bundle.assets.images.length,
        bundleSizeBytes: bytes.length,
        compileDurationMs,
        assetsSizeBytes: bundle.assets.totalSize,
      },
      metadata: bundle.metadata,
      checksum: bundle.checksum,
    })
  } catch (error) {
    console.error('WASM compile error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Compilation failed' },
      { status: 500 }
    )
  }
}
