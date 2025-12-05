import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

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

    const characterCards = await storyService.getCharacterCards(id)

    return successResponse({ characterCards })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching character cards',
      fallbackMessage: 'Failed to fetch character cards',
    })
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

    const body = await request.json()
    const { characterId, title, content, imageIndex, showAvatar, orderIndex } = body

    if (!characterId) {
      return errorResponse('characterId is required', 400)
    }

    const character = await storyService.getCharacter(characterId)
    if (!character) {
      return errorResponse('Character not found', 404)
    }

    if (character.storyStackId !== id) {
      return errorResponse('Character does not belong to this story stack', 400)
    }

    const characterCard = await storyService.createCharacterCard({
      storyStackId: id,
      characterId,
      title: title || null,
      content: content || null,
      imageIndex: imageIndex ?? 0,
      showAvatar: showAvatar ?? false,
      orderIndex,
    })

    return successResponse({ characterCard }, 201)
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error creating character card',
      fallbackMessage: 'Failed to create character card',
    })
  }
}
