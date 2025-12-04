/**
 * Character Prompt Builder
 * Functions for composing character and avatar prompts
 */

import {
  CharacterDimension,
  CharacterPromptOption,
  MAX_PROMPT_LENGTH,
  AVATAR_STYLE_PROMPTS,
} from '@/app/prompts/character'

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
  characterAppearance?: string,
  artStylePrompt?: string
): string {
  const parts: string[] = [];

  // Add art style first if provided, otherwise use a generic base
  // Use "illustration" instead of "portrait" to avoid triggering close-up face framing
  if (artStylePrompt) {
    parts.push(`Full-body character illustration. ${artStylePrompt}`);
  } else {
    parts.push(`Full-body character illustration.`);
  }

  // PRIORITY 1: Character appearance - ALWAYS include fully
  // Character appearance is the most important element and should never be truncated
  if (characterName || characterAppearance) {
    const charContext = [
      characterName && `Character: ${characterName}.`,
      characterAppearance && `Appearance: ${characterAppearance}.`,
    ]
      .filter(Boolean)
      .join(' ');
    parts.push(`\n\n${charContext}`);
  }

  // PRIORITY 2: Pose - important for composition
  if (selections.pose) {
    parts.push(`\n\nPose: ${selections.pose.prompt}`);
  }

  // PRIORITY 3: Expression/mood
  if (selections.mood) {
    parts.push(`\n\nExpression: ${selections.mood.prompt}`);
  }

  // PRIORITY 4: Archetype - context only, can be compressed if needed
  if (selections.archetype) {
    parts.push(`\n\nClass context: ${selections.archetype.prompt}`);
  }

  const result = parts.join('');

  // Truncate if exceeds limit - but try to preserve character appearance
  if (result.length > MAX_PROMPT_LENGTH) {
    // Smart truncation: remove archetype first, then mood, then pose
    return truncatePromptPreservingAppearance(parts, characterAppearance);
  }

  return result;
}

/**
 * Smart truncation that preserves character appearance
 * Removes lower-priority sections first
 */
function truncatePromptPreservingAppearance(
  parts: string[],
  characterAppearance?: string
): string {
  let result = parts.join('');
  
  // If still too long after including everything, truncate from the end
  // but ensure character appearance section is preserved
  if (result.length > MAX_PROMPT_LENGTH) {
    // Find where character appearance ends
    const appearanceEndIndex = characterAppearance 
      ? result.indexOf(characterAppearance) + characterAppearance.length + 1
      : 0;
    
    // Preserve everything up to and including character appearance
    const preservedPart = result.substring(0, Math.min(appearanceEndIndex, MAX_PROMPT_LENGTH - 3));
    const remainingSpace = MAX_PROMPT_LENGTH - preservedPart.length - 3;
    
    if (remainingSpace > 50) {
      // Add what we can from the rest
      const restOfPrompt = result.substring(appearanceEndIndex);
      return preservedPart + restOfPrompt.substring(0, remainingSpace) + '...';
    }
    
    return preservedPart + '...';
  }

  return result;
}

/**
 * Compose avatar prompt focusing on character FACE FEATURES ONLY for 1:1 square frame
 * Extracts and emphasizes facial characteristics from the full character appearance
 * Limited to 1500 characters for API compatibility with reserve
 */
export function composeAvatarPrompt(
  characterName?: string,
  characterAppearance?: string,
  style: string = 'pixel',
  storyArtStyle?: string
): string {
  const MAX_AVATAR_PROMPT_LENGTH = 1500

  const parts: string[] = []
  const isStoryStyle = style === 'story'

  // For "story" style, use the actual story art style directly as the primary rendering style
  if (isStoryStyle && storyArtStyle) {
    parts.push(storyArtStyle)
    parts.push(`Adapt for character face portrait. Square 1:1 frame, head and shoulders.`)
  } else {
    // Add style-specific prompt from shared templates
    parts.push(AVATAR_STYLE_PROMPTS[style] || AVATAR_STYLE_PROMPTS.rpg)
    
    // Add story art style as additional rendering technique (for non-story styles)
    if (storyArtStyle) {
      // Truncate art style if too long
      const truncatedStyle = storyArtStyle.length > 200 ? storyArtStyle.substring(0, 200) + '...' : storyArtStyle;
      parts.push(`Rendering style: ${truncatedStyle}`);
    }
  }

  if (characterName) {
    parts.push(`Character: ${characterName}.`);
  }

  // Extract ONLY face-related features from appearance - be more concise
  if (characterAppearance) {
    parts.push(`Face features: ${characterAppearance}`);
  }

  parts.push(`Composition: Tight framing on face. Square 1:1 aspect ratio.`);

  let result = parts.join(' ');
  
  // Truncate if exceeds limit
  if (result.length > MAX_AVATAR_PROMPT_LENGTH) {
    result = result.substring(0, MAX_AVATAR_PROMPT_LENGTH - 3) + '...';
  }

  return result;
}
