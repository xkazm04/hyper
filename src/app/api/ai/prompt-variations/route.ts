import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generatePromptVariations } from '@/lib/services/promptVariation'

/**
 * POST /api/ai/prompt-variations
 * Generate prompt variations using Anthropic
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
    const { prompt, count = 4 } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate variations
    const result = await generatePromptVariations(prompt.trim(), count)

    return NextResponse.json({
      success: true,
      variations: result.variations,
      originalPrompt: result.originalPrompt,
    })

  } catch (error) {
    console.error('Error generating prompt variations:', error)

    return NextResponse.json(
      { error: 'Failed to generate prompt variations' },
      { status: 500 }
    )
  }
}
