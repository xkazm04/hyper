import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

/**
 * PATCH /api/stories/[id]/cards/[cardId]/choices/[choiceId]
 * Update a choice
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string; choiceId: string }> }
) {
  try {
    const { id, cardId, choiceId } = await params

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (storyStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to modify this story stack', 403)
    }

    const storyCard = await storyService.getStoryCard(cardId)

    if (!storyCard) {
      return errorResponse('Story card not found', 404)
    }

    if (storyCard.storyStackId !== id) {
      return errorResponse('Card does not belong to this story stack', 400)
    }

    const body = await request.json()
    const { label, targetCardId, orderIndex } = body

    if (label !== undefined && (typeof label !== 'string' || label.trim().length < 1)) {
      return errorResponse('Choice label must be at least 1 character', 400)
    }

    if (targetCardId !== undefined) {
      const targetCard = await storyService.getStoryCard(targetCardId)

      if (!targetCard) {
        return errorResponse('Target card not found', 404)
      }

      if (targetCard.storyStackId !== id) {
        return errorResponse('Target card does not belong to this story stack', 400)
      }
    }

    const choice = await storyService.updateChoice(choiceId, {
      label: label?.trim(),
      targetCardId,
      orderIndex,
    })

    return successResponse({ choice })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error updating choice',
      fallbackMessage: 'Failed to update choice',
    })
  }
}

/**
 * DELETE /api/stories/[id]/cards/[cardId]/choices/[choiceId]
 * Delete a choice
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string; choiceId: string }> }
) {
  try {
    const { id, cardId, choiceId } = await params

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (storyStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to modify this story stack', 403)
    }

    const storyCard = await storyService.getStoryCard(cardId)

    if (!storyCard) {
      return errorResponse('Story card not found', 404)
    }

    if (storyCard.storyStackId !== id) {
      return errorResponse('Card does not belong to this story stack', 400)
    }

    await storyService.deleteChoice(choiceId)

    return successResponse({ message: 'Choice deleted successfully' })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error deleting choice',
      fallbackMessage: 'Failed to delete choice',
    })
  }
}
