import { NextRequest, NextResponse } from 'next/server'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
} from '@/lib/api/auth'

// Define the database row type for story_stacks
interface StoryStackRow {
  id: string
  owner_id: string
  name: string
  description: string | null
  is_published: boolean
  published_at: string | null
  slug: string | null
  first_card_id: string | null
  art_style_id: string | null
  custom_art_style_prompt: string | null
  art_style_source: 'preset' | 'custom' | 'extracted'
  extracted_style_image_url: string | null
  created_at: string
  updated_at: string
}

/**
 * PUT /api/stories/[id]/art-style
 * Update a story's art style settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (existingStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to modify this story stack', 403)
    }

    const body = await request.json()
    const { artStyleId, customArtStylePrompt, artStyleSource, extractedStyleImageUrl } = body

    const validSources = ['preset', 'custom', 'extracted'] as const
    if (artStyleSource && !validSources.includes(artStyleSource)) {
      return errorResponse('Invalid art style source. Must be preset, custom, or extracted.', 400)
    }

    const updatePayload = {
      art_style_id: artStyleId,
      custom_art_style_prompt: customArtStylePrompt,
      art_style_source: artStyleSource || 'preset',
      extracted_style_image_url: extractedStyleImageUrl,
      updated_at: new Date().toISOString(),
    }

    const { data, error: updateError } = await (supabase
      .from('story_stacks') as any)
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating art style:', updateError)
      return errorResponse('Failed to update art style', 500)
    }

    const updatedStack = data as StoryStackRow

    const mappedStack = {
      id: updatedStack.id,
      ownerId: updatedStack.owner_id,
      name: updatedStack.name,
      description: updatedStack.description,
      isPublished: updatedStack.is_published,
      publishedAt: updatedStack.published_at,
      slug: updatedStack.slug,
      firstCardId: updatedStack.first_card_id,
      artStyleId: updatedStack.art_style_id,
      customArtStylePrompt: updatedStack.custom_art_style_prompt,
      artStyleSource: updatedStack.art_style_source,
      extractedStyleImageUrl: updatedStack.extracted_style_image_url,
      createdAt: updatedStack.created_at,
      updatedAt: updatedStack.updated_at,
    }

    return NextResponse.json(mappedStack)
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error updating art style',
      fallbackMessage: 'Failed to update art style',
    })
  }
}

/**
 * GET /api/stories/[id]/art-style
 * Get a story's current art style settings
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

    return NextResponse.json({
      artStyleId: storyStack.artStyleId,
      customArtStylePrompt: storyStack.customArtStylePrompt,
      artStyleSource: storyStack.artStyleSource,
      extractedStyleImageUrl: storyStack.extractedStyleImageUrl,
    })
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error fetching art style',
      fallbackMessage: 'Failed to fetch art style',
    })
  }
}
