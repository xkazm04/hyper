import { NextRequest, NextResponse } from 'next/server'
import { AVATAR_STYLE_PROMPTS } from '@/app/prompts/character'

type AvatarStyle = 'pixel' | 'chibi' | 'portrait' | 'rpg' | 'cartoon' | 'handdrawn' | 'gothic' | 'story'

interface ComposeAvatarPromptRequest {
  characterName?: string
  characterAppearance?: string
  avatarStyle: AvatarStyle
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

/**
 * Build an avatar prompt by concatenating elements.
 * Truncates art style if the prompt exceeds maxLength.
 *
 * Priority order:
 * 1. Avatar style preset (or story art style for 'story' type)
 * 2. Character name
 * 3. Character appearance (focused on face features)
 * 4. Portrait framing instruction
 * 5. Additional story art style (truncated if needed, only for non-story styles)
 */
function buildAvatarPrompt(
  request: ComposeAvatarPromptRequest,
  maxLength: number
): { prompt: string; truncated: boolean; originalLength?: number } {
  const isStoryStyle = request.avatarStyle === 'story'
  const parts: string[] = []

  // PRIORITY 1: Style prompt
  if (isStoryStyle && request.storyArtStyle) {
    // For "story" style, use the story art style directly as the primary style
    parts.push(request.storyArtStyle)
    parts.push('Adapt for character face portrait. Square 1:1 frame, head and shoulders.')
  } else {
    // Use predefined avatar style
    const stylePrompt = AVATAR_STYLE_PROMPTS[request.avatarStyle] || AVATAR_STYLE_PROMPTS.rpg
    parts.push(stylePrompt)
  }

  // PRIORITY 2: Character name
  if (request.characterName) {
    parts.push(`Character: ${request.characterName}.`)
  }

  // PRIORITY 3: Character appearance (face features)
  if (request.characterAppearance) {
    parts.push(`Face features: ${request.characterAppearance}`)
  }

  // PRIORITY 4: Portrait framing
  parts.push('Composition: Tight framing on face. Square 1:1 aspect ratio.')

  // Build core prompt without additional art style
  const corePrompt = parts.join(' ')

  // If story style or no additional art style, return core prompt
  if (isStoryStyle || !request.storyArtStyle) {
    const truncated = corePrompt.length > maxLength
    return {
      prompt: truncated ? corePrompt.slice(0, maxLength - 3) + '...' : corePrompt,
      truncated,
      originalLength: truncated ? corePrompt.length : undefined,
    }
  }

  // For non-story styles, add story art style as rendering technique if space permits
  const renderingPrefix = ' Rendering style: '
  const spaceForArtStyle = maxLength - corePrompt.length - renderingPrefix.length

  if (spaceForArtStyle <= 20) {
    // Not enough space for meaningful art style addition
    const truncated = corePrompt.length > maxLength
    return {
      prompt: truncated ? corePrompt.slice(0, maxLength - 3) + '...' : corePrompt,
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

  const finalPrompt = corePrompt + renderingPrefix + artStyle

  return {
    prompt: finalPrompt,
    truncated: artStyleTruncated,
    originalLength: artStyleTruncated ? (corePrompt.length + renderingPrefix.length + originalArtStyleLength) : undefined,
  }
}

/**
 * POST /api/ai/compose-avatar-prompt
 * Compose a face-focused avatar prompt from character description using scripted composition.
 * Art style is truncated if the total prompt exceeds maxLength.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ComposeAvatarPromptResponse>> {
  try {
    const body: ComposeAvatarPromptRequest = await request.json()
    const maxLength = body.maxLength || DEFAULT_MAX_LENGTH

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

    // Build the prompt using scripted composition
    const result = buildAvatarPrompt(body, maxLength)

    return NextResponse.json({
      success: true,
      prompt: result.prompt,
      truncated: result.truncated,
      originalLength: result.originalLength,
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
