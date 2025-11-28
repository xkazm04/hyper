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
  message: string | null  // Character/narrator dialogue displayed on card
  speaker: string | null  // Who is speaking (character name, narrator, etc.)
  speakerType: 'character' | 'narrator' | 'system' | null  // Type of speaker for styling
  orderIndex: number  // For editor organization
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
}

export interface CreateStoryCardInput {
  storyStackId: string
  title?: string
  content?: string
  script?: string
  imageUrl?: string | null
  imagePrompt?: string | null
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
  message?: string | null
  speaker?: string | null
  speakerType?: 'character' | 'narrator' | 'system' | null
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
