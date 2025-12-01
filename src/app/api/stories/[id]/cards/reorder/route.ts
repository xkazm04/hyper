import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError } from '@/lib/types'

/**
 * PATCH /api/stories/[id]/cards/reorder
 * Reorder cards for a story stack (batch update order indices)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
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

    // Parse request body
    const body = await request.json()
    const { cardOrders } = body as { cardOrders: Array<{ id: string; orderIndex: number }> }

    if (!cardOrders || !Array.isArray(cardOrders)) {
      return NextResponse.json(
        { error: 'Invalid request body: cardOrders array required' },
        { status: 400 }
      )
    }

    // Update each card's order index
    const updatePromises = cardOrders.map(({ id: cardId, orderIndex }) =>
      storyService.updateStoryCard(cardId, { orderIndex })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: 'Cards reordered successfully',
    })
  } catch (error) {
    console.error('Error reordering story cards:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reorder story cards' },
      { status: 500 }
    )
  }
}
