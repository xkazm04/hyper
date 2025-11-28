'use client'

import { useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { aiPredictionService } from '@/lib/services/ai-prediction'
import {
  SuggestedCard,
  AIPredictionRequest,
  UserAIPreferences,
  CanvasPosition,
  CardContext,
  ChoiceContext,
} from '@/lib/types/ai-canvas'
import { StoryCard, StoryStack, Choice } from '@/lib/types'

interface UseSuggestionGenerationOptions {
  maxSuggestions: number
  debounceMs: number
}

interface UseSuggestionGenerationReturn {
  buildStoryContext: () => {
    storyName: string
    storyDescription: string | null
    cards: CardContext[]
    choices: ChoiceContext[]
    recentActivity: never[]
  } | null
  generateSuggestions: (sourceCardId?: string) => Promise<void>
}

/**
 * Hook for generating AI suggestions
 * 
 * Features:
 * - Build story context for AI
 * - Generate suggestions from AI service
 * - Calculate positions for suggestions
 * - Record suggestions in history
 */
export function useSuggestionGeneration(
  userId: string | null,
  storyStack: StoryStack | null,
  storyCards: StoryCard[],
  choices: Choice[],
  currentCardId: string | null,
  userPreferences: UserAIPreferences | null,
  options: UseSuggestionGenerationOptions,
  setSuggestions: React.Dispatch<React.SetStateAction<SuggestedCard[]>>,
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  pendingSuggestionIds: React.MutableRefObject<Set<string>>,
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>
): UseSuggestionGenerationReturn {
  const { maxSuggestions } = options

  // Build story context for AI
  const buildStoryContext = useCallback(() => {
    if (!storyStack) return null

    // Calculate depth for each card using BFS
    const depthMap = new Map<string, number>()
    if (storyStack.firstCardId) {
      const queue: Array<{ id: string; depth: number }> = [
        { id: storyStack.firstCardId, depth: 0 },
      ]
      const visited = new Set<string>()

      while (queue.length > 0) {
        const { id, depth } = queue.shift()!
        if (visited.has(id)) continue
        visited.add(id)
        depthMap.set(id, depth)

        choices
          .filter(c => c.storyCardId === id && c.targetCardId)
          .forEach(c => {
            if (!visited.has(c.targetCardId)) {
              queue.push({ id: c.targetCardId, depth: depth + 1 })
            }
          })
      }
    }

    const cards: CardContext[] = storyCards.map(card => ({
      id: card.id,
      title: card.title,
      content: card.content,
      hasImage: !!card.imageUrl,
      depth: depthMap.get(card.id) ?? -1,
    }))

    const choiceContexts: ChoiceContext[] = choices
      .filter(c => c.targetCardId)
      .map(c => ({
        sourceCardId: c.storyCardId,
        label: c.label,
        targetCardId: c.targetCardId,
      }))

    return {
      storyName: storyStack.name,
      storyDescription: storyStack.description,
      cards,
      choices: choiceContexts,
      recentActivity: [],
    }
  }, [storyStack, storyCards, choices])

  // Generate suggestions from AI
  const generateSuggestions = useCallback(async (sourceCardId?: string) => {
    if (!storyStack || !userId) return

    // Clear pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    setIsGenerating(true)
    setError(null)

    try {
      const storyContext = buildStoryContext()
      if (!storyContext) {
        throw new Error('Could not build story context')
      }

      const request: AIPredictionRequest = {
        storyStackId: storyStack.id,
        storyContext,
        currentCardId: sourceCardId || currentCardId || undefined,
        preferences: userPreferences || undefined,
      }

      const response = await aiPredictionService.generatePredictions(request)

      // Calculate positions for suggestions
      const sourceCard = storyCards.find(
        c => c.id === (sourceCardId || currentCardId)
      )
      const sourcePosition: CanvasPosition = sourceCard
        ? { x: 0, y: 0 } // Position will be calculated by canvas layout
        : { x: 400, y: 200 }

      const positions = aiPredictionService.calculateSuggestionPositions(
        sourcePosition,
        Math.min(response.suggestions.length, maxSuggestions)
      )

      // Map positions to suggestions
      const suggestionsWithPositions = response.suggestions
        .slice(0, maxSuggestions)
        .map((s, i) => ({
          ...s,
          position: positions[i] || { x: 300 + i * 200, y: 100 },
          isAnimatingIn: true,
          isAnimatingOut: false,
          isHovered: false,
        }))

      // Record suggestions in history
      for (const suggestion of suggestionsWithPositions) {
        const recorded = await aiPredictionService.recordSuggestion(userId, {
          storyStackId: storyStack.id,
          sourceCardId: suggestion.sourceCardId,
          suggestionType: 'card',
          suggestionData: {
            title: suggestion.title,
            content: suggestion.content,
            choiceLabel: suggestion.choiceLabel,
            imagePrompt: suggestion.imagePrompt,
          },
          confidence: suggestion.confidence,
          canvasPosition: suggestion.position,
        })

        if (recorded) {
          pendingSuggestionIds.current.add(recorded.id)
        }
      }

      setSuggestions(suggestionsWithPositions)

      // Clear animation state after spawn
      setTimeout(() => {
        setSuggestions(prev =>
          prev.map(s => ({ ...s, isAnimatingIn: false }))
        )
      }, 500)
    } catch (err) {
      console.error('Error generating suggestions:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate suggestions')
    } finally {
      setIsGenerating(false)
    }
  }, [
    storyStack,
    userId,
    currentCardId,
    storyCards,
    userPreferences,
    maxSuggestions,
    buildStoryContext,
    setSuggestions,
    setIsGenerating,
    setError,
    pendingSuggestionIds,
    debounceTimerRef,
  ])

  return {
    buildStoryContext,
    generateSuggestions,
  }
}
