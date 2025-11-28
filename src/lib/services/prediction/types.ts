/**
 * AI Prediction Types
 */

import {
  UserAIPreferences,
  AISuggestionHistory,
  CanvasPosition,
} from '@/lib/types/ai-canvas'

// Default preferences for new users
export const DEFAULT_PREFERENCES: Partial<UserAIPreferences> = {
  styleWeights: {
    adventurous: 0.7,
    dramatic: 0.6,
    mysterious: 0.5,
  },
  themePreferences: {
    preferredGenres: ['fantasy', 'adventure'],
    preferredSettings: ['medieval', 'mystical'],
    preferredMoods: ['epic', 'mysterious'],
  },
  structurePreferences: {
    avgContentLength: 150,
    avgChoiceCount: 3,
    preferredBranchingFactor: 2,
    preferContentImages: true,
  },
}

export interface PreferencesDbRow {
  id: string
  user_id: string
  style_weights: Record<string, number>
  theme_preferences: UserAIPreferences['themePreferences']
  structure_preferences: UserAIPreferences['structurePreferences']
  declined_patterns: UserAIPreferences['declinedPatterns']
  accepted_patterns: UserAIPreferences['acceptedPatterns']
  interaction_count: number
  created_at: string
  updated_at: string
}

export interface HistoryDbRow {
  id: string
  user_id: string
  story_stack_id: string
  source_card_id: string | null
  suggestion_type: AISuggestionHistory['suggestionType']
  suggestion_data: Record<string, unknown>
  confidence: number
  outcome: AISuggestionHistory['outcome']
  final_data: Record<string, unknown> | null
  canvas_position: CanvasPosition | null
  created_at: string
}
