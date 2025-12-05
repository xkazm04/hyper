import { NextRequest } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  successResponse,
} from '@/lib/api/auth'

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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { supabase } = auth
    const storyService = new StoryService(supabase)
    const characters = await storyService.getCharacters(stackId)

    return successResponse({ characters })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching characters',
      fallbackMessage: 'Failed to fetch characters',
    })
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

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { supabase } = auth
    const body = await request.json()
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

    return successResponse({ character }, 201)
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error creating character',
      fallbackMessage: 'Failed to create character',
    })
  }
}
