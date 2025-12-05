/**
 * Sketch Generation Library
 *
 * Reusable functions for generating scene images from prompts or narrative content.
 * Extracted from SceneSketchPanel for use in multiple components.
 */

import { deleteGenerations } from '@/lib/services/sketchCleanup'

// Fixed sizing for widescreen scenes: 1184x672
export const SCENE_WIDTH = 1184
export const SCENE_HEIGHT = 672

export interface GeneratedSketch {
  url: string
  width: number
  height: number
  prompt?: string
  generationId?: string
  imageId?: string
}

export interface SketchGenerationOptions {
  /** Art style prompt from story stack */
  artStylePrompt?: string
  /** Optional mood prompt enhancement */
  moodPrompt?: string
  /** Number of sketch variations (default: 3) */
  count?: number
}

export interface SketchGenerationResult {
  sketches: GeneratedSketch[]
  generationIds: string[]
}

/**
 * Generate sketches from a custom description prompt
 *
 * Process:
 * 1. Generate image prompt from description via /api/ai/scene-prompt
 * 2. Generate prompt variations via /api/ai/prompt-variations
 * 3. Generate images via /api/ai/generate-images (Leonardo Phoenix 1.0)
 */
export async function generateSketchesFromPrompt(
  contentDescription: string,
  options: SketchGenerationOptions = {}
): Promise<SketchGenerationResult> {
  const { artStylePrompt, moodPrompt, count = 3 } = options

  if (!contentDescription.trim()) {
    throw new Error('Content description is required')
  }

  // Step 1: Generate image prompt from description
  const promptResponse = await fetch('/api/ai/scene-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentDescription: contentDescription.trim(),
      artStylePrompt: artStylePrompt || undefined,
      moodPrompt: moodPrompt || undefined,
    }),
  })

  if (!promptResponse.ok) {
    const errorData = await promptResponse.json()
    throw new Error(errorData.error || 'Failed to generate image prompt')
  }

  const promptData = await promptResponse.json()
  const imagePromptText = promptData.prompt

  if (!imagePromptText) {
    throw new Error('No image prompt generated')
  }

  // Step 2: Generate variations of the image prompt
  const variationResponse = await fetch('/api/ai/prompt-variations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: imagePromptText, count }),
  })

  if (!variationResponse.ok) {
    const errorData = await variationResponse.json()
    throw new Error(errorData.error || 'Failed to generate prompt variations')
  }

  const variationData = await variationResponse.json()
  const variations = variationData.variations || [{ variation: imagePromptText }]

  // Step 3: Generate images with Phoenix 1.0 at widescreen size
  const sketchPromises = variations.slice(0, count).map(async (variation: { variation: string }, index: number) => {
    try {
      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: variation.variation,
          numImages: 1,
          width: SCENE_WIDTH,
          height: SCENE_HEIGHT,
          provider: 'leonardo',
          model: 'phoenix_1.0',
        }),
      })

      if (!response.ok) {
        console.error(`Failed to generate sketch ${index + 1}`)
        return null
      }

      const data = await response.json()
      const image = data.images?.[0]
      return image
        ? ({
            url: image.url,
            width: image.width,
            height: image.height,
            prompt: variation.variation,
            generationId: data.generationId,
            imageId: image.id,
          } as GeneratedSketch)
        : null
    } catch (err) {
      console.error(`Error generating sketch ${index + 1}:`, err)
      return null
    }
  })

  const results = await Promise.all(sketchPromises)
  const validSketches = results.filter((s): s is GeneratedSketch => s !== null)

  if (validSketches.length === 0) {
    throw new Error('Failed to generate any sketches')
  }

  const generationIds = validSketches.map((s) => s.generationId).filter((id): id is string => !!id)

  return { sketches: validSketches, generationIds }
}

/**
 * Generate sketches from story narrative content
 *
 * Process:
 * 1. Generate image description from narrative via /api/ai/image-description
 * 2. Then same as generateSketchesFromPrompt
 */
export async function generateSketchesFromNarrative(
  storyContent: string,
  options: SketchGenerationOptions = {}
): Promise<SketchGenerationResult> {
  const { artStylePrompt, moodPrompt, count = 3 } = options

  if (!storyContent.trim() || storyContent.trim().length < 20) {
    throw new Error('Story content must be at least 20 characters')
  }

  // Step 1: Generate image description from story content
  const descriptionResponse = await fetch('/api/ai/image-description', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storyContent,
      artStylePrompt: artStylePrompt || undefined,
      maxLength: 1500,
    }),
  })

  if (!descriptionResponse.ok) {
    const errorData = await descriptionResponse.json()
    throw new Error(errorData.error || 'Failed to generate image description')
  }

  const descriptionData = await descriptionResponse.json()
  let imageDescription = descriptionData.description || ''

  // Truncate if over limit
  if (imageDescription.length > 1500) {
    imageDescription = imageDescription.slice(0, 1500)
  }

  if (!imageDescription) {
    throw new Error('No image description generated from narrative')
  }

  // Continue with the same process as custom prompt
  return generateSketchesFromPrompt(imageDescription, { artStylePrompt, moodPrompt, count })
}

/**
 * Cleanup unused sketch generations
 * Call this after user selects a sketch to delete the unselected ones
 */
export async function cleanupUnusedSketches(
  generationIds: string[],
  selectedGenerationId?: string
): Promise<void> {
  const unusedIds = selectedGenerationId
    ? generationIds.filter((id) => id !== selectedGenerationId)
    : generationIds

  if (unusedIds.length > 0) {
    await deleteGenerations(unusedIds)
  }
}
