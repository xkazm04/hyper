import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLLMCompletion } from '@/lib/services/llmClient'

/**
 * System prompt for converting content description to image generation prompt
 * Based on card_image_generation.md format
 */
const SCENE_PROMPT_SYSTEM_PROMPT = `You are an expert at synthesizing story content into highly descriptive image generation prompts.

Your task is to take a story scene description (which may be a structured breakdown or a narrative description) and convert it into a single, cohesive, and highly descriptive paragraph prompt suitable for a high-end text-to-image generation model.

RULES:
1. The prompt length MUST NOT exceed 1500 characters
2. If an art style is provided, establish it immediately at the beginning of the prompt
3. Use rich, descriptive adjectives to define textures, lighting, and mood
4. Connect the subjects and actions fluently rather than just listing them
5. Maximize detail to use a high character count for precision
6. Do not include any meta-instructions in the final output, just the prompt itself
7. Output ONLY the image generation prompt text, nothing else

STYLE GUIDELINES:
- Start with the artistic style/medium description
- Follow with the main subjects and their details
- Describe the action and composition
- Include environment and atmosphere
- End with mood and lighting details`

const SCENE_PROMPT_USER_TEMPLATE = `Convert the following story scene description into a text-to-image generation prompt.

{{#if artStylePrompt}}
Art Style to use:
{{{artStylePrompt}}}

{{/if}}
Scene Content:
{{{contentDescription}}}

{{#if moodPrompt}}
Mood Enhancement:
{{{moodPrompt}}}
{{/if}}

Generate a cohesive image generation prompt (max 1500 characters) that captures this scene. Output ONLY the prompt text.`

/**
 * POST /api/ai/scene-prompt
 * Generate an image prompt from content description
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
    const { contentDescription, artStylePrompt, moodPrompt } = body

    if (!contentDescription) {
      return NextResponse.json(
        { error: 'Content description is required' },
        { status: 400 }
      )
    }

    // Build the user prompt
    let userPrompt = 'Convert the following story scene description into a text-to-image generation prompt.\n\n'

    if (artStylePrompt) {
      userPrompt += `Art Style to use:\n${artStylePrompt}\n\n`
    }

    userPrompt += `Scene Content:\n${contentDescription}\n\n`

    if (moodPrompt) {
      userPrompt += `Mood Enhancement:\n${moodPrompt}\n\n`
    }

    userPrompt += 'Generate a cohesive image generation prompt (max 1500 characters) that captures this scene. Output ONLY the prompt text.'

    // Use LLM to generate the image prompt
    const result = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt: SCENE_PROMPT_SYSTEM_PROMPT,
      maxTokens: 1024,
    })

    if (!result.content) {
      return NextResponse.json(
        { error: 'Failed to generate scene prompt' },
        { status: 500 }
      )
    }

    // Clean up the response
    let generatedPrompt = result.content.trim()

    // Remove any markdown formatting or quotes if present
    generatedPrompt = generatedPrompt
      .replace(/^```[\w]*\n?/g, '')
      .replace(/\n?```$/g, '')
      .replace(/^["']|["']$/g, '')
      .replace(/^Here is the (?:prompt|image prompt)[^:]*:\s*/i, '')
      .trim()

    // Ensure we don't exceed 1500 characters
    if (generatedPrompt.length > 1500) {
      generatedPrompt = generatedPrompt.substring(0, 1497) + '...'
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      provider: result.provider,
      model: result.model
    })
  } catch (error) {
    console.error('Error generating scene prompt:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate scene prompt' },
      { status: 500 }
    )
  }
}
