import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError, StoryNotFoundError } from '@/lib/types'

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

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const storyService = new StoryService(supabase)
    const existingStack = await storyService.getStoryStack(id)

    if (!existingStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (existingStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this story stack' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { artStyleId, customArtStylePrompt, artStyleSource, extractedStyleImageUrl } = body

    // Validate input
    const validSources = ['preset', 'custom', 'extracted'] as const
    if (artStyleSource && !validSources.includes(artStyleSource)) {
      return NextResponse.json(
        { error: 'Invalid art style source. Must be preset, custom, or extracted.' },
        { status: 400 }
      )
    }

    // Update the art style fields in the database
    // Using type assertion because Supabase types don't include our new columns yet
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
      return NextResponse.json(
        { error: 'Failed to update art style' },
        { status: 500 }
      )
    }

    // Cast to our expected type
    const updatedStack = data as StoryStackRow

    // Map database fields to TypeScript interface
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
    console.error('Error updating art style:', error)

    if (error instanceof StoryNotFoundError) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update art style' },
      { status: 500 }
    )
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

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if (storyStack.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access this story stack' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      artStyleId: storyStack.artStyleId,
      customArtStylePrompt: storyStack.customArtStylePrompt,
      artStyleSource: storyStack.artStyleSource,
      extractedStyleImageUrl: storyStack.extractedStyleImageUrl,
    })
  } catch (error) {
    console.error('Error fetching art style:', error)
    return NextResponse.json(
      { error: 'Failed to fetch art style' },
      { status: 500 }
    )
  }
}
