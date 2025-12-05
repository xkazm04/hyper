import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

/**
 * GET /api/stories/[id]
 * Get a single story stack by ID
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
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (storyStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to access this story stack', 403)
    }

    return successResponse({ storyStack })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching story stack',
      fallbackMessage: 'Failed to fetch story stack',
    })
  }
}

/**
 * PATCH /api/stories/[id]
 * Update a story stack
 */
export async function PATCH(
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
      return errorResponse('Unauthorized to modify this story stack', 403)
    }

    const body = await request.json()
    const { name, description, firstCardId, cover_image_url } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 3)) {
      return errorResponse('Story name must be at least 3 characters', 400)
    }

    const storyStack = await storyService.updateStoryStack(id, {
      name: name?.trim(),
      description: description?.trim(),
      firstCardId,
      coverImageUrl: cover_image_url,
    })

    return successResponse({ storyStack })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error updating story stack',
      fallbackMessage: 'Failed to update story stack',
    })
  }
}

/**
 * DELETE /api/stories/[id]
 * Delete a story stack
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
      return errorResponse('Unauthorized to delete this story stack', 403)
    }

    await storyService.deleteStoryStack(id)

    return successResponse({ message: 'Story stack deleted successfully' })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error deleting story stack',
      fallbackMessage: 'Failed to delete story stack',
    })
  }
}
