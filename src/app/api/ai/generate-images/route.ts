import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { LeonardoService } from '@/lib/services/leonardo'

/**
 * POST /api/ai/generate-images
 * Generate images using Leonardo AI API directly
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

    // Check if Leonardo API is available
    if (!LeonardoService.isAvailable()) {
      return NextResponse.json(
        { error: 'Leonardo API is not configured. Please set LEONARDO_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      prompt,
      numImages = 2,
      width = 512,
      height = 512,
      model,
      presetStyle,
      negativePrompt,
      referenceImages,
      referenceStrength = 0.75,
    } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Initialize Leonardo service
    const leonardo = new LeonardoService()

    // Generate images
    const result = await leonardo.generateImages({
      prompt: prompt.trim(),
      width,
      height,
      numImages: Math.min(Math.max(numImages, 1), 8), // Clamp between 1-8
      model,
      presetStyle,
      negativePrompt,
      referenceImages: referenceImages?.slice(0, 4), // Max 4 references
      referenceStrength,
    })

    if (!result.success || result.images.length === 0) {
      return NextResponse.json(
        { error: result.error || 'No images generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images: result.images,
      generationId: result.generationId,
      provider: result.provider,
      prompt: result.prompt,
    })

  } catch (error) {
    console.error('Error generating images:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Leonardo API is not properly configured' },
          { status: 503 }
        )
      }
      if (error.message.includes('timed out')) {
        return NextResponse.json(
          { error: 'Image generation timed out. Please try again.' },
          { status: 504 }
        )
      }
      if (error.message.includes('failed')) {
        return NextResponse.json(
          { error: 'Image generation failed. Please try a different prompt.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    )
  }
}
