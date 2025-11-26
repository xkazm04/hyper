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

    // Get all cards and choices for this story
    const allCards = await storyService.getStoryCards(id)
    
    // Find predecessors: cards that have choices pointing to current card
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

    // Check if current card is the first card (has no predecessors in graph but is entry point)
    const isFirstCard = storyStack.firstCardId === cardId

    return NextResponse.json({
      success: true,
      predecessors,
      isFirstCard,
      hasPredecessors: predecessors.length > 0 || isFirstCard,
    })
  } catch (error) {
    console.error('Error fetching predecessors:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch predecessors' },
      { status: 500 }
    )
  }
}
