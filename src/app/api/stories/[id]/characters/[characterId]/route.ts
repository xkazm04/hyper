import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/services/story'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CharacterNotFoundError } from '@/lib/types'

/**
 * GET /api/stories/[id]/characters/[characterId]
 * Get a single character by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { characterId } = await params
    const supabase = await createServerSupabaseClient()
    const storyService = new StoryService(supabase)

    const character = await storyService.getCharacter(characterId)

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ character })
  } catch (error) {
    console.error('Error fetching character:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch character' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/stories/[id]/characters/[characterId]
 * Update a character
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { characterId } = await params
    const body = await request.json()
    const supabase = await createServerSupabaseClient()
    const storyService = new StoryService(supabase)

    const character = await storyService.updateCharacter(characterId, {
      name: body.name,
      appearance: body.appearance,
      imageUrls: body.imageUrls,
      imagePrompts: body.imagePrompts,
      avatarUrl: body.avatarUrl,
      avatarPrompt: body.avatarPrompt,
      orderIndex: body.orderIndex,
    })

    return NextResponse.json({ character })
  } catch (error) {
    if (error instanceof CharacterNotFoundError) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }
    console.error('Error updating character:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update character' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/stories/[id]/characters/[characterId]
 * Delete a character
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { characterId } = await params
    const supabase = await createServerSupabaseClient()
    const storyService = new StoryService(supabase)

    await storyService.deleteCharacter(characterId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting character:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete character' },
      { status: 500 }
    )
  }
}
