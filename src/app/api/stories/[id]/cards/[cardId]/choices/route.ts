import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

/**
 * GET /api/stories/[id]/cards/[cardId]/choices
 * Get all choices for a story card
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

    const choices = await storyService.getChoices(cardId)

    return successResponse({ choices })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching choices',
      fallbackMessage: 'Failed to fetch choices',
    })
  }
}

/**
 * POST /api/stories/[id]/cards/[cardId]/choices
 * Create a new choice for a story card
 */
export async function POST(
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

    const storyCard = await storyService.getStoryCard(cardId)

    if (!storyCard) {
      return errorResponse('Story card not found', 404)
    }

    if (storyCard.storyStackId !== id) {
      return errorResponse('Card does not belong to this story stack', 400)
    }

    const body = await request.json()
    const { label, targetCardId, orderIndex } = body

    if (!label || typeof label !== 'string' || label.trim().length < 1) {
      return errorResponse('Choice label must be at least 1 character', 400)
    }

    if (!targetCardId || typeof targetCardId !== 'string') {
      return errorResponse('Target card ID is required', 400)
    }

    const targetCard = await storyService.getStoryCard(targetCardId)

    if (!targetCard) {
      return errorResponse('Target card not found', 404)
    }

    if (targetCard.storyStackId !== id) {
      return errorResponse('Target card does not belong to this story stack', 400)
    }

    const choice = await storyService.createChoice({
      storyCardId: cardId,
      label: label.trim(),
      targetCardId,
      orderIndex,
    })

    return successResponse({ choice }, 201)
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error creating choice',
      fallbackMessage: 'Failed to create choice',
    })
  }
}
