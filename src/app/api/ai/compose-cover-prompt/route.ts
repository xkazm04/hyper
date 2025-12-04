import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLLMCompletion } from '@/lib/services/llmClient'

// System prompt for generating cover image prompts
const COVER_SYSTEM_PROMPT = `You are an AI image prompt specialist. Your task is to transform a story concept into an effective image generation prompt for a book cover.

IMPORTANT CONSTRAINTS:
- Output ONLY the image prompt, nothing else
- The prompt MUST be under 400 characters total
- Do NOT include any explanation, labels, or multiple options

THE PROMPT MUST:
- Be a single paragraph of 40-60 words
- Start with the provided art style
- Include a focal visual element representing the protagonist or central conflict
- Describe atmospheric background elements from the story
- Specify lighting conditions and mood
- Include a color palette (2-3 dominant colors)
- End with "no text, no typography"

STRUCTURE:
"[art style], [main subject/focal point], [supporting visual elements], [background/environment], [lighting], [colors], [mood keywords], no text, no typography"

GUIDELINES:
- Extract the most visually striking and symbolic elements
- Prefer silhouettes, dramatic scale contrasts, and symbolic imagery
- Match visual style to genre expectations
- Focus on the protagonist or central conflict`

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

    const body = await request.json()
    const { storyConcept, artStyle } = body

    if (!storyConcept) {
      return NextResponse.json(
        { error: 'Story concept is required' },
        { status: 400 }
      )
    }

    if (!artStyle) {
      return NextResponse.json(
        { error: 'Art style is required' },
        { status: 400 }
      )
    }

    const userPrompt = `Art style to use: ${artStyle}

Story concept: ${storyConcept}

Generate a single image prompt for this story's book cover. Remember: output ONLY the prompt, under 400 characters.`

    const response = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt: COVER_SYSTEM_PROMPT,
      maxTokens: 300,
      useFastModel: true,
    })

    // Clean up the response - remove any quotes or extra whitespace
    let prompt = response.content.trim()

    // Remove surrounding quotes if present
    if ((prompt.startsWith('"') && prompt.endsWith('"')) ||
        (prompt.startsWith("'") && prompt.endsWith("'"))) {
      prompt = prompt.slice(1, -1)
    }

    // Ensure it ends with no text directive
    if (!prompt.toLowerCase().includes('no text')) {
      prompt = prompt.replace(/[,.\s]+$/, '') + ', no text, no typography'
    }

    // Final safety check - truncate if still over limit
    if (prompt.length > 1400) {
      prompt = prompt.substring(0, 1397) + '...'
    }

    return NextResponse.json({
      success: true,
      prompt,
    })

  } catch (error) {
    console.error('Error composing cover prompt:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compose cover prompt' },
      { status: 500 }
    )
  }
}
