import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { SharedBundlesService } from '@/lib/services/story/sharedBundles'
import type { CompiledStoryBundle } from '@/app/features/wasm-runtime/lib/types'

/**
 * POST /api/stories/[id]/share
 * Create a shareable URL for a compiled story bundle
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    const { bundle } = body as { bundle: CompiledStoryBundle }

    if (!bundle) {
      return NextResponse.json(
        { error: 'Bundle data is required' },
        { status: 400 }
      )
    }

    // Verify ownership of the story
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (existingStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to share this story stack' },
        { status: 403 }
      )
    }

    // Create the shared bundle
    const sharedBundlesService = new SharedBundlesService(supabase)
    const sharedBundle = await sharedBundlesService.createSharedBundle({
      storyStackId: id,
      bundleData: bundle,
      bundleVersion: bundle.version,
      bundleChecksum: bundle.checksum,
      bundleSizeBytes: JSON.stringify(bundle).length,
      storyName: bundle.metadata.name,
      storyDescription: bundle.metadata.description,
      cardCount: bundle.metadata.cardCount,
      choiceCount: bundle.metadata.choiceCount,
      characterCount: bundle.metadata.characterCount,
    })

    // Generate the share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const shareUrl = `${baseUrl}/shared/${sharedBundle.shareCode}`

    return NextResponse.json({
      success: true,
      shareCode: sharedBundle.shareCode,
      shareUrl,
      sharedBundle: {
        id: sharedBundle.id,
        shareCode: sharedBundle.shareCode,
        storyName: sharedBundle.storyName,
        cardCount: sharedBundle.cardCount,
        createdAt: sharedBundle.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating shared bundle:', error)
    return NextResponse.json(
      { error: 'Failed to create shared bundle' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/stories/[id]/share
 * Get all shared bundles for a story
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership of the story
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (existingStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view shared bundles for this story' },
        { status: 403 }
      )
    }

    // Get shared bundles
    const sharedBundlesService = new SharedBundlesService(supabase)
    const sharedBundles = await sharedBundlesService.getStorySharedBundles(id)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

    return NextResponse.json({
      sharedBundles: sharedBundles.map((bundle) => ({
        id: bundle.id,
        shareCode: bundle.shareCode,
        shareUrl: `${baseUrl}/shared/${bundle.shareCode}`,
        storyName: bundle.storyName,
        cardCount: bundle.cardCount,
        choiceCount: bundle.choiceCount,
        viewCount: bundle.viewCount,
        createdAt: bundle.createdAt,
        isActive: bundle.isActive,
      })),
    })
  } catch (error) {
    console.error('Error getting shared bundles:', error)
    return NextResponse.json(
      { error: 'Failed to get shared bundles' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stories/[id]/share
 * Delete a specific shared bundle
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const bundleId = searchParams.get('bundleId')

    if (!bundleId) {
      return NextResponse.json(
        { error: 'Bundle ID is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership of the story
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (existingStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete shared bundles for this story' },
        { status: 403 }
      )
    }

    // Delete the shared bundle
    const sharedBundlesService = new SharedBundlesService(supabase)
    await sharedBundlesService.deleteSharedBundle(bundleId)

    return NextResponse.json({
      success: true,
      message: 'Shared bundle deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting shared bundle:', error)
    return NextResponse.json(
      { error: 'Failed to delete shared bundle' },
      { status: 500 }
    )
  }
}
