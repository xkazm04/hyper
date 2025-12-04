/**
 * Character Prompt Composer
 * Visual prompt builder for character image generation
 * Max total prompt length: 1500 characters (Leonardo limit with reserve)
 *
 * NOTE: Core types and templates are now in @/app/prompts/character
 * This module re-exports them for backward compatibility and adds builder functions.
 */

// Re-export types and templates from shared prompts directory
export {
  type CharacterDimension,
  type CharacterPromptOption,
  type CharacterPromptColumn,
  type ComposePromptRequest,
  type ComposePromptResponse,
  MAX_PROMPT_LENGTH,
  CHARACTER_PROMPT_COLUMNS,
  AVATAR_STYLES,
  ARCHETYPE_OPTIONS,
  POSE_OPTIONS,
  TRAINING_POSE_OPTIONS,
  EXPRESSION_OPTIONS,
  characterDimensionOptions,
  AVATAR_STYLE_PROMPTS,
  CHARACTER_COMPOSE_SYSTEM_PROMPT,
} from '@/app/prompts/character'

// Export builder functions (local to this module)
export {
  createCustomCharacterOption,
  composeCharacterPrompt,
  composeAvatarPrompt,
} from './promptBuilder'

// Export AI-powered prompt composer
export {
  composeCharacterPromptWithAI,
  composeCharacterPromptWithAIResult,
  type PromptComposerInput,
  type PromptComposerResult,
} from './aiPromptComposer'
