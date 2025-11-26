import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError } from '@/lib/types'

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

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership of story stack
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (storyStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this story stack' },
        { status: 403 }
      )
    }

    // Get choices from current card
    const choices = await storyService.getChoices(cardId)
    
    // Get all cards to look up successor info
    const allCards = await storyService.getStoryCards(id)
    const cardMap = new Map(allCards.map(c => [c.id, c]))
    
    // Build successors list
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

    return NextResponse.json({
      success: true,
      successors,
      hasSuccessors: successors.length > 0,
    })
  } catch (error) {
    console.error('Error fetching successors:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch successors' },
      { status: 500 }
    )
  }
}
