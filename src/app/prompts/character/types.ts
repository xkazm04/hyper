/**
 * Character Prompt Types
 * Type definitions for character prompt composition
 */

// Re-use the shared MAX_PROMPT_LENGTH from parent types
import { MAX_PROMPT_LENGTH } from '../types'
export { MAX_PROMPT_LENGTH }

export type CharacterDimension = 'archetype' | 'pose' | 'mood'

export interface CharacterPromptOption {
  id: string
  label: string
  description: string
  tags: string[]
  icon: string
  prompt: string
  isCustom?: boolean
}

export interface CharacterPromptColumn {
  id: CharacterDimension
  label: string
  icon: string
  description: string
}

export interface ComposePromptRequest {
  characterName?: string
  characterAppearance?: string
  archetype?: { label: string; prompt: string }
  pose?: { label: string; prompt: string }
  mood?: { label: string; prompt: string }
  storyArtStyle?: string
  maxLength?: number
}

export interface ComposePromptResponse {
  success: boolean
  prompt: string
  truncated: boolean
  originalLength?: number
  error?: string
}
