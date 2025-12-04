/**
 * Scene Description Prompts Module
 *
 * Provides prompts and utilities for generating visual scene descriptions
 * from narrative story content for image generation.
 */

// Types
export * from './types'

// System prompts and utilities
export {
  SCENE_DESCRIPTION_SYSTEM_PROMPT,
  buildSceneDescriptionUserPrompt,
  truncateSceneDescription,
} from './system-prompts'
