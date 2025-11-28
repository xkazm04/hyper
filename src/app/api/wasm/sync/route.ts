import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { serializeStory } from '@/app/features/wasm-runtime/lib/serializer'
import { generateChecksum } from '@/app/features/wasm-runtime/lib/utils'

/**
 * GET /api/wasm/sync
 * Check for updates or fetch full bundle
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stackId = searchParams.get('stackId')
    const clientChecksum = searchParams.get('checksum')
    const fetchFull = searchParams.get('full') === 'true'

    if (!stackId) {
      return NextResponse.json({ error: 'Stack ID is required' }, { status: 400 })
    }

    const storyService = new StoryService()
    const stack = await storyService.getStoryStack(stackId)

    if (!stack) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // For public stories, allow anyone to sync
    // For private stories, require auth
    if (!stack.isPublished) {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || stack.ownerId !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    }

    // Fetch story data for checksum comparison
    const cards = await storyService.getStoryCards(stackId)
    const allChoices = (await Promise.all(
      cards.map((card) => storyService.getChoices(card.id))
    )).flat()
    const characters = await storyService.getCharacters(stackId)

    // Generate current checksum from server data
    const bundle = await serializeStory(stack, cards, allChoices, characters, {
      embedAssets: false, // Don't embed for checksum comparison
      compressAssets: false,
      optimizeForSize: true,
    })

    const serverChecksum = bundle.checksum

    // If just checking for updates
    if (!fetchFull && clientChecksum) {
      const hasUpdates = clientChecksum !== serverChecksum

      return NextResponse.json({
        hasUpdates,
        checksum: serverChecksum,
        updatedAt: stack.updatedAt,
        cardCount: cards.length,
        choiceCount: allChoices.length,
      })
    }

    // Return full bundle
    const fullBundle = await serializeStory(stack, cards, allChoices, characters, {
      embedAssets: true,
      compressAssets: true,
      optimizeForSize: true,
    })

    return NextResponse.json(fullBundle)
  } catch (error) {
    console.error('WASM sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
