/**
 * AI-Powered Character Prompt Composer
 * Uses Groq to intelligently compose character prompts with story art style integration
 * 
 * Requirements: FR-3.2, NFR-2
 */

import {
  CharacterDimension,
  CharacterPromptOption,
} from './promptVariables';
import { composeCharacterPrompt } from './promptBuilder';

/**
 * Input for AI prompt composition
 */
export interface PromptComposerInput {
  characterName?: string;
  characterAppearance?: string;
  selections: Partial<Record<CharacterDimension, CharacterPromptOption | undefined>>;
  storyArtStyle?: string;
}

/**
 * Result from AI prompt composition (Task 10.2)
 */
export interface PromptComposerResult {
  prompt: string;
  usedFallback: boolean;
  error?: string;
}

/**
 * Response from the compose-prompt API
 */
interface ComposePromptResponse {
  success: boolean;
  prompt: string;
  truncated: boolean;
  originalLength?: number;
  error?: string;
}

/**
 * Compose a character prompt using AI (Groq) to intelligently combine
 * character selections with story art style.
 * 
 * Falls back to simple composition if the API call fails.
 * 
 * @param input - Character info, selections, and optional story art style
 * @returns Composed prompt string
 * 
 * Requirements: FR-3.2, NFR-2
 */
export async function composeCharacterPromptWithAI(
  input: PromptComposerInput
): Promise<string> {
  const result = await composeCharacterPromptWithAIResult(input);
  return result.prompt;
}

/**
 * Compose a character prompt using AI with detailed result information.
 * Returns whether fallback was used and any error messages.
 * 
 * @param input - Character info, selections, and optional story art style
 * @returns Result object with prompt, fallback status, and error info
 * 
 * Requirements: FR-3.2, NFR-2, Task 10.2
 */
export async function composeCharacterPromptWithAIResult(
  input: PromptComposerInput
): Promise<PromptComposerResult> {
  // Pass art style to fallback for consistent styling even without AI
  const fallbackPrompt = composeCharacterPrompt(
    input.selections,
    input.characterName,
    input.characterAppearance,
    input.storyArtStyle
  );

  // If no art style provided, use simple composition directly
  if (!input.storyArtStyle) {
    return {
      prompt: fallbackPrompt,
      usedFallback: true,
      error: undefined,
    };
  }

  try {
    const response = await fetch('/api/ai/compose-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        characterName: input.characterName,
        characterAppearance: input.characterAppearance,
        archetype: input.selections.archetype,
        pose: input.selections.pose,
        mood: input.selections.mood,
        storyArtStyle: input.storyArtStyle,
        maxLength: 1500,
      }),
    });

    if (!response.ok) {
      console.error('AI prompt composition failed with status:', response.status);
      return {
        prompt: fallbackPrompt,
        usedFallback: true,
        error: 'AI composition unavailable, using standard prompt',
      };
    }

    const data: ComposePromptResponse = await response.json();

    if (!data.success || !data.prompt) {
      console.error('AI prompt composition returned unsuccessful:', data.error);
      return {
        prompt: fallbackPrompt,
        usedFallback: true,
        error: data.error || 'AI composition failed, using standard prompt',
      };
    }

    return {
      prompt: data.prompt,
      usedFallback: false,
      error: undefined,
    };
  } catch (error) {
    console.error('AI prompt composition error:', error);
    return {
      prompt: fallbackPrompt,
      usedFallback: true,
      error: 'AI composition unavailable, using standard prompt',
    };
  }
}
