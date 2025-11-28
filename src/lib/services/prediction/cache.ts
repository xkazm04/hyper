/**
 * AI Prediction Cache - Supabase operations for preferences and history
 */

import { createClient } from '@/lib/supabase/client'
import {
  UserAIPreferences,
  CreateUserAIPreferencesInput,
  UpdateUserAIPreferencesInput,
  CreateSuggestionHistoryInput,
  UpdateSuggestionOutcomeInput,
  AISuggestionHistory,
} from '@/lib/types/ai-canvas'
import { DEFAULT_PREFERENCES } from './types'
import { mapPreferencesFromDb, mapHistoryFromDb } from './models'

const supabase = createClient()

/**
 * Get user AI preferences from database
 */
export async function getUserPreferencesFromDb(userId: string): Promise<UserAIPreferences | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('user_ai_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user preferences:', error)
      return null
    }

    return data ? mapPreferencesFromDb(data) : null
  } catch (err) {
    console.warn('AI preferences table may not exist:', err)
    return null
  }
}

/**
 * Create user AI preferences in database
 */
export async function createUserPreferencesInDb(
  userId: string,
  input: CreateUserAIPreferencesInput
): Promise<UserAIPreferences | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('user_ai_preferences')
      .insert({
        user_id: userId,
        style_weights: input.styleWeights || {},
        theme_preferences: input.themePreferences || {},
        structure_preferences: input.structurePreferences || {},
        declined_patterns: [],
        accepted_patterns: [],
        interaction_count: 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating user preferences:', error)
      return null
    }

    return data ? mapPreferencesFromDb(data) : null
  } catch (err) {
    console.warn('Failed to create AI preferences:', err)
    return null
  }
}

/**
 * Update user AI preferences in database
 */
export async function updateUserPreferencesInDb(
  userId: string,
  input: UpdateUserAIPreferencesInput
): Promise<UserAIPreferences | null> {
  try {
    const updateData: Record<string, unknown> = {}

    if (input.styleWeights) updateData.style_weights = input.styleWeights
    if (input.themePreferences) updateData.theme_preferences = input.themePreferences
    if (input.structurePreferences) updateData.structure_preferences = input.structurePreferences
    if (input.declinedPatterns) updateData.declined_patterns = input.declinedPatterns
    if (input.acceptedPatterns) updateData.accepted_patterns = input.acceptedPatterns
    if (input.interactionCount !== undefined) updateData.interaction_count = input.interactionCount

    const { data, error } = await (supabase as any)
      .from('user_ai_preferences')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return null
    }

    return data ? mapPreferencesFromDb(data) : null
  } catch (err) {
    console.warn('Failed to update AI preferences:', err)
    return null
  }
}

/**
 * Record a suggestion in history
 */
export async function recordSuggestionInDb(
  userId: string,
  input: CreateSuggestionHistoryInput
): Promise<AISuggestionHistory | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('ai_suggestion_history')
      .insert({
        user_id: userId,
        story_stack_id: input.storyStackId,
        source_card_id: input.sourceCardId || null,
        suggestion_type: input.suggestionType,
        suggestion_data: input.suggestionData,
        confidence: input.confidence,
        outcome: 'pending',
        canvas_position: input.canvasPosition || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error recording suggestion:', error)
      return null
    }

    return data ? mapHistoryFromDb(data) : null
  } catch (err) {
    console.warn('Failed to record suggestion:', err)
    return null
  }
}

/**
 * Update suggestion outcome (accept/decline)
 */
export async function updateSuggestionOutcomeInDb(
  suggestionId: string,
  input: UpdateSuggestionOutcomeInput
): Promise<AISuggestionHistory | null> {
  try {
    const { data, error } = await (supabase as any)
      .from('ai_suggestion_history')
      .update({
        outcome: input.outcome,
        final_data: input.finalData || null,
      })
      .eq('id', suggestionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating suggestion outcome:', error)
      return null
    }

    return data ? mapHistoryFromDb(data) : null
  } catch (err) {
    console.warn('Failed to update suggestion outcome:', err)
    return null
  }
}
