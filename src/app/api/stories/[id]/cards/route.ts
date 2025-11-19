import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError } from '@/lib/types'

/**
 * GET /api/stories/[id]/cards
 * Get all cards for a story stack
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
        { error: 'Unauthorized to access this story stack' },
        { status: 403 }
      )
    }

    // Get story cards
    const storyCards = await storyService.getStoryCards(id)

    return NextResponse.json({
      success: true,
      storyCards,
    })
  } catch (error) {
    console.error('Error fetching story cards:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch story cards' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stories/[id]/cards
 * Create a new card for a story stack
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
    const { title, content, imageUrl, imagePrompt, orderIndex } = body

    // Create story card
    const storyCard = await storyService.createStoryCard({
      storyStackId: id,
      title: title || 'Untitled Card',
      content: content || '',
      imageUrl: imageUrl || null,
      imagePrompt: imagePrompt || null,
      orderIndex,
    })

    return NextResponse.json({
      success: true,
      storyCard,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating story card:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create story card' },
      { status: 500 }
    )
  }
}
