'use client'

import { useCallback, useEffect } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { aiPredictionService } from '@/lib/services/ai-prediction'
import { SuggestedCard } from '@/lib/types/ai-canvas'
import { StoryCard } from '@/lib/types'
import { useSuggestionState, useSuggestionGeneration } from './sub_useAISuggestions'

interface UseAISuggestionsOptions {
  enabled?: boolean
  debounceMs?: number
  maxSuggestions?: number
}

interface UseAISuggestionsReturn {
  suggestions: SuggestedCard[]
  isGenerating: boolean
  error: string | null
  generateSuggestions: (sourceCardId?: string) => Promise<void>
  acceptSuggestion: (suggestion: SuggestedCard) => Promise<void>
  declineSuggestion: (suggestionId: string) => Promise<void>
  dismissAllSuggestions: () => void
  hoveredSuggestionId: string | null
  setHoveredSuggestionId: (id: string | null) => void
}

/**
 * Hook for managing AI-generated card suggestions on the infinite canvas
 * 
 * Composed of:
 * - useSuggestionState: Manages suggestion state and user preferences
 * - useSuggestionGeneration: Handles AI suggestion generation
 */
export function useAISuggestions(
  userId: string | null,
  options: UseAISuggestionsOptions = {}
): UseAISuggestionsReturn {
  const {
    enabled = true,
    debounceMs = 2000,
    maxSuggestions = 3,
  } = options

  const {
    storyStack,
    storyCards,
    choices,
    currentCardId,
    addCard,
    addChoice,
  } = useEditor()

  // Use extracted state hook
  const {
    suggestions,
    setSuggestions,
    isGenerating,
    setIsGenerating,
    error,
    setError,
    hoveredSuggestionId,
    setHoveredSuggestionId,
    userPreferences,
    pendingSuggestionIds,
    debounceTimerRef,
  } = useSuggestionState(userId, enabled)

  // Use extracted generation hook
  const { generateSuggestions } = useSuggestionGeneration(
    userId,
    storyStack,
    storyCards,
    choices,
    currentCardId,
    userPreferences,
    { maxSuggestions, debounceMs },
    setSuggestions,
    setIsGenerating,
    setError,
    pendingSuggestionIds,
    debounceTimerRef
  )

  // Accept a suggestion - create the card and choice
  const acceptSuggestion = useCallback(async (suggestion: SuggestedCard) => {
    if (!storyStack || !userId) return

    try {
      // Create the new card
      const newCard: StoryCard = {
        id: crypto.randomUUID(),
        storyStackId: storyStack.id,
        title: suggestion.title,
        content: suggestion.content,
        script: '',
        imageUrl: null,
        imagePrompt: suggestion.imagePrompt || null,
        imageDescription: null,
        audioUrl: null,
        message: null,
        speaker: null,
        speakerType: null,
        orderIndex: storyCards.length,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addCard(newCard)

      // Create the choice linking source to new card
      if (suggestion.sourceCardId) {
        const newChoice = {
          id: crypto.randomUUID(),
          storyCardId: suggestion.sourceCardId,
          label: suggestion.choiceLabel,
          targetCardId: newCard.id,
          orderIndex: choices.filter(c => c.storyCardId === suggestion.sourceCardId).length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        addChoice(newChoice)
      }

      // Learn from acceptance
      await aiPredictionService.learnFromInteraction(userId, suggestion.id, true)

      // Animate out and remove the suggestion
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestion.id ? { ...s, isAnimatingOut: true } : s
        )
      )

      setTimeout(() => {
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
      }, 300)

      // Trigger new suggestions after acceptance (debounced)
      debounceTimerRef.current = setTimeout(() => {
        generateSuggestions(newCard.id)
      }, debounceMs)
    } catch (err) {
      console.error('Error accepting suggestion:', err)
      setError('Failed to accept suggestion')
    }
  }, [storyStack, userId, storyCards, choices, addCard, addChoice, generateSuggestions, debounceMs, setSuggestions, setError, debounceTimerRef])

  // Decline a suggestion
  const declineSuggestion = useCallback(async (suggestionId: string) => {
    if (!userId) return

    // Learn from decline
    await aiPredictionService.learnFromInteraction(userId, suggestionId, false)

    // Animate out and remove
    setSuggestions(prev =>
      prev.map(s =>
        s.id === suggestionId ? { ...s, isAnimatingOut: true } : s
      )
    )

    setTimeout(() => {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    }, 300)
  }, [userId, setSuggestions])

  // Dismiss all suggestions
  const dismissAllSuggestions = useCallback(() => {
    setSuggestions(prev =>
      prev.map(s => ({ ...s, isAnimatingOut: true }))
    )

    setTimeout(() => {
      setSuggestions([])
    }, 300)
  }, [setSuggestions])

  // Auto-generate suggestions when current card changes (debounced)
  useEffect(() => {
    if (!enabled || !currentCardId || storyCards.length === 0) return

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce the auto-generation
    debounceTimerRef.current = setTimeout(() => {
      generateSuggestions(currentCardId)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [currentCardId, enabled, storyCards.length, debounceMs, generateSuggestions, debounceTimerRef])

  return {
    suggestions,
    isGenerating,
    error,
    generateSuggestions,
    acceptSuggestion,
    declineSuggestion,
    dismissAllSuggestions,
    hoveredSuggestionId,
    setHoveredSuggestionId,
  }
}
