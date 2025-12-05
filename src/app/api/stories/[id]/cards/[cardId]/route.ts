import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

/**
 * GET /api/stories/[id]/cards/[cardId]
 * Get a single story card
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const { id, cardId } = await params

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

    const storyCard = await storyService.getStoryCard(cardId)

    if (!storyCard) {
      return errorResponse('Story card not found', 404)
    }

    if (storyCard.storyStackId !== id) {
      return errorResponse('Card does not belong to this story stack', 400)
    }

    return successResponse({ storyCard })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching story card',
      fallbackMessage: 'Failed to fetch story card',
    })
  }
}

/**
 * PATCH /api/stories/[id]/cards/[cardId]
 * Update a story card
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const { id, cardId } = await params

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

    const existingCard = await storyService.getStoryCard(cardId)

    if (!existingCard) {
      return errorResponse('Story card not found', 404)
    }

    if (existingCard.storyStackId !== id) {
      return errorResponse('Card does not belong to this story stack', 400)
    }

    const body = await request.json()
    const { title, content, script, imageUrl, imagePrompt, imageDescription, audioUrl, message, speaker, speakerType, orderIndex, version } = body

    const storyCard = await storyService.updateStoryCard(cardId, {
      title,
      content,
      script,
      imageUrl,
      imagePrompt,
      imageDescription,
      audioUrl,
      message,
      speaker,
      speakerType,
      orderIndex,
      version,
    })

    return successResponse({ storyCard })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error updating story card',
      fallbackMessage: 'Failed to update story card',
    })
  }
}

/**
 * DELETE /api/stories/[id]/cards/[cardId]
 * Delete a story card
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const { id, cardId } = await params

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

    const existingCard = await storyService.getStoryCard(cardId)

    if (!existingCard) {
      return errorResponse('Story card not found', 404)
    }

    if (existingCard.storyStackId !== id) {
      return errorResponse('Card does not belong to this story stack', 400)
    }

    await storyService.deleteStoryCard(cardId)

    return successResponse({ message: 'Story card deleted successfully' })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error deleting story card',
      fallbackMessage: 'Failed to delete story card',
    })
  }
}
