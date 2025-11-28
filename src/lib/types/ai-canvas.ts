/**
 * Types for the Infinite Canvas AI Co-Creator system
 */

// Suggestion confidence levels for visual indicators
export type ConfidenceLevel = 'high' | 'medium' | 'low'

// Types of suggestions the AI can make
export type SuggestionType = 'card' | 'choice' | 'content' | 'image_prompt'

// Outcome of a suggestion
export type SuggestionOutcome = 'pending' | 'accepted' | 'declined' | 'modified'

// Position on the infinite canvas
export interface CanvasPosition {
  x: number
  y: number
}

// A suggested card from the AI
export interface SuggestedCard {
  id: string
  title: string
  content: string
  imagePrompt?: string
  // Which existing card this branches from
  sourceCardId: string
  // The choice label that would lead to this card
  choiceLabel: string
  // AI confidence (0.0 - 1.0)
  confidence: number
  // Position on canvas for display
  position: CanvasPosition
  // Visual state
  isHovered: boolean
  isAnimatingIn: boolean
  isAnimatingOut: boolean
}

// User's AI preferences (stored in Supabase)
export interface UserAIPreferences {
  id: string
  userId: string
  styleWeights: StyleWeights
  themePreferences: ThemePreferences
  structurePreferences: StructurePreferences
  declinedPatterns: PatternRecord[]
  acceptedPatterns: PatternRecord[]
  interactionCount: number
  createdAt: string
  updatedAt: string
}

// Style weights for content generation
export interface StyleWeights {
  formal?: number
  casual?: number
  dramatic?: number
  humorous?: number
  mysterious?: number
  adventurous?: number
  romantic?: number
  dark?: number
  [key: string]: number | undefined
}

// Theme preferences
export interface ThemePreferences {
  preferredGenres?: string[]
  preferredSettings?: string[]
  preferredMoods?: string[]
  avoidGenres?: string[]
  avoidSettings?: string[]
}

// Structure preferences for cards
export interface StructurePreferences {
  avgContentLength?: number
  avgChoiceCount?: number
  preferredBranchingFactor?: number
  preferContentImages?: boolean
}

// Pattern record for learning
export interface PatternRecord {
  pattern: string
  category: string
  weight: number
  timestamp: string
}

// Suggestion history record
export interface AISuggestionHistory {
  id: string
  userId: string
  storyStackId: string
  sourceCardId: string | null
  suggestionType: SuggestionType
  suggestionData: Record<string, unknown>
  confidence: number
  outcome: SuggestionOutcome
  finalData: Record<string, unknown> | null
  canvasPosition: CanvasPosition | null
  createdAt: string
}

// Request for AI prediction
export interface AIPredictionRequest {
  storyStackId: string
  storyContext: StoryContext
  currentCardId?: string
  preferences?: UserAIPreferences
}

// Story context for AI prediction
export interface StoryContext {
  storyName: string
  storyDescription: string | null
  cards: CardContext[]
  choices: ChoiceContext[]
  recentActivity: string[]
}

// Simplified card context for AI
export interface CardContext {
  id: string
  title: string
  content: string
  hasImage: boolean
  depth: number
}

// Simplified choice context for AI
export interface ChoiceContext {
  sourceCardId: string
  label: string
  targetCardId: string
}

// Response from AI prediction
export interface AIPredictionResponse {
  suggestions: SuggestedCard[]
  reasoning?: string
  // Learning feedback
  shouldUpdatePreferences: boolean
  preferenceUpdates?: Partial<UserAIPreferences>
}

// Canvas view state
export interface CanvasViewState {
  zoom: number
  panX: number
  panY: number
  selectedNodeId: string | null
  hoveredSuggestionId: string | null
}

// Animation states for suggestions
export interface SuggestionAnimationState {
  isSpawning: boolean
  isWiring: boolean
  isDismissing: boolean
  isAccepting: boolean
}

// Input for creating/updating AI preferences
export interface CreateUserAIPreferencesInput {
  styleWeights?: StyleWeights
  themePreferences?: ThemePreferences
  structurePreferences?: StructurePreferences
}

export interface UpdateUserAIPreferencesInput {
  styleWeights?: StyleWeights
  themePreferences?: ThemePreferences
  structurePreferences?: StructurePreferences
  declinedPatterns?: PatternRecord[]
  acceptedPatterns?: PatternRecord[]
  interactionCount?: number
}

// Input for creating suggestion history
export interface CreateSuggestionHistoryInput {
  storyStackId: string
  sourceCardId?: string
  suggestionType: SuggestionType
  suggestionData: Record<string, unknown>
  confidence: number
  canvasPosition?: CanvasPosition
}

// Input for updating suggestion outcome
export interface UpdateSuggestionOutcomeInput {
  outcome: SuggestionOutcome
  finalData?: Record<string, unknown>
}

// Confidence color mapping
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'emerald'
  if (confidence >= 0.5) return 'amber'
  return 'red'
}

// Confidence level from numeric value
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}
