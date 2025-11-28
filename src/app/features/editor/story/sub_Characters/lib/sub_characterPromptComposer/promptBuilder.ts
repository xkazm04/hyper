/**
 * Character Prompt Builder
 * Functions for composing character and avatar prompts
 */

import {
  CharacterDimension,
  CharacterPromptOption,
  MAX_PROMPT_LENGTH,
} from './promptVariables';

/**
 * Create a custom prompt option for user input
 */
export function createCustomCharacterOption(
  dimension: CharacterDimension,
  customPrompt: string
): CharacterPromptOption {
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
 * Compose the final character prompt from selections
 * Adds character appearance context and ensures total length stays within MAX_PROMPT_LENGTH
 */
export function composeCharacterPrompt(
  selections: Partial<Record<CharacterDimension, CharacterPromptOption | undefined>>,
  characterName?: string,
  characterAppearance?: string
): string {
  const parts: string[] = [];

  // Add base character context
  parts.push(
    `Character portrait illustration. Hand-drawn sketchbook style with expressive linework and subtle color accents.`
  );

  // Add character name and appearance if provided
  if (characterName || characterAppearance) {
    const charContext = [
      characterName && `Character: ${characterName}.`,
      characterAppearance && `Appearance: ${characterAppearance}.`,
    ]
      .filter(Boolean)
      .join(' ');
    parts.push(`\n\n${charContext}`);
  }

  // Add archetype description
  if (selections.archetype) {
    parts.push(`\n\nClass: ${selections.archetype.prompt}`);
  }

  // Add pose description
  if (selections.pose) {
    parts.push(`\n\nPose: ${selections.pose.prompt}`);
  }

  // Add expression/mood
  if (selections.mood) {
    parts.push(`\n\nExpression: ${selections.mood.prompt}`);
  }

  const result = parts.join('');

  // Truncate if exceeds limit
  if (result.length > MAX_PROMPT_LENGTH) {
    return result.substring(0, MAX_PROMPT_LENGTH - 3) + '...';
  }

  return result;
}

/**
 * Compose avatar prompt using character references
 */
export function composeAvatarPrompt(
  characterName?: string,
  characterAppearance?: string,
  style: 'pixel' | 'chibi' | 'portrait' | 'icon' = 'pixel'
): string {
  const stylePrompts: Record<string, string> = {
    pixel: `16-bit pixel art style RPG character portrait. Square frame, limited color palette, clean pixelated edges. Classic SNES/GBA era aesthetic. Small detailed sprite suitable for game UI.`,
    chibi: `Chibi style character portrait with exaggerated cute proportions. Large expressive head, small body. Soft rounded features, bright colors. Anime-inspired with friendly appeal.`,
    portrait: `Detailed character portrait bust, shoulders and head only. Painterly illustrated style with rich details. Focus on face and expression. Dramatic lighting, professional quality.`,
    icon: `Minimalist character icon design. Simplified geometric shapes, bold outlines. Limited color palette, easily recognizable silhouette. Suitable for UI elements and badges.`,
  };

  const parts: string[] = [stylePrompts[style]];

  if (characterName) {
    parts.push(`\n\nCharacter: ${characterName}.`);
  }

  if (characterAppearance) {
    parts.push(`Key features: ${characterAppearance}`);
  }

  parts.push(`\n\nMaintain visual consistency with reference images. Square 1:1 aspect ratio.`);

  return parts.join(' ');
}
