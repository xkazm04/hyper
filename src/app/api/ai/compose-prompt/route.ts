import { NextRequest, NextResponse } from 'next/server'
import {
  type ComposePromptRequest,
  type ComposePromptResponse,
  MAX_PROMPT_LENGTH,
} from '@/app/prompts/character'

const DEFAULT_MAX_LENGTH = MAX_PROMPT_LENGTH

/**
 * Build a character prompt by concatenating elements in priority order.
 * Truncates art style if the prompt exceeds maxLength.
 *
 * Priority order:
 * 1. Character appearance (NEVER truncated)
 * 2. Pose
 * 3. Expression/mood
 * 4. Archetype
 * 5. Art style (truncated if needed)
 */
function buildPrompt(request: ComposePromptRequest, maxLength: number): { prompt: string; truncated: boolean; originalLength?: number } {
  // Build core prompt parts (everything except art style)
  const coreParts: string[] = []

  // Header - always include
  coreParts.push('Full-body character illustration, head to toe, 2:3 vertical ratio.')

  // PRIORITY 1: Character appearance - NEVER truncated
  if (request.characterName) {
    coreParts.push(`Character: ${request.characterName}.`)
  }
  if (request.characterAppearance) {
    coreParts.push(`Appearance: ${request.characterAppearance}`)
  }

  // PRIORITY 2: Pose
  if (request.pose?.prompt) {
    coreParts.push(`Pose: ${request.pose.prompt}`)
  }

  // PRIORITY 3: Expression/mood
  if (request.mood?.prompt) {
    coreParts.push(`Expression: ${request.mood.prompt}`)
  }

  // PRIORITY 4: Archetype
  if (request.archetype?.prompt) {
    coreParts.push(`Class context: ${request.archetype.prompt}`)
  }

  const corePrompt = coreParts.join(' ')

  // If no art style, return core prompt
  if (!request.storyArtStyle) {
    const truncated = corePrompt.length > maxLength
    return {
      prompt: truncated ? corePrompt.slice(0, maxLength) : corePrompt,
      truncated,
      originalLength: truncated ? corePrompt.length : undefined,
    }
  }

  // Calculate how much space is left for art style
  // Format: "Art style: {artStyle}. " + corePrompt
  const artStylePrefix = 'Art style: '
  const separator = '. '
  const overhead = artStylePrefix.length + separator.length

  const spaceForArtStyle = maxLength - corePrompt.length - overhead

  if (spaceForArtStyle <= 0) {
    // No room for art style at all - core prompt already at/over limit
    const truncated = corePrompt.length > maxLength
    return {
      prompt: truncated ? corePrompt.slice(0, maxLength) : corePrompt,
      truncated,
      originalLength: truncated ? corePrompt.length : undefined,
    }
  }

  // Truncate art style if needed
  let artStyle = request.storyArtStyle
  const originalArtStyleLength = artStyle.length
  let artStyleTruncated = false

  if (artStyle.length > spaceForArtStyle) {
    artStyle = artStyle.slice(0, spaceForArtStyle - 3) + '...'
    artStyleTruncated = true
  }

  // Build final prompt with art style at the beginning
  const finalPrompt = `${artStylePrefix}${artStyle}${separator}${corePrompt}`

  return {
    prompt: finalPrompt,
    truncated: artStyleTruncated,
    originalLength: artStyleTruncated ? (overhead + originalArtStyleLength + corePrompt.length) : undefined,
  }
}

/**
 * POST /api/ai/compose-prompt
 * Compose a coherent character image prompt from multiple inputs using scripted composition.
 * Art style is truncated if the total prompt exceeds maxLength.
 *
 * Requirements: FR-3.1, FR-3.2
 */
export async function POST(request: NextRequest): Promise<NextResponse<ComposePromptResponse>> {
  try {
    const body: ComposePromptRequest = await request.json()
    const maxLength = body.maxLength || DEFAULT_MAX_LENGTH

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

    // Build the prompt using scripted composition
    const result = buildPrompt(body, maxLength)

    return NextResponse.json({
      success: true,
      prompt: result.prompt,
      truncated: result.truncated,
      originalLength: result.originalLength,
    })

  } catch (error) {
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
