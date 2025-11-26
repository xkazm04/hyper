import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLLMCompletion } from '@/lib/services/llmClient'
import { 
  STYLE_OPTIONS, 
  SETTING_OPTIONS, 
  MOOD_OPTIONS, 
  PromptDimension,
  MAX_PROMPT_LENGTH 
} from '@/lib/promptComposer'
import { getArtStyleById, LLM_ARTSTYLE_GUIDANCE, ART_STYLES } from '@/app/prompts'

const DIMENSION_EXAMPLES: Record<PromptDimension, string[]> = {
  style: STYLE_OPTIONS.map(o => o.prompt),
  setting: SETTING_OPTIONS.map(o => o.prompt),
  mood: MOOD_OPTIONS.map(o => o.prompt),
}

const DIMENSION_DESCRIPTIONS: Record<PromptDimension, string> = {
  style: 'art style and rendering technique (pencil, ink, sketch, illustration style)',
  setting: 'scene location and environment (landscape, architecture, atmosphere)',
  mood: 'emotional atmosphere and tone (lighting, colors, feeling)',
}

const BASE_ENRICHMENT_SYSTEM_PROMPT = `You are an expert image generation prompt engineer specializing in creating rich, evocative prompts for AI art generation.

Your task is to take a short user idea and expand it into a detailed, professional prompt segment that matches the quality and style of the provided examples.

Guidelines:
1. Maintain similar length to the examples (around 200-350 characters)
2. Use vivid, specific descriptive language
3. Focus on visual elements that AI image generators understand
4. Avoid generic or vague descriptions
5. Include sensory details: textures, lighting, colors, atmosphere
6. Match the tone and structure of the examples provided

CRITICAL: Respond with ONLY the enriched prompt text. No explanations, no JSON, no markdown - just the prompt text itself.`

/**
 * Build dynamic system prompt that includes art style context
 */
function buildEnrichmentSystemPrompt(artStyleId?: string): string {
  if (!artStyleId) {
    return BASE_ENRICHMENT_SYSTEM_PROMPT
  }
  
  const artStyle = getArtStyleById(artStyleId)
  if (!artStyle) {
    return BASE_ENRICHMENT_SYSTEM_PROMPT
  }
  
  // Include art style guidance for coherent generation
  return `${BASE_ENRICHMENT_SYSTEM_PROMPT}

${LLM_ARTSTYLE_GUIDANCE}

ACTIVE ART STYLE: ${artStyle.label}
- Style Prompt: ${artStyle.stylePrompt}
- Color Palette: ${artStyle.colorPalette}
- Rendering Technique: ${artStyle.renderingTechnique}
- Visual Features: ${artStyle.visualFeatures}

When enriching the user's setting or mood description, incorporate visual elements that complement this art style. The setting should feel natural within this aesthetic, and the mood should use lighting/colors that work with the style's palette.`
}

/**
 * POST /api/ai/enrich-prompt
 * Enrich a user's short prompt idea into a full-quality prompt segment
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
    const { userIdea, dimension, artStyleId } = body as { 
      userIdea: string; 
      dimension: PromptDimension;
      artStyleId?: string;
    }

    if (!userIdea || typeof userIdea !== 'string' || userIdea.trim().length === 0) {
      return NextResponse.json(
        { error: 'User idea is required' },
        { status: 400 }
      )
    }

    if (!dimension || !['style', 'setting', 'mood'].includes(dimension)) {
      return NextResponse.json(
        { error: 'Valid dimension (style, setting, mood) is required' },
        { status: 400 }
      )
    }

    // Get examples for this dimension
    const examples = DIMENSION_EXAMPLES[dimension]
    const description = DIMENSION_DESCRIPTIONS[dimension]
    
    // Build system prompt with art style context if provided
    const systemPrompt = buildEnrichmentSystemPrompt(artStyleId)

    // Calculate max length for this segment (leave room for other segments)
    const maxSegmentLength = Math.floor(MAX_PROMPT_LENGTH / 3)

    // Build user prompt with art style context for setting/mood
    let artStyleContext = ''
    if (artStyleId && (dimension === 'setting' || dimension === 'mood')) {
      const artStyle = getArtStyleById(artStyleId)
      if (artStyle) {
        artStyleContext = `\nThe active art style is "${artStyle.label}" which uses ${artStyle.colorPalette} and ${artStyle.renderingTechnique}. Make sure your ${dimension} description complements this aesthetic.`
      }
    }

    const userPrompt = `Dimension: ${dimension} (${description})${artStyleContext}

User's idea: "${userIdea.trim()}"

Example prompts for this dimension:
${examples.slice(0, 3).map((ex, i) => `Example ${i + 1}: ${ex}`).join('\n\n')}

Create an enriched prompt segment based on the user's idea. Match the quality, detail level, and approximate length (around ${maxSegmentLength} characters max) of the examples above.

Remember: Respond with ONLY the enriched prompt text, nothing else.`

    const response = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 512,
    })

    // Clean up the response
    let cleanedPrompt = response.content.trim()
    
    // Remove any quotes if the AI wrapped it
    if (cleanedPrompt.startsWith('"') && cleanedPrompt.endsWith('"')) {
      cleanedPrompt = cleanedPrompt.slice(1, -1)
    }
    
    // Truncate if too long
    if (cleanedPrompt.length > maxSegmentLength) {
      cleanedPrompt = cleanedPrompt.substring(0, maxSegmentLength - 3) + '...'
    }

    return NextResponse.json({
      success: true,
      enrichedPrompt: cleanedPrompt,
      originalIdea: userIdea,
      dimension,
      characterCount: cleanedPrompt.length,
      provider: response.provider,
    })

  } catch (error) {
    console.error('Error enriching prompt:', error)

    return NextResponse.json(
      { error: 'Failed to enrich prompt' },
      { status: 500 }
    )
  }
}
