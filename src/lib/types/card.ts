// Card types - Choice, deprecated Card/Element types, and related input types

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

// Input types for creating/updating choices
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

// ============================================================================
// DEPRECATED TYPES - For backward compatibility with old code
// These will be removed in task 15 when old files are deleted
// ============================================================================

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
export interface NestedStackProperties {
  stackId: string
  [key: string]: any
}
