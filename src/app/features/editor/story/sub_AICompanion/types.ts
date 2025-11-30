/**
 * AI Story Companion Types
 * Unified types for the consolidated AI assistance system
 */

export type AICompanionMode = 'suggest' | 'generate' | 'architect'

export interface ContentVariant {
  id: string
  title: string
  content: string
  message?: string | null
  speaker?: string | null
  confidence: number
  reasoning?: string
}

export interface NextStepSuggestion {
  id: string
  title: string
  content: string
  choiceLabel: string
  imagePrompt?: string
  confidence: number
  reasoning?: string
  sourceCardId?: string
}

export interface StoryArchitectPlan {
  cards: Array<{
    title: string
    content: string
    type: 'story' | 'ending'
  }>
  connections: Array<{
    sourceCardIndex: number
    targetCardIndex: number
    label: string
  }>
}

export interface AICompanionState {
  mode: AICompanionMode
  isGenerating: boolean
  error: string | null

  // Content variants for current card
  contentVariants: ContentVariant[]
  selectedVariantId: string | null

  // Next step suggestions
  nextStepSuggestions: NextStepSuggestion[]

  // Story architect
  architectPlan: StoryArchitectPlan | null
}

export interface CardContext {
  id: string
  title: string
  content: string
  message?: string | null
  speaker?: string | null
}

export interface StoryContext {
  storyId: string
  storyName: string
  storyDescription?: string
  currentCard?: CardContext
  predecessors: Array<{ card: CardContext; choiceLabel: string }>
  successors: Array<{ card: CardContext; choiceLabel: string }>
  allCards: CardContext[]
  choices: Array<{ id: string; sourceCardId: string; targetCardId: string; label: string }>
  characters?: Array<{ name: string; appearance?: string }>
}

// Request/Response types for API
export interface GenerateContentVariantsRequest {
  storyContext: StoryContext
  variantCount?: number
}

export interface GenerateNextStepsRequest {
  storyContext: StoryContext
  sourceCardId: string
  maxSuggestions?: number
}

export interface GenerateStoryArchitectRequest {
  description: string
  cardCount: number
  currentCards: Array<{ id: string; title: string }>
}

export interface AICompanionResponse {
  success: boolean
  error?: string
  contentVariants?: ContentVariant[]
  nextStepSuggestions?: NextStepSuggestion[]
  architectPlan?: StoryArchitectPlan
}
