import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'

/**
 * GET /api/stories
 * List all story stacks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const storyStacks = await storyService.getStoryStacks(user.id)

    return successResponse({ storyStacks })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching story stacks',
      fallbackMessage: 'Failed to fetch story stacks',
    })
  }
}

/**
 * POST /api/stories
 * Create a new story stack
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { supabase } = auth
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return errorResponse('Story name must be at least 3 characters', 400)
    }

    const storyService = new StoryService(supabase)
    const storyStack = await storyService.createStoryStack({
      name: name.trim(),
      description: description?.trim() || null,
    })

    return successResponse({ storyStack }, 201)
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error creating story stack',
      fallbackMessage: 'Failed to create story stack',
    })
  }
}
