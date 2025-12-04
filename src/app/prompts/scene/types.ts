/**
 * Scene/Image Description Prompt Types
 * Type definitions for scene description generation
 */

import { MAX_PROMPT_LENGTH } from '../types'
export { MAX_PROMPT_LENGTH }

/** Maximum length for scene description output */
export const MAX_SCENE_DESCRIPTION_LENGTH = 1500

/** Target length range for scene descriptions */
export const SCENE_DESCRIPTION_TARGET = {
  min: 1200,
  max: 1500,
}

export interface SceneDescriptionRequest {
  /** The story/narrative content to convert to visual description */
  storyContent: string
  /** Optional art style to consider when generating the description */
  artStylePrompt?: string
  /** Existing description to refine/enhance */
  existingDescription?: string
  /** Maximum output length (defaults to MAX_SCENE_DESCRIPTION_LENGTH) */
  maxLength?: number
}

export interface SceneDescriptionResponse {
  success: boolean
  /** The generated scene description */
  description: string
  /** Whether the description was truncated to fit maxLength */
  truncated: boolean
  /** Original length before truncation (if truncated) */
  originalLength?: number
  /** LLM provider used */
  provider?: string
  /** LLM model used */
  model?: string
  /** Error message if success is false */
  error?: string
}
