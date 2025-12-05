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

interface PredecessorInfo {
  card: CardContext
  choiceLabel: string  // The choice that leads TO the current card
}

/**
 * GET /api/stories/[id]/cards/[cardId]/predecessors
 * Get all cards that have choices pointing to this card (predecessors)
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

    const allCards = await storyService.getStoryCards(id)

    const predecessors: PredecessorInfo[] = []

    for (const card of allCards) {
      if (card.id === cardId) continue

      const choices = await storyService.getChoices(card.id)
      const choicesToCurrentCard = choices.filter(c => c.targetCardId === cardId)

      for (const choice of choicesToCurrentCard) {
        predecessors.push({
          card: {
            id: card.id,
            title: card.title,
            content: card.content,
            orderIndex: card.orderIndex,
          },
          choiceLabel: choice.label,
        })
      }
    }

    const isFirstCard = storyStack.firstCardId === cardId

    return successResponse({
      predecessors,
      isFirstCard,
      hasPredecessors: predecessors.length > 0 || isFirstCard,
    })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching predecessors',
      fallbackMessage: 'Failed to fetch predecessors',
    })
  }
}
