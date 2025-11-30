import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { processImage, isBriaAvailable, type BriaAction } from '@/lib/services/briaClient'

/**
 * POST /api/ai/bria/process
 * Process an image with Bria AI
 *
 * Body:
 * - imageUrl: string - URL of the image to process
 * - action: 'blur' | 'enhance' | 'expand' - The processing action
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Bria is available
    if (!isBriaAvailable()) {
      return NextResponse.json(
        { error: 'Bria AI is not configured' },
        { status: 503 }
      )
    }

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
    const { imageUrl, action } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    if (!action || !['blur', 'enhance', 'expand'].includes(action)) {
      return NextResponse.json(
        { error: 'Valid action is required (blur, enhance, expand)' },
        { status: 400 }
      )
    }

    // Process the image
    const result = await processImage(imageUrl, action as BriaAction)

    return NextResponse.json({
      success: true,
      resultUrl: result.result_url,
      action,
    })
  } catch (error) {
    console.error('Error processing image with Bria:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process image' },
      { status: 500 }
    )
  }
}
