import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

interface CardContext {
  id: string
  title: string
  content: string
  orderIndex: number
}

interface SuccessorInfo {
  card: CardContext
  choiceLabel: string  // The choice that leads FROM current card to this card
}

/**
 * GET /api/stories/[id]/cards/[cardId]/successors
 * Get all cards that this card's choices point to (successors)
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

    const choices = await storyService.getChoices(cardId)

    const allCards = await storyService.getStoryCards(id)
    const cardMap = new Map(allCards.map(c => [c.id, c]))

    const successors: SuccessorInfo[] = []

    for (const choice of choices) {
      const targetCard = cardMap.get(choice.targetCardId)
      if (targetCard) {
        successors.push({
          card: {
            id: targetCard.id,
            title: targetCard.title,
            content: targetCard.content,
            orderIndex: targetCard.orderIndex,
          },
          choiceLabel: choice.label,
        })
      }
    }

    return successResponse({
      successors,
      hasSuccessors: successors.length > 0,
    })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching successors',
      fallbackMessage: 'Failed to fetch successors',
    })
  }
}
