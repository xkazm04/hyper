import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError, StoryNotFoundError } from '@/lib/types'

/**
 * GET /api/stories/[id]
 * Get a single story stack by ID
 */
export async function GET(
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

    // Get story stack
    const storyService = new StoryService()
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (storyStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this story stack' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      storyStack,
    })
  } catch (error) {
    console.error('Error fetching story stack:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch story stack' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/stories/[id]
 * Update a story stack
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
    const storyService = new StoryService()
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (existingStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this story stack' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description, firstCardId } = body

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length < 3)) {
      return NextResponse.json(
        { error: 'Story name must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Update story stack
    const storyStack = await storyService.updateStoryStack(id, {
      name: name?.trim(),
      description: description?.trim(),
      firstCardId,
    })

    return NextResponse.json({
      success: true,
      storyStack,
    })
  } catch (error) {
    console.error('Error updating story stack:', error)

    if (error instanceof StoryNotFoundError) {
      return NextResponse.json(
        { error: 'Story stack not found' },
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
      { error: 'Failed to update story stack' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stories/[id]
 * Delete a story stack
 */
export async function DELETE(
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
    const storyService = new StoryService()
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (existingStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this story stack' },
        { status: 403 }
      )
    }

    // Delete story stack
    await storyService.deleteStoryStack(id)

    return NextResponse.json({
      success: true,
      message: 'Story stack deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting story stack:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete story stack' },
      { status: 500 }
    )
  }
}
