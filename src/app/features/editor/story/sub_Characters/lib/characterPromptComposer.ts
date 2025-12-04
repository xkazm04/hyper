/**
 * Character Prompt Composer
 * Visual prompt builder for character image generation
 * Max total prompt length: 1500 characters (Leonardo limit with reserve)
 * 
 * This file re-exports from sub_characterPromptComposer for backward compatibility.
 */

// Re-export everything from the sub-module
export {
  // Types
  type CharacterDimension,
  type CharacterPromptOption,
  type CharacterPromptColumn,
  type PromptComposerInput,
  type PromptComposerResult,
  // Constants
  MAX_PROMPT_LENGTH,
  CHARACTER_PROMPT_COLUMNS,
  AVATAR_STYLES,
  // Templates
  ARCHETYPE_OPTIONS,
  POSE_OPTIONS,
  TRAINING_POSE_OPTIONS,
  EXPRESSION_OPTIONS,
  characterDimensionOptions,
  // Builder functions
  createCustomCharacterOption,
  composeCharacterPrompt,
  composeAvatarPrompt,
  // AI-powered prompt composer
  composeCharacterPromptWithAI,
  composeCharacterPromptWithAIResult,
} from '../components/sub_characterPromptComposer';
