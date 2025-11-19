import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError, ChoiceNotFoundError } from '@/lib/types'

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
    if (label !== undefined && (typeof label !== 'string' || label.trim().length < 1)) {
      return NextResponse.json(
        { error: 'Choice label must be at least 1 character' },
        { status: 400 }
      )
    }

    // If targetCardId is provided, verify it exists and belongs to the same story stack
    if (targetCardId !== undefined) {
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
    }

    // Update choice
    const choice = await storyService.updateChoice(choiceId, {
      label: label?.trim(),
      targetCardId,
      orderIndex,
    })

    return NextResponse.json({
      success: true,
      choice,
    })
  } catch (error) {
    console.error('Error updating choice:', error)

    if (error instanceof ChoiceNotFoundError) {
      return NextResponse.json(
        { error: 'Choice not found' },
        { status: 404 }
      )
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update choice' },
      { status: 500 }
    )
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

    // Delete choice
    await storyService.deleteChoice(choiceId)

    return NextResponse.json({
      success: true,
      message: 'Choice deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting choice:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete choice' },
      { status: 500 }
    )
  }
}
