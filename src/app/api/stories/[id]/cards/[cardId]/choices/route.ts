import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError } from '@/lib/types'

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
    const storyService = new StoryService()
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

    // Verify card exists and belongs to story stack
    const storyCard = await storyService.getStoryCard(cardId)

    if (!storyCard) {
      return NextResponse.json(
        { error: 'Story card not found' },
        { status: 404 }
      )
    }

    if (storyCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Card does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Get choices
    const choices = await storyService.getChoices(cardId)

    return NextResponse.json({
      success: true,
      choices,
    })
  } catch (error) {
    console.error('Error fetching choices:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch choices' },
      { status: 500 }
    )
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
    const storyService = new StoryService()
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (storyStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this story stack' },
        { status: 403 }
      )
    }

    // Verify card exists and belongs to story stack
    const storyCard = await storyService.getStoryCard(cardId)

    if (!storyCard) {
      return NextResponse.json(
        { error: 'Story card not found' },
        { status: 404 }
      )
    }

    if (storyCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Card does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { label, targetCardId, orderIndex } = body

    // Validate input
    if (!label || typeof label !== 'string' || label.trim().length < 1) {
      return NextResponse.json(
        { error: 'Choice label must be at least 1 character' },
        { status: 400 }
      )
    }

    if (!targetCardId || typeof targetCardId !== 'string') {
      return NextResponse.json(
        { error: 'Target card ID is required' },
        { status: 400 }
      )
    }

    // Verify target card exists and belongs to the same story stack
    const targetCard = await storyService.getStoryCard(targetCardId)

    if (!targetCard) {
      return NextResponse.json(
        { error: 'Target card not found' },
        { status: 404 }
      )
    }

    if (targetCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Target card does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Create choice
    const choice = await storyService.createChoice({
      storyCardId: cardId,
      label: label.trim(),
      targetCardId,
      orderIndex,
    })

    return NextResponse.json({
      success: true,
      choice,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating choice:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create choice' },
      { status: 500 }
    )
  }
}
