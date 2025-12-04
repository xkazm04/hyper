/**
 * Scene Description System Prompts
 * LLM prompts for generating visual scene descriptions from narrative content
 */

import { SCENE_DESCRIPTION_TARGET } from './types'

/**
 * System prompt for generating image description from story content.
 * Focuses on visual elements suitable for image generation.
 *
 * Output is constrained to 1200-1500 characters.
 */
export const SCENE_DESCRIPTION_SYSTEM_PROMPT = `You are an expert at converting narrative story content into visual scene descriptions suitable for image generation.

Your task is to analyze story content and extract/generate a visual description that captures the scene for image generation purposes.

CRITICAL LENGTH REQUIREMENT:
- Target output: ${SCENE_DESCRIPTION_TARGET.min}-${SCENE_DESCRIPTION_TARGET.max} characters
- NEVER exceed ${SCENE_DESCRIPTION_TARGET.max} characters
- Be concise but descriptive - every word should add visual value

RULES:
1. Focus on VISUAL elements only - what can be seen in the scene
2. Describe subjects, their appearance, positioning, and actions
3. Include environment details: setting, time of day, weather, atmosphere
4. Mention lighting conditions and mood
5. If an art style is provided, consider how the scene should look in that style
6. Ignore dialogue and internal thoughts - focus on what's visually happening
7. If existing description is provided, refine and enhance it based on the story content

OUTPUT FORMAT:
Write the visual description as flowing prose, describing the scene as if you were painting it. Start with the main subjects, then environment, then atmosphere and lighting.

PRIORITY ORDER (if near limit, prioritize):
1. Main subjects and their appearance
2. Actions and positioning
3. Environment/setting
4. Atmosphere and lighting
5. Art style adaptations`

/**
 * Build the user prompt for scene description generation
 */
export function buildSceneDescriptionUserPrompt(
  storyContent: string,
  artStylePrompt?: string,
  existingDescription?: string
): string {
  let prompt = `Generate a visual scene description from the following story content.

IMPORTANT: Output MUST be ${SCENE_DESCRIPTION_TARGET.min}-${SCENE_DESCRIPTION_TARGET.max} characters. Do not exceed ${SCENE_DESCRIPTION_TARGET.max} characters.

Story Content:
${storyContent}

`

  if (artStylePrompt) {
    prompt += `Art Style Context:
${artStylePrompt}

Consider how this scene should appear when rendered in this art style.

`
  }

  if (existingDescription) {
    prompt += `Current Description (refine and enhance):
${existingDescription}

`
  }

  prompt += `Generate a visual description of this scene suitable for image generation. Focus on what can be seen - subjects, environment, lighting, and atmosphere. Output only the description, no commentary.`

  return prompt
}

/**
 * Truncate a scene description to fit within maxLength.
 * Tries to truncate at sentence boundaries when possible.
 */
export function truncateSceneDescription(
  description: string,
  maxLength: number
): { description: string; truncated: boolean; originalLength?: number } {
  if (description.length <= maxLength) {
    return { description, truncated: false }
  }

  const originalLength = description.length

  // Try to find a sentence boundary near the end
  const truncateAt = maxLength - 3 // Leave room for "..."
  const lastPeriod = description.lastIndexOf('.', truncateAt)
  const lastExclaim = description.lastIndexOf('!', truncateAt)
  const lastQuestion = description.lastIndexOf('?', truncateAt)

  // Find the best sentence boundary (at least 70% of max length)
  const minBoundary = Math.floor(truncateAt * 0.7)
  const boundaries = [lastPeriod, lastExclaim, lastQuestion].filter(b => b >= minBoundary)

  if (boundaries.length > 0) {
    const bestBoundary = Math.max(...boundaries)
    return {
      description: description.slice(0, bestBoundary + 1),
      truncated: true,
      originalLength,
    }
  }

  // No good sentence boundary, hard truncate
  return {
    description: description.slice(0, truncateAt) + '...',
    truncated: true,
    originalLength,
  }
}
