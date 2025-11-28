/**
 * Core types for the prompt system
 * Used by both card and character prompt composers
 */

export interface PromptOption {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  prompt: string;
  isCustom?: boolean;
}

export interface PromptColumn {
  id: PromptDimension;
  label: string;
  icon: string;
  description: string;
}

export type PromptDimension = 'style' | 'setting' | 'mood';

export interface ArtStyle {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  /** Image URL for the art style preview */
  imageUrl: string;
  /** Full art style prompt for image generation */
  stylePrompt: string;
  /** Color palette description */
  colorPalette: string;
  /** Rendering technique description */
  renderingTechnique: string;
  /** Key visual features */
  visualFeatures: string;
  /** Example shows/franchises using this style */
  examples?: string[];
}

export interface PromptConfiguration {
  artStyle?: ArtStyle;
  setting?: PromptOption;
  mood?: PromptOption;
  customPrompts?: Partial<Record<PromptDimension, string>>;
}

export interface CharacterArchetype {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export interface CharacterPose {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export interface CharacterExpression {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

export const MAX_PROMPT_LENGTH = 1618;

/**
 * LLM enrichment template for custom prompt processing
 */
export const LLM_ENRICHMENT_TEMPLATE = `You are an expert image generation prompt engineer. Your task is to take a short user idea and expand it into a detailed, professional prompt segment.

Guidelines:
1. Maintain length around 200-350 characters
2. Use vivid, specific descriptive language
3. Focus on visual elements AI image generators understand
4. Include sensory details: textures, lighting, colors, atmosphere
5. Respond with ONLY the enriched prompt text - no explanations, no JSON, no markdown`;
