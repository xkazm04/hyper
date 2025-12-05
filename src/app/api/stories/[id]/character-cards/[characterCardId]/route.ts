import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (storyStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to access this story stack', 403)
    }

    const characterCard = await storyService.getCharacterCard(characterCardId)

    if (!characterCard) {
      return errorResponse('Character card not found', 404)
    }

    if (characterCard.storyStackId !== id) {
      return errorResponse('Character card does not belong to this story stack', 400)
    }

    return successResponse({ characterCard })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching character card',
      fallbackMessage: 'Failed to fetch character card',
    })
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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (storyStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to modify this story stack', 403)
    }

    const existingCard = await storyService.getCharacterCard(characterCardId)

    if (!existingCard) {
      return errorResponse('Character card not found', 404)
    }

    if (existingCard.storyStackId !== id) {
      return errorResponse('Character card does not belong to this story stack', 400)
    }

    const body = await request.json()
    const { characterId, title, content, imageIndex, showAvatar, orderIndex } = body

    if (characterId && characterId !== existingCard.characterId) {
      const character = await storyService.getCharacter(characterId)
      if (!character) {
        return errorResponse('Character not found', 404)
      }
      if (character.storyStackId !== id) {
        return errorResponse('Character does not belong to this story stack', 400)
      }
    }

    const characterCard = await storyService.updateCharacterCard(characterCardId, {
      characterId,
      title,
      content,
      imageIndex,
      showAvatar,
      orderIndex,
    })

    return successResponse({ characterCard })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error updating character card',
      fallbackMessage: 'Failed to update character card',
    })
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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (storyStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to modify this story stack', 403)
    }

    const existingCard = await storyService.getCharacterCard(characterCardId)

    if (!existingCard) {
      return errorResponse('Character card not found', 404)
    }

    if (existingCard.storyStackId !== id) {
      return errorResponse('Character card does not belong to this story stack', 400)
    }

    await storyService.deleteCharacterCard(characterCardId)

    return successResponse({ message: 'Character card deleted successfully' })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error deleting character card',
      fallbackMessage: 'Failed to delete character card',
    })
  }
}
