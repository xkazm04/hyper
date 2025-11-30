import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError } from '@/lib/types'

/**
 * GET /api/stories/[id]/character-cards
 * Get all character cards for a story stack
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

    // Get character cards
    const characterCards = await storyService.getCharacterCards(id)

    return NextResponse.json({
      success: true,
      characterCards,
    })
  } catch (error) {
    console.error('Error fetching character cards:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch character cards' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stories/[id]/character-cards
 * Create a new character card for a story stack
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
    const { characterId, title, content, imageIndex, showAvatar, orderIndex } = body

    if (!characterId) {
      return NextResponse.json(
        { error: 'characterId is required' },
        { status: 400 }
      )
    }

    // Verify character exists and belongs to this stack
    const character = await storyService.getCharacter(characterId)
    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    if (character.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Character does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Create character card
    const characterCard = await storyService.createCharacterCard({
      storyStackId: id,
      characterId,
      title: title || null,
      content: content || null,
      imageIndex: imageIndex ?? 0,
      showAvatar: showAvatar ?? false,
      orderIndex,
    })

    return NextResponse.json({
      success: true,
      characterCard,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating character card:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create character card' },
      { status: 500 }
    )
  }
}
