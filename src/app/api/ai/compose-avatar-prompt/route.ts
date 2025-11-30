import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient } from '@/lib/llm'

interface ComposeAvatarPromptRequest {
  characterName?: string
  characterAppearance?: string
  avatarStyle: 'pixel' | 'chibi' | 'portrait' | 'rpg' | 'cartoon' | 'handdrawn' | 'gothic' | 'story'
  storyArtStyle?: string
  maxLength?: number
}

interface ComposeAvatarPromptResponse {
  success: boolean
  prompt: string
  truncated: boolean
  originalLength?: number
  error?: string
}

const DEFAULT_MAX_LENGTH = 1500

const AVATAR_SYSTEM_PROMPT = `You are a prompt COMBINER for avatar generation. Your job is to MERGE inputs into a portrait prompt.

## YOUR ONLY JOB: COMBINE AND ADD FRAMING

You receive:
1. ART STYLE - Copy this VERBATIM, word for word, do not change anything
2. CHARACTER NAME - Include exactly as given  
3. CHARACTER APPEARANCE - Keep ALL details, copy most of it verbatim

## WHAT YOU DO:
1. COPY the art style text exactly as provided (every word, every detail)
2. COPY the character name
3. COPY all face, hair, skin, expression, clothing details from appearance
4. ADD at the end: "Portrait composition: Square 1:1 frame, head and shoulders, face focus."

## CRITICAL RULES:
- DO NOT summarize or condense - copy the actual text
- DO NOT remove details - keep everything
- DO NOT rewrite descriptions - use the original wording
- DO NOT cut art style instructions - they define the visual look
- ONLY skip: legs, feet, "full body", "standing pose" if mentioned
- Keep clothing, armor, accessories - they appear in portraits

## OUTPUT FORMAT:
[Art style copied verbatim]

[Character name]. [All appearance details copied from input]

Portrait composition: Square 1:1 frame, head and shoulders, face focus.

Target length: {minLength}-{maxLength} characters. Use the space - do not compress.
Output ONLY the combined prompt.`

const STYLE_PROMPTS: Record<string, string> = {
  pixel: '16-bit pixel art character face portrait. Square 1:1 frame, head and shoulders only. Limited color palette, clean pixelated edges. Classic SNES/GBA aesthetic.',
  chibi: 'Chibi style character face portrait. Square 1:1 frame, large expressive head. Exaggerated cute proportions, big sparkling eyes. Soft rounded features, bright cheerful colors.',
  portrait: 'Detailed character face portrait bust. Square 1:1 frame, head and upper shoulders. Painterly illustrated style with rich details. Focus on face, eyes, and expression. Dramatic lighting.',
  rpg: 'Modern RPG videogame character portrait. Square 1:1 frame, head and shoulders. High-quality digital art like Dragon Age or Baldur\'s Gate 3. Dramatic lighting, detailed facial features, expressive eyes.',
  cartoon: 'Stylized tactical cartoon character face portrait. Square 1:1 frame, head and shoulders. Thick clean outlines, smooth cel-shaded coloring. Muted tactical colors, clean flat tones. Serious stylized proportions.',
  handdrawn: 'Elegantly detailed artisan sketch character face portrait. Square 1:1 frame, head and shoulders. Delicate pencil gradients with confident ink strokes. Layered cross-hatching, nuanced shading, subtle grainy paper texture. Traditional pencil-and-ink artistry.',
  gothic: 'Grimdark baroque digital painting character face portrait. Square 1:1 frame, head and shoulders. Heavy brushwork, dramatic chiaroscuro lighting. Warm candlelight glow, oppressive dark atmosphere. Gothic ornate detailing.',
  story: 'Character face portrait in the story\'s art style. Square 1:1 frame, head and shoulders. Consistent with the story\'s visual aesthetic.',
}

/**
 * Build a simple fallback prompt for avatars
 */
function buildFallbackPrompt(request: ComposeAvatarPromptRequest, maxLength: number): string {
  const parts: string[] = []
  const isStoryStyle = request.avatarStyle === 'story'

  // For "story" style, use the actual story art style directly
  if (isStoryStyle && request.storyArtStyle) {
    parts.push(request.storyArtStyle)
    parts.push('Adapt for character face portrait. Square 1:1 frame, head and shoulders.')
  } else {
    // Use predefined style
    parts.push(STYLE_PROMPTS[request.avatarStyle] || STYLE_PROMPTS.rpg)
    
    // Add additional art style if provided (for non-story styles)
    if (request.storyArtStyle) {
      const truncatedStyle = request.storyArtStyle.length > 150 
        ? request.storyArtStyle.substring(0, 150) + '...' 
        : request.storyArtStyle
      parts.push(`Rendering style: ${truncatedStyle}`)
    }
  }

  // Add character name
  if (request.characterName) {
    parts.push(`Character: ${request.characterName}.`)
  }

  // Add appearance (will be truncated if needed)
  if (request.characterAppearance) {
    parts.push(`Face features from: ${request.characterAppearance}`)
  }

  parts.push('Composition: Tight framing on face. Square 1:1 aspect ratio.')

  let result = parts.join(' ')
  
  if (result.length > maxLength) {
    result = result.substring(0, maxLength - 3) + '...'
  }

  return result
}

/**
 * Get the effective style prompt, using story art style when "story" is selected
 */
function getEffectiveStylePrompt(avatarStyle: string, storyArtStyle?: string): string {
  if (avatarStyle === 'story' && storyArtStyle) {
    // For "story" style, use the actual story art style as the primary rendering style
    return `${storyArtStyle}\n\nAdapt this art style for a character face portrait. Square 1:1 frame, head and shoulders.`
  }
  return STYLE_PROMPTS[avatarStyle] || STYLE_PROMPTS.rpg
}

/**
 * Build the user prompt for the LLM
 */
function buildUserPrompt(request: ComposeAvatarPromptRequest): string {
  const sections: string[] = []
  const isStoryStyle = request.avatarStyle === 'story'
  
  // For "story" style, use the story's art style directly as the primary style
  const effectiveStylePrompt = getEffectiveStylePrompt(request.avatarStyle, request.storyArtStyle)
  
  sections.push(`=== ART STYLE (COPY THIS EXACTLY, WORD FOR WORD) ===\n${effectiveStylePrompt}`)

  // Only add additional art style section if NOT using story style (to avoid duplication)
  if (request.storyArtStyle && !isStoryStyle) {
    sections.push(`=== ADDITIONAL STYLE (ALSO COPY THIS) ===\n${request.storyArtStyle}`)
  }

  if (request.characterName) {
    sections.push(`=== CHARACTER NAME ===\n${request.characterName}`)
  }

  if (request.characterAppearance) {
    sections.push(`=== CHARACTER APPEARANCE (KEEP ALL THESE DETAILS) ===\n${request.characterAppearance}`)
  }

  return `Combine these inputs into ONE avatar portrait prompt.

INSTRUCTIONS:
1. Copy the art style section VERBATIM - do not change a single word
2. Add the character name
3. Copy ALL the appearance details - face, hair, skin, expression, clothing, accessories
4. Skip ONLY: "legs", "feet", "full body pose", "standing" - nothing else
5. End with: "Portrait composition: Square 1:1 frame, head and shoulders, face focus."

DO NOT summarize. DO NOT condense. COPY the actual text.

${sections.join('\n\n')}`
}

/**
 * POST /api/ai/compose-avatar-prompt
 * Use Groq to compose a face-focused avatar prompt from character description
 */
export async function POST(request: NextRequest): Promise<NextResponse<ComposeAvatarPromptResponse>> {
  try {
    const body: ComposeAvatarPromptRequest = await request.json()
    const maxLength = body.maxLength || DEFAULT_MAX_LENGTH
    const minLength = Math.floor(maxLength * 0.8) // Aim for at least 80% of max length

    // Validate required fields
    if (!body.avatarStyle) {
      return NextResponse.json(
        {
          success: false,
          prompt: '',
          truncated: false,
          error: 'Avatar style is required',
        },
        { status: 400 }
      )
    }

    // Validate that we have at least character name or appearance
    if (!body.characterName && !body.characterAppearance) {
      return NextResponse.json(
        {
          success: false,
          prompt: '',
          truncated: false,
          error: 'Character name or appearance is required',
        },
        { status: 400 }
      )
    }

    // Build the system prompt with length targets
    const systemPrompt = AVATAR_SYSTEM_PROMPT
      .replace(/{maxLength}/g, maxLength.toString())
      .replace(/{minLength}/g, minLength.toString())
    const userPrompt = buildUserPrompt(body)

    // Try to compose with Groq
    const groqClient = getGroqClient()
    const llmResponse = await groqClient.generate({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 600,
      temperature: 0.6, // Slightly lower for more consistent face extraction
    })

    if (!llmResponse.success || !llmResponse.response) {
      console.error('Groq avatar prompt composition failed', {
        error: llmResponse.error || 'No response from LLM',
        characterName: body.characterName,
        hasAppearance: !!body.characterAppearance,
        avatarStyle: body.avatarStyle,
      })

      // Fall back to simple composition
      const fallbackPrompt = buildFallbackPrompt(body, maxLength)

      return NextResponse.json({
        success: true,
        prompt: fallbackPrompt,
        truncated: fallbackPrompt.length >= maxLength,
        originalLength: undefined,
      })
    }

    // Clean up the response
    let composedPrompt = llmResponse.response.trim()
    
    // Check if truncation is needed
    const truncated = composedPrompt.length > maxLength
    if (truncated) {
      console.warn('Avatar prompt exceeded max length, truncating', {
        originalLength: composedPrompt.length,
        maxLength,
      })
      composedPrompt = composedPrompt.slice(0, maxLength - 3) + '...'
    }

    console.debug('Avatar prompt composition successful', {
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
    console.error('Unexpected error in compose-avatar-prompt API', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json(
      {
        success: false,
        prompt: '',
        truncated: false,
        error: error instanceof Error ? error.message : 'Failed to compose avatar prompt',
      },
      { status: 500 }
    )
  }
}
