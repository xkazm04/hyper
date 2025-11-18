import { NextRequest, NextResponse } from 'next/server'
import { ImageServiceServer } from '@/lib/services/image-server'
import { ImageGenerationError } from '@/lib/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10 // 10 image generations per hour

/**
 * POST /api/ai/generate-image
 * Generate an AI image and upload it to Supabase Storage
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

    // Rate limiting
    const userId = user.id
    const now = Date.now()
    const userLimit = rateLimitMap.get(userId)

    if (userLimit) {
      if (now < userLimit.resetTime) {
        if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          )
        }
        userLimit.count++
      } else {
        // Reset the window
        rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
      }
    } else {
      rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    }

    // Parse request body
    const body = await request.json()
    const { prompt, storyStackId, provider, size, quality } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!storyStackId || typeof storyStackId !== 'string') {
      return NextResponse.json(
        { error: 'Story stack ID is required' },
        { status: 400 }
      )
    }

    // Verify user owns the story stack
    const { data: stack, error: stackError } = await supabase
      .from('story_stacks')
      .select('id, owner_id')
      .eq('id', storyStackId)
      .single()

    if (stackError || !stack) {
      return NextResponse.json(
        { error: 'Story stack not found' },
        { status: 404 }
      )
    }

    if ((stack as any).owner_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this story stack' },
        { status: 403 }
      )
    }

    // Generate image
    const imageService = new ImageServiceServer()
    const result = await imageService.generateImage({
      prompt,
      provider: provider || 'openai',
      size: size || '1024x1024',
      quality: quality || 'standard',
    })

    // Upload the generated image to Supabase Storage
    const permanentUrl = await imageService.uploadImageFromUrl(result.imageUrl, storyStackId)

    return NextResponse.json({
      success: true,
      imageUrl: permanentUrl,
      prompt: result.prompt,
      provider: result.provider,
    })
  } catch (error) {
    console.error('Image generation error:', error)

    if (error instanceof ImageGenerationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
