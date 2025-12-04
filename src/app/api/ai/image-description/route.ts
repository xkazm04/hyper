import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLLMCompletion } from '@/lib/services/llmClient'
import {
  SCENE_DESCRIPTION_SYSTEM_PROMPT,
  buildSceneDescriptionUserPrompt,
  truncateSceneDescription,
  MAX_SCENE_DESCRIPTION_LENGTH,
  type SceneDescriptionRequest,
  type SceneDescriptionResponse,
} from '@/app/prompts/scene'

/**
 * POST /api/ai/image-description
 * Generate image description from story content.
 *
 * Output is constrained to 1200-1500 characters. If LLM output exceeds
 * maxLength, it will be truncated (preferably at sentence boundaries).
 *
 * Body:
 * - storyContent: string - The story/scene narrative content
 * - artStylePrompt?: string - Art style to consider
 * - existingDescription?: string - Existing description to refine
 * - maxLength?: number - Maximum output length (default: 1500)
 */
export async function POST(request: NextRequest): Promise<NextResponse<SceneDescriptionResponse>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          description: '',
          truncated: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      )
    }

    // Parse request body
    const body: SceneDescriptionRequest = await request.json()
    const { storyContent, artStylePrompt, existingDescription } = body
    const maxLength = body.maxLength || MAX_SCENE_DESCRIPTION_LENGTH

    if (!storyContent) {
      return NextResponse.json(
        {
          success: false,
          description: '',
          truncated: false,
          error: 'Story content is required',
        },
        { status: 400 }
      )
    }

    // Build the user prompt using shared prompt builder
    const userPrompt = buildSceneDescriptionUserPrompt(
      storyContent,
      artStylePrompt,
      existingDescription
    )

    // Use LLM to generate the image description
    const result = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt: SCENE_DESCRIPTION_SYSTEM_PROMPT,
      maxTokens: 1024,
    })

    if (!result.content) {
      return NextResponse.json(
        {
          success: false,
          description: '',
          truncated: false,
          error: 'Failed to generate image description',
        },
        { status: 500 }
      )
    }

    // Clean up the response
    let description = result.content.trim()

    // Remove any markdown formatting if present
    description = description
      .replace(/^```[\w]*\n?/g, '')
      .replace(/\n?```$/g, '')
      .replace(/^["']|["']$/g, '')
      .trim()

    // Truncate if exceeds maxLength
    const truncateResult = truncateSceneDescription(description, maxLength)

    return NextResponse.json({
      success: true,
      description: truncateResult.description,
      truncated: truncateResult.truncated,
      originalLength: truncateResult.originalLength,
      provider: result.provider,
      model: result.model,
    })
  } catch (error) {
    console.error('Error generating image description:', error)

    return NextResponse.json(
      {
        success: false,
        description: '',
        truncated: false,
        error: error instanceof Error ? error.message : 'Failed to generate image description',
      },
      { status: 500 }
    )
  }
}
