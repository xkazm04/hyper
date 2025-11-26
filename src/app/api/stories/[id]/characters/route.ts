import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/services/story'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET /api/stories/[id]/characters
 * Get all characters for a story stack
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stackId } = await params
    const supabase = await createServerSupabaseClient()
    const storyService = new StoryService(supabase)

    const characters = await storyService.getCharacters(stackId)

    return NextResponse.json({ characters })
  } catch (error) {
    console.error('Error fetching characters:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch characters' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stories/[id]/characters
 * Create a new character for a story stack
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: stackId } = await params
    const body = await request.json()
    const supabase = await createServerSupabaseClient()
    const storyService = new StoryService(supabase)

    const character = await storyService.createCharacter({
      storyStackId: stackId,
      name: body.name || 'Unnamed Character',
      appearance: body.appearance || '',
      imageUrls: body.imageUrls || [],
      imagePrompts: body.imagePrompts || [],
      avatarUrl: body.avatarUrl || null,
      avatarPrompt: body.avatarPrompt || null,
      orderIndex: body.orderIndex,
    })

    return NextResponse.json({ character }, { status: 201 })
  } catch (error) {
    console.error('Error creating character:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create character' },
      { status: 500 }
    )
  }
}
