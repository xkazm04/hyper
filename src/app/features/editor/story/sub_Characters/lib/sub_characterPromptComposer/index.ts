/**
 * Character Prompt Composer
 * Visual prompt builder for character image generation
 * Max total prompt length: 1618 characters (Leonardo limit)
 */

// Export types and variables
export {
  type CharacterDimension,
  type CharacterPromptOption,
  type CharacterPromptColumn,
  MAX_PROMPT_LENGTH,
  CHARACTER_PROMPT_COLUMNS,
  AVATAR_STYLES,
} from './promptVariables';

// Export templates
export {
  ARCHETYPE_OPTIONS,
  POSE_OPTIONS,
  EXPRESSION_OPTIONS,
  characterDimensionOptions,
} from './promptTemplates';

// Export builder functions
export {
  createCustomCharacterOption,
  composeCharacterPrompt,
  composeAvatarPrompt,
} from './promptBuilder';
