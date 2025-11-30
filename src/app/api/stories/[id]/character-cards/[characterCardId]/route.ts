import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError, CharacterCardNotFoundError } from '@/lib/types'

/**
 * GET /api/stories/[id]/character-cards/[characterCardId]
 * Get a single character card
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterCardId: string }> }
) {
  try {
    const { id, characterCardId } = await params

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

    // Get character card
    const characterCard = await storyService.getCharacterCard(characterCardId)

    if (!characterCard) {
      return NextResponse.json(
        { error: 'Character card not found' },
        { status: 404 }
      )
    }

    // Verify character card belongs to the story stack
    if (characterCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Character card does not belong to this story stack' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      characterCard,
    })
  } catch (error) {
    console.error('Error fetching character card:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch character card' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/stories/[id]/character-cards/[characterCardId]
 * Update a character card
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterCardId: string }> }
) {
  try {
    const { id, characterCardId } = await params

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

    // Verify character card exists and belongs to story stack
    const existingCard = await storyService.getCharacterCard(characterCardId)

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Character card not found' },
        { status: 404 }
      )
    }

    if (existingCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Character card does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { characterId, title, content, imageIndex, showAvatar, orderIndex } = body

    // If changing character, verify new character belongs to this stack
    if (characterId && characterId !== existingCard.characterId) {
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
    }

    // Update character card
    const characterCard = await storyService.updateCharacterCard(characterCardId, {
      characterId,
      title,
      content,
      imageIndex,
      showAvatar,
      orderIndex,
    })

    return NextResponse.json({
      success: true,
      characterCard,
    })
  } catch (error) {
    console.error('Error updating character card:', error)

    if (error instanceof CharacterCardNotFoundError) {
      return NextResponse.json(
        { error: 'Character card not found' },
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
      { error: 'Failed to update character card' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stories/[id]/character-cards/[characterCardId]
 * Delete a character card
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterCardId: string }> }
) {
  try {
    const { id, characterCardId } = await params

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

    // Verify character card exists and belongs to story stack
    const existingCard = await storyService.getCharacterCard(characterCardId)

    if (!existingCard) {
      return NextResponse.json(
        { error: 'Character card not found' },
        { status: 404 }
      )
    }

    if (existingCard.storyStackId !== id) {
      return NextResponse.json(
        { error: 'Character card does not belong to this story stack' },
        { status: 400 }
      )
    }

    // Delete character card
    await storyService.deleteCharacterCard(characterCardId)

    return NextResponse.json({
      success: true,
      message: 'Character card deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting character card:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete character card' },
      { status: 500 }
    )
  }
}
