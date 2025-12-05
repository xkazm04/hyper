import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

/**
 * GET /api/stories/[id]/cards
 * Get all cards for a story stack
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

    const storyCards = await storyService.getStoryCards(id)

    return successResponse({ storyCards })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching story cards',
      fallbackMessage: 'Failed to fetch story cards',
    })
  }
}

/**
 * POST /api/stories/[id]/cards
 * Create a new card for a story stack
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
    const { title, content, imageUrl, imagePrompt, orderIndex } = body

    const storyCard = await storyService.createStoryCard({
      storyStackId: id,
      title: title || 'Untitled Card',
      content: content || '',
      imageUrl: imageUrl || null,
      imagePrompt: imagePrompt || null,
      orderIndex,
    })

    return successResponse({ storyCard }, 201)
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error creating story card',
      fallbackMessage: 'Failed to create story card',
    })
  }
}
