/**
 * Prompt Composer Data
 * Visual prompt builder for story card image generation
 * Max total prompt length: 1618 characters (Leonardo limit)
 * 
 * Note: This module re-exports from the new centralized prompts module
 * for backward compatibility. New code should import from '@/app/prompts'.
 */

// Re-export everything from the new prompts module for backward compatibility
export {
  type PromptOption,
  type PromptColumn,
  type PromptDimension,
  MAX_PROMPT_LENGTH,
  PROMPT_COLUMNS,
  STYLE_OPTIONS,
  SETTING_OPTIONS,
  MOOD_OPTIONS,
  dimensionOptions,
} from '@/app/prompts';

import { PromptDimension, PromptOption, MAX_PROMPT_LENGTH } from '@/app/prompts';

/**
 * Create a custom prompt option for user input
 */
export function createCustomOption(dimension: PromptDimension, customPrompt: string): PromptOption {
  return {
    id: `custom-${dimension}`,
    label: 'Custom',
    description: 'Your custom prompt',
    tags: ['custom'],
    icon: '✏️',
    prompt: customPrompt,
    isCustom: true,
  };
}

/**
 * Compose the final prompt from selections
 * Ensures total length stays within MAX_PROMPT_LENGTH
 */
export function composePrompt(
  selections: Partial<Record<PromptDimension, PromptOption | undefined>>
): string {
  const parts: string[] = [];

  // Start with style prompt (the main instruction)
  if (selections.style) {
    parts.push(selections.style.prompt);
  }

  // Add setting description
  if (selections.setting) {
    parts.push(`\n\nScene: ${selections.setting.prompt}`);
  }

  // Add mood/atmosphere
  if (selections.mood) {
    parts.push(`\n\nMood: ${selections.mood.prompt}`);
  }

  const result = parts.join('');
  
  // Truncate if exceeds limit (should rarely happen with reduced prompts)
  if (result.length > MAX_PROMPT_LENGTH) {
    return result.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
  }
  
  return result;
}

export function getAllTags(): string[] {
  const { dimensionOptions } = require('@/app/prompts');
  const tagSet = new Set<string>();

  (Object.values(dimensionOptions) as PromptOption[][]).forEach((options) => {
    options.forEach(option => {
      option.tags.forEach(tag => tagSet.add(tag));
    });
  });

  return Array.from(tagSet).sort();
}
