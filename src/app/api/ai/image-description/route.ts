import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLLMCompletion } from '@/lib/services/llmClient'

/**
 * System prompt for generating image description from story content
 * Focuses on visual elements suitable for image generation
 */
const IMAGE_DESCRIPTION_SYSTEM_PROMPT = `You are an expert at converting narrative story content into visual scene descriptions suitable for image generation.

Your task is to analyze story content and extract/generate a visual description that captures the scene for image generation purposes.

RULES:
1. Focus on VISUAL elements only - what can be seen in the scene
2. Describe subjects, their appearance, positioning, and actions
3. Include environment details: setting, time of day, weather, atmosphere
4. Mention lighting conditions and mood
5. If an art style is provided, consider how the scene should look in that style
6. Ignore dialogue and internal thoughts - focus on what's visually happening
7. Output should be 2-4 paragraphs describing the visual scene
8. If existing description is provided, refine and enhance it based on the story content

OUTPUT FORMAT:
Write the visual description as flowing prose, describing the scene as if you were painting it. Start with the main subjects, then environment, then atmosphere and lighting.`

/**
 * POST /api/ai/image-description
 * Generate image description from story content
 *
 * Body:
 * - storyContent: string - The story/scene narrative content
 * - artStylePrompt?: string - Art style to consider
 * - existingDescription?: string - Existing description to refine
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
    const { storyContent, artStylePrompt, existingDescription } = body

    if (!storyContent) {
      return NextResponse.json(
        { error: 'Story content is required' },
        { status: 400 }
      )
    }

    // Build the user prompt
    let userPrompt = 'Generate a visual scene description from the following story content.\n\n'

    userPrompt += `Story Content:\n${storyContent}\n\n`

    if (artStylePrompt) {
      userPrompt += `Art Style Context:\n${artStylePrompt}\n\n`
      userPrompt += 'Consider how this scene should appear when rendered in this art style.\n\n'
    }

    if (existingDescription) {
      userPrompt += `Current Description (refine and enhance):\n${existingDescription}\n\n`
    }

    userPrompt += 'Generate a visual description of this scene suitable for image generation. Focus on what can be seen - subjects, environment, lighting, and atmosphere. Output only the description, no commentary.'

    // Use LLM to generate the image description
    const result = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt: IMAGE_DESCRIPTION_SYSTEM_PROMPT,
      maxTokens: 1024,
    })

    if (!result.content) {
      return NextResponse.json(
        { error: 'Failed to generate image description' },
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

    return NextResponse.json({
      success: true,
      description,
      provider: result.provider,
      model: result.model
    })
  } catch (error) {
    console.error('Error generating image description:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image description' },
      { status: 500 }
    )
  }
}
