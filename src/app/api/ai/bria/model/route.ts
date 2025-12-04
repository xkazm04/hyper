import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BriaService } from '@/lib/services/bria'
import { StoryService } from '@/lib/services/story'

/**
 * GET /api/ai/bria/model?characterId=xxx&storyStackId=yyy
 * Check training status for a character's model
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')
    const storyStackId = searchParams.get('storyStackId')

    if (!characterId || !storyStackId) {
      return NextResponse.json(
        { error: 'characterId and storyStackId are required' },
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

    // If no model ID, return current status
    if (!character.briaModelId) {
      return NextResponse.json({
        status: character.briaModelStatus || 'none',
        modelId: null,
        captionPrefix: character.briaCaptionPrefix,
        errorMessage: character.briaErrorMessage,
      })
    }

    // If already completed or failed, return cached status
    if (character.briaModelStatus === 'completed' || character.briaModelStatus === 'failed') {
      return NextResponse.json({
        status: character.briaModelStatus,
        modelId: character.briaModelId,
        captionPrefix: character.briaCaptionPrefix,
        completedAt: character.briaTrainingCompletedAt,
        errorMessage: character.briaErrorMessage,
      })
    }

    // Check with Bria API for real-time status
    const bria = new BriaService()
    if (!bria.isAvailable()) {
      return NextResponse.json({
        status: character.briaModelStatus || 'none',
        modelId: character.briaModelId,
        captionPrefix: character.briaCaptionPrefix,
      })
    }

    try {
      const modelStatus = await bria.getModelStatus(character.briaModelId)

      // Update character if status changed
      if (modelStatus.status !== character.briaModelStatus) {
        const updates: Record<string, unknown> = {
          briaModelStatus: modelStatus.status,
        }

        if (modelStatus.status === 'completed') {
          updates.briaTrainingCompletedAt = new Date().toISOString()
        }

        await storyService.updateCharacter(characterId, updates)
      }

      return NextResponse.json({
        status: modelStatus.status,
        modelId: character.briaModelId,
        captionPrefix: character.briaCaptionPrefix,
        completedAt: modelStatus.completed_at,
        error: modelStatus.error_message,
      })
    } catch (apiError) {
      console.error('Error fetching Bria model status:', apiError)
      // Return cached status on API error
      return NextResponse.json({
        status: character.briaModelStatus || 'none',
        modelId: character.briaModelId,
        captionPrefix: character.briaCaptionPrefix,
      })
    }
  } catch (error) {
    console.error('Error checking model status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
}
