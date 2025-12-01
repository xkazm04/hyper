import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BriaService, BriaTrainingOrchestrator } from '@/lib/services/bria'
import { StoryService } from '@/lib/services/story'

/**
 * POST /api/ai/bria/train
 * Initiate character model training with Bria AI
 *
 * Request body:
 * - characterId: string - ID of the character to train
 * - storyStackId: string - ID of the story stack (for auth)
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
    const { characterId, storyStackId } = body

    if (!characterId || !storyStackId) {
      return NextResponse.json(
        { error: 'characterId and storyStackId are required' },
        { status: 400 }
      )
    }

    // Verify ownership of the story stack
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(storyStackId)

    if (!storyStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (storyStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized to modify this story' },
        { status: 403 }
      )
    }

    // Get the character
    const character = await storyService.getCharacter(characterId)

    if (!character) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    if (character.storyStackId !== storyStackId) {
      return NextResponse.json(
        { error: 'Character does not belong to this story' },
        { status: 400 }
      )
    }

    // Check if already training or trained
    if (character.briaModelStatus === 'training') {
      return NextResponse.json(
        { error: 'Character is already being trained' },
        { status: 400 }
      )
    }

    // Validate image count (minimum 5)
    if (!character.imageUrls || character.imageUrls.length < 5) {
      return NextResponse.json(
        { error: 'At least 5 images are required for training' },
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

    // Update character status to pending
    await storyService.updateCharacter(characterId, {
      briaModelStatus: 'pending',
      briaTrainingStartedAt: new Date().toISOString(),
    })

    // Start training in background (don't await)
    const orchestrator = new BriaTrainingOrchestrator(bria)

    // Run training asynchronously
    orchestrator.startTraining(
      characterId,
      character.name,
      character.imageUrls
    ).then(async (result) => {
      // Update character with training results
      await storyService.updateCharacter(characterId, {
        briaProjectId: result.projectId,
        briaDatasetId: result.datasetId,
        briaModelId: result.modelId,
        briaCaptionPrefix: result.captionPrefix,
        briaModelStatus: 'training',
      })
      console.log(`[Bria] Training started for character ${characterId}`)
    }).catch(async (error) => {
      console.error(`[Bria] Training failed for character ${characterId}:`, error)
      await storyService.updateCharacter(characterId, {
        briaModelStatus: 'failed',
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Training initiated',
      status: 'pending',
    })
  } catch (error) {
    console.error('Error starting Bria training:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start training' },
      { status: 500 }
    )
  }
}
