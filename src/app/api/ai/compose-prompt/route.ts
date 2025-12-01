import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient } from '@/lib/llm'

interface PromptOption {
  label: string
  prompt: string
}

interface ComposePromptRequest {
  characterName?: string
  characterAppearance?: string
  archetype?: PromptOption
  pose?: PromptOption
  mood?: PromptOption
  storyArtStyle?: string
  maxLength?: number
}

interface ComposePromptResponse {
  success: boolean
  prompt: string
  truncated: boolean
  originalLength?: number
  error?: string
}

const DEFAULT_MAX_LENGTH = 1500

const COMPOSE_SYSTEM_PROMPT = `You are an expert at composing rich, detailed image generation prompts for character illustrations.
Your task is to combine multiple prompt elements into a single, coherent, DETAILED prompt for a FULL-BODY character illustration.

CRITICAL LENGTH REQUIREMENT - MUST NOT EXCEED:
- ABSOLUTE MAXIMUM: {maxLength} characters - NEVER exceed this limit
- Target output: {minLength} to {maxLength} characters
- USE THE FULL SPACE AVAILABLE - longer, more detailed prompts produce better images
- Include ALL provided details, expand with relevant visual descriptors
- DO NOT summarize or shorten - elaborate and enrich instead

COMPOSITION REQUIREMENT:
- Output is for a FULL-BODY character illustration in 2:3 vertical ratio
- Include head-to-toe character details: face, hair, clothing, accessories, footwear
- Describe the full figure stance, posture, and how the character fills the vertical frame
- Include ground/floor context and environmental hints for the bottom of the frame
- IMPORTANT: Do NOT use the word "portrait" - use "illustration" or "character art" instead

PRIORITY ORDER (highest to lowest):
1. CHARACTER APPEARANCE - PRESERVE EXACTLY AND COMPLETELY. Include every visual detail provided.
2. Pose and Expression - Include full descriptions, adapt to complement the character's look
3. Archetype - Include equipment, props, and class-specific visual details
4. Art Style - Apply as rendering technique throughout the description

Rules:
1. Output MUST be between {minLength} and {maxLength} characters - NEVER EXCEED {maxLength}
2. CHARACTER APPEARANCE IS SACRED - include ALL appearance details verbatim
3. Include rich visual details: textures, materials, lighting suggestions, compositional elements
4. Art style affects HOW the character is rendered (linework, colors, shading), not WHAT they look like
5. Be specific, descriptive, and verbose - more detail = better results
6. Output ONLY the prompt text, no explanations or meta-commentary
7. If approaching the limit, prioritize character appearance over archetype details
8. NEVER use the word "portrait" - it triggers close-up face framing

Input elements:
- Character: Name and appearance details (HIGHEST PRIORITY - preserve completely)
- Pose: Body position and stance (include full description)
- Expression: Facial expression and mood (include full description)
- Archetype: Character class/role with equipment details
- Art Style: The rendering technique to apply throughout`

/**
 * Build a simple fallback prompt by concatenating available elements
 * Prioritizes character appearance as the most important element
 * NOTE: Avoids "portrait" to prevent close-up face framing
 */
function buildFallbackPrompt(request: ComposePromptRequest): string {
  const parts: string[] = []

  // Start with art style as rendering technique, specify full-body
  // Use "vertical ratio" instead of "portrait ratio" to avoid triggering face close-ups
  if (request.storyArtStyle) {
    parts.push(`Full-body character illustration, head to toe, 2:3 vertical ratio. ${request.storyArtStyle}`)
  } else {
    parts.push('Full-body character illustration, head to toe, 2:3 vertical ratio.')
  }

  // PRIORITY 1: Character appearance - ALWAYS include fully (most important)
  if (request.characterName) {
    parts.push(`Character: ${request.characterName}.`)
  }
  if (request.characterAppearance) {
    parts.push(`Appearance: ${request.characterAppearance}.`)
  }

  // PRIORITY 2: Pose
  if (request.pose?.prompt) {
    parts.push(`Pose: ${request.pose.prompt}`)
  }

  // PRIORITY 3: Expression/mood
  if (request.mood?.prompt) {
    parts.push(`Expression: ${request.mood.prompt}`)
  }

  // PRIORITY 4: Archetype (lowest priority for visuals)
  if (request.archetype?.prompt) {
    parts.push(`Class context: ${request.archetype.prompt}`)
  }

  return parts.join(' ')
}

/**
 * Build the user prompt for the LLM
 * Structures input to emphasize character appearance priority
 */
function buildUserPrompt(request: ComposePromptRequest): string {
  const sections: string[] = []

  // Character appearance first - marked as highest priority
  if (request.characterName || request.characterAppearance) {
    const charParts: string[] = []
    if (request.characterName) charParts.push(`Name: ${request.characterName}`)
    if (request.characterAppearance) charParts.push(`Visual details: ${request.characterAppearance}`)
    sections.push(`[HIGHEST PRIORITY - PRESERVE COMPLETELY] Character Appearance:\n${charParts.join('\n')}`)
  }

  if (request.pose) {
    sections.push(`[PRIORITY 2] Pose (${request.pose.label}): ${request.pose.prompt}`)
  }

  if (request.mood) {
    sections.push(`[PRIORITY 3] Expression/Mood (${request.mood.label}): ${request.mood.prompt}`)
  }

  if (request.archetype) {
    sections.push(`[PRIORITY 4 - Can compress if needed] Archetype (${request.archetype.label}): ${request.archetype.prompt}`)
  }

  if (request.storyArtStyle) {
    sections.push(`[RENDERING STYLE - Apply as technique, don't alter character features] Art Style: ${request.storyArtStyle}`)
  }

  return `Compose a DETAILED, RICH image generation prompt for a FULL-BODY character illustration (2:3 vertical ratio, head to toe).

CRITICAL LENGTH CONSTRAINT: Your output MUST be between 1200-1500 characters. NEVER exceed 1500 characters. Include ALL details provided and expand with relevant visual descriptors. DO NOT summarize - be verbose and descriptive.

Remember: Character appearance details are SACRED and must be preserved completely. Describe the FULL figure from head to toe. Do NOT use the word "portrait" anywhere.

${sections.join('\n\n')}`
}

/**
 * POST /api/ai/compose-prompt
 * Use Groq to compose a coherent character image prompt from multiple inputs
 * 
 * Requirements: FR-3.1, FR-3.2
 */
export async function POST(request: NextRequest): Promise<NextResponse<ComposePromptResponse>> {
  try {
    const body: ComposePromptRequest = await request.json()
    const maxLength = body.maxLength || DEFAULT_MAX_LENGTH
    const minLength = Math.floor(maxLength * 0.85) // Aim for at least 85% of max length

    // Validate that we have at least some input
    const hasInput = body.characterName || 
                     body.characterAppearance || 
                     body.archetype || 
                     body.pose || 
                     body.mood || 
                     body.storyArtStyle

    if (!hasInput) {
      return NextResponse.json(
        {
          success: false,
          prompt: '',
          truncated: false,
          error: 'At least one prompt element is required',
        },
        { status: 400 }
      )
    }

    // Build the system prompt with min and max length targets
    const systemPrompt = COMPOSE_SYSTEM_PROMPT
      .replace(/{maxLength}/g, maxLength.toString())
      .replace(/{minLength}/g, minLength.toString())
    const userPrompt = buildUserPrompt(body)

    // Try to compose with Groq
    const groqClient = getGroqClient()
    const llmResponse = await groqClient.generate({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 800, // Increased to allow longer, more detailed prompts
      temperature: 0.7, // Some creativity but not too random
    })

    if (!llmResponse.success || !llmResponse.response) {
      // Log the error for monitoring (NFR-2)
      console.error('Groq prompt composition failed', {
        error: llmResponse.error || 'No response from LLM',
        inputSummary: {
          hasCharacterName: !!body.characterName,
          hasCharacterAppearance: !!body.characterAppearance,
          hasArchetype: !!body.archetype,
          hasPose: !!body.pose,
          hasMood: !!body.mood,
          hasArtStyle: !!body.storyArtStyle,
        },
        maxLength,
      })

      // Fall back to simple concatenation
      const fallbackPrompt = buildFallbackPrompt(body)
      const truncated = fallbackPrompt.length > maxLength
      const finalPrompt = truncated ? fallbackPrompt.slice(0, maxLength) : fallbackPrompt

      return NextResponse.json({
        success: true,
        prompt: finalPrompt,
        truncated,
        originalLength: truncated ? fallbackPrompt.length : undefined,
      })
    }

    // Clean up the response (remove any extra whitespace/newlines)
    let composedPrompt = llmResponse.response.trim()
    
    // Check if truncation is needed
    const truncated = composedPrompt.length > maxLength
    if (truncated) {
      console.warn('Composed prompt exceeded max length, truncating', {
        originalLength: composedPrompt.length,
        maxLength,
      })
      composedPrompt = composedPrompt.slice(0, maxLength)
    }

    console.debug('Prompt composition successful', {
      promptLength: composedPrompt.length,
      truncated,
    })

    return NextResponse.json({
      success: true,
      prompt: composedPrompt,
      truncated,
      originalLength: truncated ? llmResponse.response.length : undefined,
    })

  } catch (error) {
    // Log unexpected errors with details (NFR-2)
    console.error('Unexpected error in compose-prompt API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        success: false,
        prompt: '',
        truncated: false,
        error: error instanceof Error ? error.message : 'Failed to compose prompt',
      },
      { status: 500 }
    )
  }
}
