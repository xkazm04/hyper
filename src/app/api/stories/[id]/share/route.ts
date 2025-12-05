import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import { SharedBundlesService } from '@/lib/services/story/sharedBundles'
import type { CompiledStoryBundle } from '@/app/features/wasm-runtime/lib/types'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const body = await request.json()
    const { bundle } = body as { bundle: CompiledStoryBundle }

    if (!bundle) {
      return errorResponse('Bundle data is required', 400)
    }

    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (existingStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to share this story stack', 403)
    }

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const shareUrl = `${baseUrl}/shared/${sharedBundle.shareCode}`

    return successResponse({
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
    return handleApiError(error, {
      logPrefix: 'Error creating shared bundle',
      fallbackMessage: 'Failed to create shared bundle',
    })
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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (existingStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to view shared bundles for this story', 403)
    }

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
    return handleApiError(error, {
      logPrefix: 'Error getting shared bundles',
      fallbackMessage: 'Failed to get shared bundles',
    })
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
      return errorResponse('Bundle ID is required', 400)
    }

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (existingStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to delete shared bundles for this story', 403)
    }

    const sharedBundlesService = new SharedBundlesService(supabase)
    await sharedBundlesService.deleteSharedBundle(bundleId)

    return successResponse({ message: 'Shared bundle deleted successfully' })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error deleting shared bundle',
      fallbackMessage: 'Failed to delete shared bundle',
    })
  }
}
