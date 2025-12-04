// Story types - StoryStack, StoryCard, validation, and related input types

import type { PreviewTheme } from './common'

// Story Stack - simplified from Stack
export interface StoryStack {
  id: string
  ownerId: string
  name: string
  description: string | null
  isPublished: boolean
  publishedAt: string | null
  slug: string | null
  firstCardId: string | null  // Entry point for the story
  // Art style fields
  artStyleId: string | null  // Predefined art style ID (e.g., 'adventure_journal')
  customArtStylePrompt: string | null  // Custom art style prompt text
  artStyleSource: 'preset' | 'custom' | 'extracted'  // Source of the art style
  extractedStyleImageUrl: string | null  // URL of image used for extraction
  // Cover image
  coverImageUrl: string | null  // AI-generated or uploaded cover image
  // Preview theme for consistent card styling
  previewTheme: PreviewTheme | null
  createdAt: string
  updatedAt: string
}

// Story Card - simplified from Card
export interface StoryCard {
  id: string
  storyStackId: string
  title: string  // Scene title
  content: string  // Story text content
  script: string  // Custom JavaScript code for card interactivity
  imageUrl: string | null  // AI-generated or uploaded image
  imagePrompt: string | null  // Prompt used to generate the image
  imageDescription: string | null  // Visual description for image generation (separate from story content)
  audioUrl: string | null  // ElevenLabs-generated audio narration URL
  message: string | null  // Character/narrator dialogue displayed on card
  speaker: string | null  // Who is speaking (character name, narrator, etc.)
  speakerType: 'character' | 'narrator' | 'system' | null  // Type of speaker for styling
  orderIndex: number  // For editor organization
  version: number  // Optimistic concurrency control version
  createdAt: string
  updatedAt: string
}

// Story graph validation types
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  type: 'orphaned_card' | 'dead_end' | 'missing_first_card' | 'invalid_target'
  cardId: string
  message: string
}

export interface ValidationWarning {
  type: 'no_choices' | 'single_choice'
  cardId: string
  message: string
}

// Character Card - a card type that references a character for reusable templates
export interface CharacterCard {
  id: string
  storyStackId: string
  characterId: string  // Reference to the character
  title: string | null  // Optional override title (uses character name if null)
  content: string | null  // Optional override content (uses character appearance if null)
  imageIndex: number  // Which character image to display (0-3)
  showAvatar: boolean  // Whether to show avatar instead of full image
  orderIndex: number
  createdAt: string
  updatedAt: string
}

// Input types for creating/updating story entities
export interface CreateStoryStackInput {
  name: string
  description?: string
}

export interface UpdateStoryStackInput {
  name?: string
  description?: string
  isPublished?: boolean
  slug?: string | null
  firstCardId?: string | null
  coverImageUrl?: string | null
}

export interface CreateStoryCardInput {
  storyStackId: string
  title?: string
  content?: string
  script?: string
  imageUrl?: string | null
  imagePrompt?: string | null
  imageDescription?: string | null
  audioUrl?: string | null
  message?: string | null
  speaker?: string | null
  speakerType?: 'character' | 'narrator' | 'system' | null
  orderIndex?: number
}

export interface UpdateStoryCardInput {
  title?: string
  content?: string
  script?: string
  imageUrl?: string | null
  imagePrompt?: string | null
  imageDescription?: string | null
  audioUrl?: string | null
  message?: string | null
  speaker?: string | null
  speakerType?: 'character' | 'narrator' | 'system' | null
  orderIndex?: number
  version?: number  // Required for optimistic concurrency control
}

export interface CreateCharacterCardInput {
  storyStackId: string
  characterId: string
  title?: string | null
  content?: string | null
  imageIndex?: number
  showAvatar?: boolean
  orderIndex?: number
}

export interface UpdateCharacterCardInput {
  characterId?: string
  title?: string | null
  content?: string | null
  imageIndex?: number
  showAvatar?: boolean
  orderIndex?: number
}

// ============================================================================
// DEPRECATED TYPES - For backward compatibility with old code
// These will be removed in task 15 when old files are deleted
// ============================================================================

/** @deprecated Use StoryStack instead */
export interface Stack {
  id: string
  ownerId: string
  name: string
  description: string | null
  isPublished: boolean
  publishedAt: string | null
  slug: string | null
  firstCardId: string | null
  tags?: string[]
  viewCount?: number
  likeCount?: number
  createdAt: string
  updatedAt: string
}

/** @deprecated */
export interface CreateStackInput {
  name: string
  description?: string
}

/** @deprecated */
export interface UpdateStackInput {
  name?: string
  description?: string
  isPublished?: boolean
  slug?: string | null
  firstCardId?: string | null
}

/** @deprecated */
export interface StackVersion {
  id: string
  stackId: string
  versionNumber: number
  data: any
  createdAt: string
}

/** @deprecated */
export interface CreateStackVersionInput {
  stackId: string
  data: any
}

/** @deprecated */
export interface FlattenedStack {
  id: string
  name: string
  cards: import('./card').Card[]
}
