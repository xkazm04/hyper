import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

/**
 * POST /api/stories/[id]/publish
 * Publish a story stack with a generated slug
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
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (existingStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to publish this story stack', 403)
    }

    const cards = await storyService.getStoryCards(id)
    if (cards.length === 0) {
      return errorResponse('Cannot publish story with no cards', 400)
    }

    const storyStack = await storyService.publishStoryStack(id)

    return successResponse({
      storyStack,
      shareableUrl: `/play/${storyStack.slug}`,
    })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error publishing story stack',
      fallbackMessage: 'Failed to publish story stack',
    })
  }
}

/**
 * DELETE /api/stories/[id]/publish
 * Unpublish a story stack
 */
export async function DELETE(
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
      return errorResponse('Unauthorized to unpublish this story stack', 403)
    }

    const storyStack = await storyService.unpublishStoryStack(id)

    return successResponse({
      storyStack,
      message: 'Story stack unpublished successfully',
    })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error unpublishing story stack',
      fallbackMessage: 'Failed to unpublish story stack',
    })
  }
}
