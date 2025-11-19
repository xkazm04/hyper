import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { DatabaseError } from '@/lib/types'

/**
 * GET /api/stories
 * List all story stacks for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's story stacks
    const storyService = new StoryService(supabase)
    const storyStacks = await storyService.getStoryStacks(user.id)

    return NextResponse.json({
      success: true,
      storyStacks,
    })
  } catch (error) {
    console.error('Error fetching story stacks:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch story stacks' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stories
 * Create a new story stack
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, description } = body

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Story name must be at least 3 characters' },
        { status: 400 }
      )
    }

    // Create story stack
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.createStoryStack({
      name: name.trim(),
      description: description?.trim() || null,
    })

    return NextResponse.json({
      success: true,
      storyStack,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating story stack:', error)

    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create story stack' },
      { status: 500 }
    )
  }
}
