import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError, CardNotFoundError } from '@/lib/types'

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

    // Get story card
    const storyCard = await storyService.getStoryCard(cardId)

    if (!storyCard) {
      return NextResponse.json(
        { error: 'Story card not found' },
        { status: 404 }
      )
    }

    // Verify card belongs to the story stack
    if (storyCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Card does not belong to this story stack' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      storyCard,
    })
  } catch (error) {
    console.error('Error fetching story card:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch story card' },
      { status: 500 }
    )
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
    const existingCard = await storyService.getStoryCard(cardId)

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Story card not found' },
        { status: 404 }
      )
    }

    if (existingCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Card does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { title, content, script, imageUrl, imagePrompt, orderIndex } = body

    // Update story card
    const storyCard = await storyService.updateStoryCard(cardId, {
      title,
      content,
      script,
      imageUrl,
      imagePrompt,
      orderIndex,
    })

    return NextResponse.json({
      success: true,
      storyCard,
    })
  } catch (error) {
    console.error('Error updating story card:', error)

    if (error instanceof CardNotFoundError) {
      return NextResponse.json(
        { error: 'Story card not found' },
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
      { error: 'Failed to update story card' },
      { status: 500 }
    )
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
    const existingCard = await storyService.getStoryCard(cardId)

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Story card not found' },
        { status: 404 }
      )
    }

    if (existingCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Card does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Delete story card
    await storyService.deleteStoryCard(cardId)

    return NextResponse.json({
      success: true,
      message: 'Story card deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting story card:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete story card' },
      { status: 500 }
    )
  }
}
