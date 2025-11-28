/**
 * AI Prediction Engine - Main service class
 */

import { createClient } from '@/lib/supabase/client'
import {
  AIPredictionRequest,
  AIPredictionResponse,
  UserAIPreferences,
  CreateUserAIPreferencesInput,
  UpdateUserAIPreferencesInput,
  CreateSuggestionHistoryInput,
  UpdateSuggestionOutcomeInput,
  AISuggestionHistory,
  CanvasPosition,
} from '@/lib/types/ai-canvas'
import { DEFAULT_PREFERENCES } from './types'
import { calculateSuggestionPositions, mapPreferencesFromDb, mapHistoryFromDb } from './models'
import {
  getUserPreferencesFromDb,
  createUserPreferencesInDb,
  updateUserPreferencesInDb,
  recordSuggestionInDb,
  updateSuggestionOutcomeInDb,
} from './cache'

export class AIPredictionService {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient()
  }

  /**
   * Get or create user AI preferences
   */
  async getUserPreferences(userId: string): Promise<UserAIPreferences | null> {
    const preferences = await getUserPreferencesFromDb(userId)
    
    if (!preferences) {
      return this.createUserPreferences(userId, DEFAULT_PREFERENCES)
    }

    return preferences
  }

  /**
   * Create user AI preferences
   */
  async createUserPreferences(
    userId: string,
    input: CreateUserAIPreferencesInput
  ): Promise<UserAIPreferences | null> {
    return createUserPreferencesInDb(userId, input)
  }

  /**
   * Update user AI preferences
   */
  async updateUserPreferences(
    userId: string,
    input: UpdateUserAIPreferencesInput
  ): Promise<UserAIPreferences | null> {
    return updateUserPreferencesInDb(userId, input)
  }

  /**
   * Record a suggestion in history
   */
  async recordSuggestion(
    userId: string,
    input: CreateSuggestionHistoryInput
  ): Promise<AISuggestionHistory | null> {
    return recordSuggestionInDb(userId, input)
  }

  /**
   * Update suggestion outcome (accept/decline)
   */
  async updateSuggestionOutcome(
    suggestionId: string,
    input: UpdateSuggestionOutcomeInput
  ): Promise<AISuggestionHistory | null> {
    return updateSuggestionOutcomeInDb(suggestionId, input)
  }

  /**
   * Generate AI predictions for suggested cards
   */
  async generatePredictions(request: AIPredictionRequest): Promise<AIPredictionResponse> {
    try {
      const response = await fetch('/api/ai/predict-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to generate predictions')
      }

      const data = await response.json()
      return data as AIPredictionResponse
    } catch (error) {
      console.error('Error generating predictions:', error)
      return {
        suggestions: [],
        shouldUpdatePreferences: false,
      }
    }
  }

  /**
   * Learn from user's accept/decline actions
   */
  async learnFromInteraction(
    userId: string,
    suggestionId: string,
    accepted: boolean,
    modifiedData?: Record<string, unknown>
  ): Promise<void> {
    await this.updateSuggestionOutcome(suggestionId, {
      outcome: accepted ? (modifiedData ? 'modified' : 'accepted') : 'declined',
      finalData: modifiedData,
    })

    const preferences = await this.getUserPreferences(userId)
    if (!preferences) return

    await this.updateUserPreferences(userId, {
      interactionCount: preferences.interactionCount + 1,
    })
  }

  /**
   * Calculate positions for suggested cards around the source
   */
  calculateSuggestionPositions(
    sourcePosition: CanvasPosition,
    suggestionCount: number,
    spacing: number = 300
  ): CanvasPosition[] {
    return calculateSuggestionPositions(sourcePosition, suggestionCount, spacing)
  }
}

// Singleton instance
export const aiPredictionService = new AIPredictionService()
