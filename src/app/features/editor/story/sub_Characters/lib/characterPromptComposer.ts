/**
 * Character Prompt Composer
 * Visual prompt builder for character image generation
 * Max total prompt length: 1618 characters (Leonardo limit)
 * 
 * This file re-exports from sub_characterPromptComposer for backward compatibility.
 */

// Re-export everything from the sub-module
export {
  // Types
  type CharacterDimension,
  type CharacterPromptOption,
  type CharacterPromptColumn,
  // Constants
  MAX_PROMPT_LENGTH,
  CHARACTER_PROMPT_COLUMNS,
  AVATAR_STYLES,
  // Templates
  ARCHETYPE_OPTIONS,
  POSE_OPTIONS,
  EXPRESSION_OPTIONS,
  characterDimensionOptions,
  // Builder functions
  createCustomCharacterOption,
  composeCharacterPrompt,
  composeAvatarPrompt,
} from './sub_characterPromptComposer';
