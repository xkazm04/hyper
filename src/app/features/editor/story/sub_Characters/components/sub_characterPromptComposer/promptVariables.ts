/**
 * Character Prompt Variables and Types
 * Type definitions and constants for character prompt composition
 */

export type CharacterDimension = 'archetype' | 'pose' | 'mood';

export interface CharacterPromptOption {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: string;
  prompt: string;
  isCustom?: boolean;
}

export interface CharacterPromptColumn {
  id: CharacterDimension;
  label: string;
  icon: string;
  description: string;
}

export const MAX_PROMPT_LENGTH = 1500;

export const CHARACTER_PROMPT_COLUMNS: CharacterPromptColumn[] = [
  {
    id: 'archetype',
    label: 'Archetype',
    icon: '⚔️',
    description: 'Character class and role',
  },
  {
    id: 'pose',
    label: 'Pose',
    icon: '🎭',
    description: 'Body posture and stance',
  },
  {
    id: 'mood',
    label: 'Expression',
    icon: '✨',
    description: 'Facial expression and demeanor',
  },
];

export const AVATAR_STYLES = [
  { id: 'pixel', label: 'Pixel Art', icon: '👾', description: 'Retro 16-bit RPG style' },
  { id: 'chibi', label: 'Chibi', icon: '🎀', description: 'Cute anime-inspired' },
  { id: 'portrait', label: 'Portrait', icon: '🖼️', description: 'Detailed painted bust' },
  { id: 'rpg', label: 'RPG', icon: '⚔️', description: 'Modern videogame style' },
  { id: 'cartoon', label: 'Cartoon', icon: '🎯', description: 'Clean tactical animation' },
  { id: 'handdrawn', label: 'Hand-drawn', icon: '✒️', description: 'Elegant artisan sketch' },
  { id: 'gothic', label: 'Gothic', icon: '💀', description: 'Grimdark baroque style' },
  { id: 'story', label: 'Story Style', icon: '📖', description: 'Matches your story art' },
] as const;
