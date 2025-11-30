// Common types - User, Session, Errors, and shared utilities

// User types
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

// Preview theme configuration for card styling
export interface PreviewTheme {
  fontFamily: 'serif' | 'sans-serif' | 'mono' | 'fantasy'
  titleFont: 'serif' | 'sans-serif' | 'mono' | 'fantasy'
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full'
  borderStyle: 'solid' | 'dashed' | 'double' | 'none'
  borderWidth: number
  messageBackground: string
  messageTextColor: string
  messageBorderColor: string
  choiceBackground: string
  choiceTextColor: string
  choiceBorderColor: string
  choiceHoverBackground: string
  accentColor: string
  shadowStyle: 'none' | 'soft' | 'hard' | 'glow'
  overlayOpacity: number
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

export class CharacterCardNotFoundError extends Error {
  constructor(id: string) {
    super(`Character card not found: ${id}`)
    this.name = 'CharacterCardNotFoundError'
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
