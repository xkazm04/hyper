import { getLLMCompletion } from './llmClient'

/**
 * Prompt Variation Service
 * Uses LLM (Ollama in dev, Anthropic in prod) to generate variations of the core prompt for sketch generation
 */

export interface PromptVariation {
  variation: string
  focusArea: string
}

export interface PromptVariationResponse {
  variations: PromptVariation[]
  originalPrompt: string
}

const VARIATION_SYSTEM_PROMPT = `You are an expert visual prompt engineer specializing in creating variations of image generation prompts.
Your task is to take a core prompt and create subtle yet distinct variations that explore different aspects or interpretations of the same scene.

Guidelines for creating variations:
1. Keep the core artistic style and main subject intact
2. Vary secondary elements like:
   - Lighting angle or intensity
   - Time of day or atmospheric conditions
   - Camera angle or perspective
   - Detail emphasis (foreground vs background)
   - Subtle mood shifts within the same theme
3. Each variation should be complete and self-contained
4. Keep variations relatively similar in length to the original
5. Do NOT change the fundamental art style or medium

IMPORTANT: You MUST respond with valid JSON only. No markdown, no explanations, just the JSON object.`

const VARIATION_USER_PROMPT = `Create exactly {count} variations of this image generation prompt.

Original prompt:
{prompt}

Respond with ONLY a valid JSON object in this exact format:
{
  "variations": [
    {
      "variation": "the complete varied prompt text here",
      "focusArea": "brief 2-4 word description of what makes this variation unique"
    }
  ]
}

Make each variation subtly different while maintaining the core artistic vision.`

/**
 * Generate prompt variations using Anthropic
 * @param corePrompt - The original prompt to create variations from
 * @param count - Number of variations to generate (1-4)
 * @returns Array of prompt variations
 */
export async function generatePromptVariations(
  corePrompt: string,
  count: number = 4
): Promise<PromptVariationResponse> {
  // Clamp count between 1 and 4
  const variationCount = Math.min(Math.max(count, 1), 4)

  try {
    const userPrompt = VARIATION_USER_PROMPT
      .replace('{count}', variationCount.toString())
      .replace('{prompt}', corePrompt)

    const response = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt: VARIATION_SYSTEM_PROMPT,
      maxTokens: 4096,
    })

    // Parse the JSON response
    const parsed = parseVariationResponse(response.content)

    // Ensure we have the right number of variations
    // If we got fewer, pad with the original prompt
    while (parsed.variations.length < variationCount) {
      parsed.variations.push({
        variation: corePrompt,
        focusArea: 'Original',
      })
    }

    // Trim if we got too many
    parsed.variations = parsed.variations.slice(0, variationCount)

    return {
      variations: parsed.variations,
      originalPrompt: corePrompt,
    }
  } catch (error) {
    console.error('Error generating prompt variations:', error)

    // Fallback: return the original prompt as all variations
    const fallbackVariations: PromptVariation[] = Array(variationCount)
      .fill(null)
      .map((_, i) => ({
        variation: corePrompt,
        focusArea: i === 0 ? 'Original' : `Variation ${i + 1}`,
      }))

    return {
      variations: fallbackVariations,
      originalPrompt: corePrompt,
    }
  }
}

/**
 * Parse the JSON response from Anthropic
 */
function parseVariationResponse(response: string): { variations: PromptVariation[] } {
  // Try to extract JSON from the response
  let jsonStr = response.trim()

  // If the response is wrapped in markdown code blocks, extract the JSON
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim()
  }

  // Try to find JSON object in the response
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (objectMatch) {
    jsonStr = objectMatch[0]
  }

  try {
    const parsed = JSON.parse(jsonStr)

    if (!parsed.variations || !Array.isArray(parsed.variations)) {
      throw new Error('Invalid response structure: missing variations array')
    }

    // Validate each variation
    const validVariations = parsed.variations
      .filter(
        (v: unknown): v is PromptVariation =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as PromptVariation).variation === 'string' &&
          (v as PromptVariation).variation.length > 0
      )
      .map((v: PromptVariation) => ({
        variation: v.variation,
        focusArea: v.focusArea || 'Variation',
      }))

    return { variations: validVariations }
  } catch (error) {
    console.error('Failed to parse variation response:', error)
    throw new Error('Failed to parse AI response')
  }
}

/**
 * Quality presets for sketch generation
 */
export interface SketchQualityPreset {
  name: string
  width: number
  height: number
  steps: number
  guidanceScale: number
  description: string
}

export const SKETCH_QUALITY_PRESETS: Record<string, SketchQualityPreset> = {
  quick: {
    name: 'Quick Sketch',
    width: 736,
    height: 1120,
    steps: 15,
    guidanceScale: 5,
    description: 'Fast preview (5-10 seconds)',
  },
  standard: {
    name: 'Standard Sketch',
    width: 736,
    height: 1120,
    steps: 20,
    guidanceScale: 6,
    description: 'Balanced quality/speed (10-20 seconds)',
  },
}

export const FINAL_QUALITY_PRESETS: Record<string, SketchQualityPreset> = {
  high: {
    name: 'High Quality',
    width: 736,
    height: 1120,
    steps: 35,
    guidanceScale: 7.5,
    description: 'High detail (30-45 seconds)',
  },
  premium: {
    name: 'Premium',
    width: 736,
    height: 1120,
    steps: 50,
    guidanceScale: 8,
    description: 'Maximum quality (45-90 seconds)',
  },
}
