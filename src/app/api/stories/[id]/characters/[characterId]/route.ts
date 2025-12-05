import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { supabase } = auth
    const storyService = new StoryService(supabase)
    const character = await storyService.getCharacter(characterId)

    if (!character) {
      return errorResponse('Character not found', 404)
    }

    return successResponse({ character })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching character',
      fallbackMessage: 'Failed to fetch character',
    })
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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { supabase } = auth
    const body = await request.json()
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

    return successResponse({ character })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error updating character',
      fallbackMessage: 'Failed to update character',
    })
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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { supabase } = auth
    const storyService = new StoryService(supabase)

    await storyService.deleteCharacter(characterId)

    return successResponse({})
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error deleting character',
      fallbackMessage: 'Failed to delete character',
    })
  }
}
