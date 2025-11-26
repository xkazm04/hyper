/**
 * Prompt System Index
 * Central export point for all prompt definitions
 */

// Core types
export {
  type PromptOption,
  type PromptColumn,
  type PromptDimension,
  type ArtStyle,
  type PromptConfiguration,
  type CharacterArchetype,
  type CharacterPose,
  type CharacterExpression,
  MAX_PROMPT_LENGTH,
  LLM_ENRICHMENT_TEMPLATE,
} from './types';

// Art styles (used across all sections)
export {
  ART_STYLES,
  getArtStyleById,
  getDefaultArtStyle,
  LLM_ARTSTYLE_GUIDANCE,
} from './artstyles';

// Card prompt data
export {
  PROMPT_COLUMNS,
  SETTING_OPTIONS,
  MOOD_OPTIONS,
  STYLE_OPTIONS,
  dimensionOptions,
  getCompleteLLMInstructions,
  type CardDimension,
} from './cards';

// Character prompt data
export {
  CHARACTER_PROMPT_COLUMNS,
  ARCHETYPE_OPTIONS,
  POSE_OPTIONS,
  EXPRESSION_OPTIONS,
  AVATAR_STYLES,
  characterDimensionOptions,
  type CharacterDimension,
} from './characters';
