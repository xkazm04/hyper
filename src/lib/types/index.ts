// User types (unchanged)
export interface User {
  id: string
  email: string
  username?: string
  createdAt: string
}

export interface Session {
  user: User
  accessToken: string
  refreshToken: string
}

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
  orderIndex: number  // For editor organization
  createdAt: string
  updatedAt: string
}

// Choice - replaces Element (button type only)
export interface Choice {
  id: string
  storyCardId: string
  label: string  // Button text (e.g., "Go north", "Fight the dragon")
  targetCardId: string  // Which card to navigate to
  orderIndex: number  // Display order
  createdAt: string
  updatedAt: string
}

// Character - for story characters
export interface Character {
  id: string
  storyStackId: string
  name: string
  appearance: string  // Description of character's appearance
  imageUrls: string[]  // Up to 4 AI-generated character images
  imagePrompts: string[]  // Prompts used to generate the images
  avatarUrl: string | null  // Small RPG-style avatar image
  avatarPrompt: string | null  // Prompt used to generate the avatar
  orderIndex: number  // For editor organization
  createdAt: string
  updatedAt: string
}

// Character archetype options
export type CharacterArchetype = 
  | 'knight'
  | 'wizard'
  | 'assassin'
  | 'ranger'
  | 'cleric'
  | 'barbarian'
  | 'bard'
  | 'custom'

// Character pose options
export type CharacterPose = 
  | 'heroic_stance'
  | 'battle_ready'
  | 'casual_standing'
  | 'sitting'
  | 'walking'
  | 'action_pose'
  | 'mysterious'
  | 'regal'

// Input types for creating/updating entities
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
  orderIndex?: number
}

export interface UpdateStoryCardInput {
  title?: string
  content?: string
  script?: string
  imageUrl?: string | null
  imagePrompt?: string | null
  orderIndex?: number
}

export interface CreateChoiceInput {
  storyCardId: string
  label: string
  targetCardId: string
  orderIndex?: number
}

export interface UpdateChoiceInput {
  label?: string
  targetCardId?: string
  orderIndex?: number
}

export interface CreateCharacterInput {
  storyStackId: string
  name: string
  appearance?: string
  imageUrls?: string[]
  imagePrompts?: string[]
  avatarUrl?: string | null
  avatarPrompt?: string | null
  orderIndex?: number
}

export interface UpdateCharacterInput {
  name?: string
  appearance?: string
  imageUrls?: string[]
  imagePrompts?: string[]
  avatarUrl?: string | null
  avatarPrompt?: string | null
  orderIndex?: number
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

// Error types
export class StoryNotFoundError extends Error {
  constructor(id: string) {
    super(`Story stack not found: ${id}`)
    this.name = 'StoryNotFoundError'
  }
}

export class CardNotFoundError extends Error {
  constructor(id: string) {
    super(`Story card not found: ${id}`)
    this.name = 'CardNotFoundError'
  }
}

export class ChoiceNotFoundError extends Error {
  constructor(id: string) {
    super(`Choice not found: ${id}`)
    this.name = 'ChoiceNotFoundError'
  }
}

export class CharacterNotFoundError extends Error {
  constructor(id: string) {
    super(`Character not found: ${id}`)
    this.name = 'CharacterNotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized access') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ImageGenerationError extends Error {
  constructor(message: string) {
    super(`Image generation failed: ${message}`)
    this.name = 'ImageGenerationError'
  }
}

export class ImageUploadError extends Error {
  constructor(message: string) {
    super(`Image upload failed: ${message}`)
    this.name = 'ImageUploadError'
  }
}

export class StoryValidationError extends Error {
  constructor(message: string) {
    super(`Story validation failed: ${message}`)
    this.name = 'StoryValidationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(`Database operation failed: ${message}`)
    this.name = 'DatabaseError'
  }
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

/** @deprecated Use StoryCard instead */
export interface Card {
  id: string
  stackId: string
  title: string
  name?: string
  content: string
  script?: string
  imageUrl: string | null
  imagePrompt: string | null
  orderIndex: number
  createdAt: string
  updatedAt: string
}

/** @deprecated Use Choice instead */
export interface Element {
  id: string
  cardId: string
  type: string
  properties: any
  orderIndex: number
  createdAt: string
  updatedAt: string
}

/** @deprecated */
export type ElementType = 'button' | 'text' | 'image' | 'input' | 'shape' | 'nested_stack'

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
export interface NestedStackProperties {
  stackId: string
  [key: string]: any
}

/** @deprecated */
export interface FlattenedStack {
  id: string
  name: string
  cards: Card[]
}

/** @deprecated */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
    strategy?: PaginationStrategy
    hasNextPage?: boolean
    hasPreviousPage?: boolean
    nextCursor?: string
    previousCursor?: string
  }
}

/** @deprecated */
export type PaginationStrategy = 'offset' | 'cursor' | 'keyset'

/** @deprecated */
export interface Package {
  id: string
  name: string
  description: string | null
  slug: string
  ownerId: string
  stackId: string
  version: string
  downloads: number
  likes: number
  tags?: string[]
  createdAt: string
  updatedAt: string
}

/** @deprecated */
export interface Deployment {
  id: string
  stackId: string
  url: string
  status: string
  createdAt: string
  updatedAt: string
}

/** @deprecated */
export interface StackReference {
  id: string
  parentStackId: string
  childStackId: string
  createdAt: string
}

/** @deprecated */
export interface Asset {
  id: string
  stackId: string
  url: string
  type: string
  createdAt: string
}

/** @deprecated */
export type PackageCategory = 'template' | 'component' | 'utility' | 'game' | 'other'
