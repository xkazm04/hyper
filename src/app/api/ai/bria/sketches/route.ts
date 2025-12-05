import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BriaService } from '@/lib/services/bria'
import { StoryService } from '@/lib/services/story/index'

/**
 * POST /api/ai/bria/sketches
 * Generate random character sketches with varied poses/expressions
 *
 * Request body:
 * - characterId: string - Character with trained model
 * - storyStackId: string - For authorization
 * - count: number (1-8) - Number of sketches to generate
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { characterId, storyStackId, count = 8 } = body

    if (!characterId || !storyStackId) {
      return NextResponse.json(
        { error: 'characterId and storyStackId are required' },
        { status: 400 }
      )
    }

    // Validate count
    const sketchCount = Math.max(1, Math.min(8, count))

    // Verify ownership
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(storyStackId)

    if (!storyStack || storyStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      )
    }

    // Get the character
    const character = await storyService.getCharacter(characterId)

    if (!character || character.storyStackId !== storyStackId) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    // Verify character has a trained model
    if (character.briaModelStatus !== 'completed' || !character.briaModelId) {
      return NextResponse.json(
        { error: 'Character model is not trained yet' },
        { status: 400 }
      )
    }

    // Check Bria availability
    const bria = new BriaService()
    if (!bria.isAvailable()) {
      return NextResponse.json(
        { error: 'Bria API is not configured' },
        { status: 503 }
      )
    }

    // Generate random sketches
    const captionPrefix = character.briaCaptionPrefix || character.name
    const sketches = await bria.generateRandomSketches(
      character.briaModelId,
      captionPrefix,
      sketchCount
    )

    if (sketches.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any sketches' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sketches,
      count: sketches.length,
    })
  } catch (error) {
    console.error('Error generating sketches:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate sketches' },
      { status: 500 }
    )
  }
}
