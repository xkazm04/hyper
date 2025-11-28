/**
 * AI Prediction Models - Database mapping utilities
 */

import {
  UserAIPreferences,
  AISuggestionHistory,
  CanvasPosition,
} from '@/lib/types/ai-canvas'
import { PreferencesDbRow, HistoryDbRow } from './types'

/**
 * Maps database row to UserAIPreferences
 */
export function mapPreferencesFromDb(row: Record<string, unknown>): UserAIPreferences {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    styleWeights: (row.style_weights as Record<string, number>) || {},
    themePreferences: (row.theme_preferences as UserAIPreferences['themePreferences']) || {},
    structurePreferences: (row.structure_preferences as UserAIPreferences['structurePreferences']) || {},
    declinedPatterns: (row.declined_patterns as UserAIPreferences['declinedPatterns']) || [],
    acceptedPatterns: (row.accepted_patterns as UserAIPreferences['acceptedPatterns']) || [],
    interactionCount: (row.interaction_count as number) || 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

/**
 * Maps database row to AISuggestionHistory
 */
export function mapHistoryFromDb(row: Record<string, unknown>): AISuggestionHistory {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    storyStackId: row.story_stack_id as string,
    sourceCardId: row.source_card_id as string | null,
    suggestionType: row.suggestion_type as AISuggestionHistory['suggestionType'],
    suggestionData: (row.suggestion_data as Record<string, unknown>) || {},
    confidence: row.confidence as number,
    outcome: row.outcome as AISuggestionHistory['outcome'],
    finalData: row.final_data as Record<string, unknown> | null,
    canvasPosition: row.canvas_position as CanvasPosition | null,
    createdAt: row.created_at as string,
  }
}

/**
 * Calculate positions for suggested cards around the source
 */
export function calculateSuggestionPositions(
  sourcePosition: CanvasPosition,
  suggestionCount: number,
  spacing: number = 300
): CanvasPosition[] {
  const positions: CanvasPosition[] = []
  const startAngle = -Math.PI / 4
  const angleStep = Math.PI / 2 / Math.max(suggestionCount - 1, 1)

  for (let i = 0; i < suggestionCount; i++) {
    const angle = startAngle + angleStep * i
    positions.push({
      x: sourcePosition.x + spacing + Math.cos(angle) * (spacing / 3),
      y: sourcePosition.y + Math.sin(angle) * spacing,
    })
  }

  return positions
}
