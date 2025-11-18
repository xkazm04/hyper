import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError, StoryNotFoundError } from '@/lib/types'

/**
 * POST /api/stories/[id]/publish
 * Publish a story stack with a generated slug
 */
export async function POST(
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
        { error: 'Unauthorized to publish this story stack' },
        { status: 403 }
      )
    }

    // Validate that story has at least one card
    const cards = await storyService.getStoryCards(id)
    if (cards.length === 0) {
      return NextResponse.json(
        { error: 'Cannot publish story with no cards' },
        { status: 400 }
      )
    }

    // Publish story stack
    const storyStack = await storyService.publishStoryStack(id)

    return NextResponse.json({
      success: true,
      storyStack,
      shareableUrl: `/play/${storyStack.slug}`,
    })
  } catch (error) {
    console.error('Error publishing story stack:', error)

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
      { error: 'Failed to publish story stack' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stories/[id]/publish
 * Unpublish a story stack
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
        { error: 'Unauthorized to unpublish this story stack' },
        { status: 403 }
      )
    }

    // Unpublish story stack
    const storyStack = await storyService.unpublishStoryStack(id)

    return NextResponse.json({
      success: true,
      storyStack,
      message: 'Story stack unpublished successfully',
    })
  } catch (error) {
    console.error('Error unpublishing story stack:', error)

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
      { error: 'Failed to unpublish story stack' },
      { status: 500 }
    )
  }
}
