import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BriaService } from '@/lib/services/bria'
import { StoryService } from '@/lib/services/story/index'

/**
 * POST /api/ai/bria/reimagine
 * Insert a trained character into a scene image
 *
 * Request body:
 * - characterId: string - Character with trained model
 * - storyStackId: string - For authorization
 * - sceneImageUrl: string - The scene to insert character into
 * - characterImageUrl: string (optional) - Reference image of the character for style guidance
 * - prompt: string - Additional prompt for the scene (describes how to insert character)
 * - structureStrength: number (0-1) - How much to preserve scene structure
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
    const {
      characterId,
      storyStackId,
      sceneImageUrl,
      characterImageUrl,
      prompt,
      structureStrength = 0.6,
    } = body

    if (!characterId || !storyStackId || !sceneImageUrl) {
      return NextResponse.json(
        { error: 'characterId, storyStackId, and sceneImageUrl are required' },
        { status: 400 }
      )
    }

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

    // Convert scene image URL to base64
    const sceneResponse = await fetch(sceneImageUrl)
    if (!sceneResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch scene image' },
        { status: 400 }
      )
    }
    const sceneBuffer = await sceneResponse.arrayBuffer()
    const sceneBase64 = Buffer.from(sceneBuffer).toString('base64')

    // Build the full prompt with character prefix
    const fullPrompt = character.briaCaptionPrefix
      ? `${character.briaCaptionPrefix} ${prompt || 'in the scene'}`
      : prompt || `${character.name} in the scene`

    // Generate the reimagined image
    const result = await bria.reimagineWithScene(
      character.briaModelId,
      sceneBase64,
      fullPrompt,
      {
        structureStrength: Math.max(0, Math.min(1, structureStrength)),
        numResults: 1,
      }
    )

    return NextResponse.json({
      success: true,
      imageUrl: result.result_url,
      seed: result.seed,
      promptUsed: result.prompt_used || fullPrompt,
    })
  } catch (error) {
    console.error('Error generating reimagine:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    )
  }
}
