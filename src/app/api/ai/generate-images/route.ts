import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/ai/generate-images
 * Generate multiple images using the local FastAPI image service
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
    const {
      prompt,
      numImages = 2,
      width = 512,
      height = 512,
      provider = 'bria'
    } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Get image service URL from environment
    const imageServiceUrl = process.env.IMAGE_SERVICE_URL || 'http://localhost:8000'

    // Generate a project ID for the image service
    const projectId = uuidv4()

    // Call the FastAPI image generation service
    const response = await fetch(`${imageServiceUrl}/api/unified/generate/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        project_id: projectId,
        width,
        height,
        num_images: Math.min(Math.max(numImages, 1), 10), // Clamp between 1-10
        provider,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Image service error:', errorData)
      return NextResponse.json(
        { error: errorData.detail || 'Image generation service failed' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract image URLs from the response
    // The FastAPI service returns images in the format:
    // { images: [{ url: string, ... }], ... }
    const images = data.images?.map((img: { url: string; width?: number; height?: number }) => ({
      url: img.url,
      width: img.width || width,
      height: img.height || height,
    })) || []

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images generated' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      images,
      generationId: data.generation_id,
      provider: data.provider,
      prompt: data.prompt,
    })

  } catch (error) {
    console.error('Error generating images:', error)

    // Check if it's a connection error to the image service
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Image generation service is not available. Please ensure the service is running.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate images' },
      { status: 500 }
    )
  }
}
