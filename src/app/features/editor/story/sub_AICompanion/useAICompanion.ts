'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { v4 as uuidv4 } from 'uuid'
import type {
  AICompanionMode,
  AICompanionState,
  ContentVariant,
  NextStepSuggestion,
  StoryArchitectPlan,
  StoryContext,
} from './types'

interface UseAICompanionOptions {
  enabled?: boolean
}

export function useAICompanion(options: UseAICompanionOptions = {}) {
  const { enabled = true } = options

  const {
    storyStack,
    storyCards,
    choices,
    currentCard,
    currentCardId,
    characters,
    addCard,
    addChoice,
    updateCard: updateCardContext,
    setChoices,
    getPredecessors,
    getSuccessors,
    getChoicesForCard,
  } = useEditor()

  const { success, error: showError } = useToast()

  const [state, setState] = useState<AICompanionState>({
    mode: 'suggest',
    isGenerating: false,
    error: null,
    contentVariants: [],
    selectedVariantId: null,
    nextStepSuggestions: [],
    architectPlan: null,
  })

  // Build a Map of cardId -> StoryCard for O(1) lookups
  const cardsById = useMemo(() => {
    const map = new Map<string, typeof storyCards[number]>()
    for (const card of storyCards) {
      map.set(card.id, card)
    }
    return map
  }, [storyCards])

  // Build story context from editor state
  // Uses pre-computed graph indices for O(1) predecessor/successor lookups
  const buildStoryContext = useCallback((): StoryContext | null => {
    if (!storyStack) return null

    const currentCardData = currentCard
      ? {
          id: currentCard.id,
          title: currentCard.title,
          content: currentCard.content,
          message: currentCard.message,
          speaker: currentCard.speaker,
        }
      : undefined

    // O(1) lookup using pre-computed predecessorsByCardId Map
    const predecessorRefs = currentCardId ? getPredecessors(currentCardId) : []
    const predecessors = predecessorRefs
      .map((ref) => {
        const sourceCard = cardsById.get(ref.cardId)
        return sourceCard
          ? {
              card: {
                id: sourceCard.id,
                title: sourceCard.title,
                content: sourceCard.content,
                message: sourceCard.message,
                speaker: sourceCard.speaker,
              },
              choiceLabel: ref.choiceLabel,
            }
          : null
      })
      .filter(Boolean) as StoryContext['predecessors']

    // O(1) lookup using pre-computed successorsByCardId Map
    const successorRefs = currentCardId ? getSuccessors(currentCardId) : []
    const successors = successorRefs
      .map((ref) => {
        const targetCard = cardsById.get(ref.cardId)
        return targetCard
          ? {
              card: {
                id: targetCard.id,
                title: targetCard.title,
                content: targetCard.content,
                message: targetCard.message,
                speaker: targetCard.speaker,
              },
              choiceLabel: ref.choiceLabel,
            }
          : null
      })
      .filter(Boolean) as StoryContext['successors']

    return {
      storyId: storyStack.id,
      storyName: storyStack.name,
      storyDescription: storyStack.description || undefined,
      currentCard: currentCardData,
      predecessors,
      successors,
      allCards: storyCards.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.content,
        message: c.message,
        speaker: c.speaker,
      })),
      choices: choices.map((c) => ({
        id: c.id,
        sourceCardId: c.storyCardId,
        targetCardId: c.targetCardId,
        label: c.label,
      })),
      characters: characters?.map((c) => ({ name: c.name, appearance: c.appearance })),
    }
  }, [storyStack, storyCards, choices, currentCard, currentCardId, characters, cardsById, getPredecessors, getSuccessors])

  // Generate content variants for current card (with 1-4 choices each)
  const generateContentVariants = useCallback(async () => {
    const context = buildStoryContext()
    if (!context || !currentCard) {
      showError('Please select a card first')
      return
    }

    setState((prev) => ({ ...prev, isGenerating: true, error: null, contentVariants: [] }))

    try {
      const response = await fetch('/api/ai/story-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-variants',
          storyContext: context,
          variantCount: 3,
          includeChoices: true, // Request 1-4 choices per variant
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const data = await response.json()
      setState((prev) => ({
        ...prev,
        contentVariants: data.variants || [],
        isGenerating: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate content'
      setState((prev) => ({ ...prev, error: message, isGenerating: false }))
      showError(message)
    }
  }, [buildStoryContext, currentCard, showError])

  // Generate next step suggestions
  const generateNextSteps = useCallback(
    async (sourceCardId?: string) => {
      const context = buildStoryContext()
      if (!context) {
        showError('No story context available')
        return
      }

      const effectiveSourceId = sourceCardId || currentCardId
      if (!effectiveSourceId) {
        showError('Please select a card first')
        return
      }

      setState((prev) => ({ ...prev, isGenerating: true, error: null }))

      try {
        const response = await fetch('/api/ai/story-companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'suggest-next-steps',
            storyContext: context,
            sourceCardId: effectiveSourceId,
            maxSuggestions: 3,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate suggestions')
        }

        const data = await response.json()
        setState((prev) => ({
          ...prev,
          nextStepSuggestions: data.suggestions || [],
          isGenerating: false,
        }))
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate suggestions'
        setState((prev) => ({ ...prev, error: message, isGenerating: false }))
        showError(message)
      }
    },
    [buildStoryContext, currentCardId, showError]
  )

  // Generate story structure via architect - tree-based generation with DB persistence
  const generateStoryStructure = useCallback(
    async (levels: number, choicesPerCard: number) => {
      if (!storyStack || !currentCard) {
        showError('Please select a card to branch from')
        return
      }

      setState((prev) => ({ ...prev, isGenerating: true, error: null }))

      try {
        // Build story context for LLM
        const context = buildStoryContext()

        const response = await fetch('/api/ai/story-companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'architect-tree',
            storyContext: context,
            sourceCardId: currentCard.id,
            levels,
            choicesPerCard,
            storyStackId: storyStack.id,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate story tree')
        }

        const data = await response.json()

        if (data.success && data.cards && data.choices) {
          // Cards and choices are already saved to DB by the API
          // Add them to local state
          data.cards.forEach((card: any) => {
            addCard(card)
          })

          data.choices.forEach((choice: any) => {
            addChoice(choice)
          })

          success(`Created ${data.cards.length} scenes and ${data.choices.length} connections`)
          setState((prev) => ({ ...prev, isGenerating: false }))
        } else {
          throw new Error(data.error || 'Generation failed')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate story tree'
        setState((prev) => ({ ...prev, error: message, isGenerating: false }))
        showError(message)
      }
    },
    [storyStack, currentCard, buildStoryContext, addCard, addChoice, success, showError]
  )

  // Apply selected content variant to current card (and create choices if present)
  const applyContentVariant = useCallback(
    async (variant: ContentVariant) => {
      if (!currentCard || !storyStack) return

      try {
        // Update local state immediately
        updateCardContext(currentCard.id, {
          title: variant.title,
          content: variant.content,
          message: variant.message || null,
          speaker: variant.speaker || null,
        })

        // Save to database
        const response = await fetch(`/api/stories/${storyStack.id}/cards/${currentCard.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: variant.title,
            content: variant.content,
            message: variant.message || null,
            speaker: variant.speaker || null,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to save content')
        }

        // Create choices if present in the variant
        if (variant.choices && variant.choices.length > 0) {
          const now = new Date().toISOString()
          let createdChoices = 0

          for (let i = 0; i < variant.choices.length; i++) {
            const choice = variant.choices[i]

            // Create target card for the choice
            const newCardId = uuidv4()
            addCard({
              id: newCardId,
              storyStackId: storyStack.id,
              title: choice.targetTitle,
              content: choice.targetContent || '',
              script: '',
              imageUrl: null,
              imagePrompt: null,
              imageDescription: null,
              audioUrl: null,
              message: null,
              speaker: null,
              speakerType: null,
              orderIndex: storyCards.length + i,
              version: 1,
              createdAt: now,
              updatedAt: now,
            })

            // Create the choice - use O(1) lookup for existing choices count
            addChoice({
              id: uuidv4(),
              storyCardId: currentCard.id,
              targetCardId: newCardId,
              label: choice.label,
              orderIndex: getChoicesForCard(currentCard.id).length + i,
              createdAt: now,
              updatedAt: now,
            })

            createdChoices++
          }

          success(`Content applied with ${createdChoices} choice${createdChoices > 1 ? 's' : ''} created`)
        } else {
          success('Content applied successfully')
        }

        setState((prev) => ({
          ...prev,
          selectedVariantId: variant.id,
          contentVariants: [],
        }))
      } catch (err) {
        showError('Failed to apply content')
      }
    },
    [currentCard, storyStack, storyCards, updateCardContext, addCard, addChoice, success, showError, getChoicesForCard]
  )

  // Accept a next step suggestion - create new card and choice, persist to database
  const acceptNextStep = useCallback(
    async (suggestion: NextStepSuggestion) => {
      if (!storyStack) return

      setState((prev) => ({ ...prev, isGenerating: true }))

      try {
        // 1. Create the new card in database first
        const cardResponse = await fetch(`/api/stories/${storyStack.id}/cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: suggestion.title,
            content: suggestion.content,
            imagePrompt: suggestion.imagePrompt || null,
            orderIndex: storyCards.length,
          }),
        })

        if (!cardResponse.ok) {
          const errorData = await cardResponse.json()
          throw new Error(errorData.error || 'Failed to create card')
        }

        const { storyCard: savedCard } = await cardResponse.json()

        // 2. Add to local state with the database-returned card
        addCard(savedCard)

        // 3. Create choice linking to the new card (if we have a source)
        if (suggestion.sourceCardId) {
          const choiceResponse = await fetch(
            `/api/stories/${storyStack.id}/cards/${suggestion.sourceCardId}/choices`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                label: suggestion.choiceLabel,
                targetCardId: savedCard.id,
                // O(1) lookup for existing choices count
                orderIndex: getChoicesForCard(suggestion.sourceCardId).length,
              }),
            }
          )

          if (!choiceResponse.ok) {
            const errorData = await choiceResponse.json()
            throw new Error(errorData.error || 'Failed to create choice')
          }

          const { choice: savedChoice } = await choiceResponse.json()

          // 4. Add choice to local state - this updates the Choices section immediately
          addChoice(savedChoice)
        }

        // 5. Remove from suggestions
        setState((prev) => ({
          ...prev,
          nextStepSuggestions: prev.nextStepSuggestions.filter((s) => s.id !== suggestion.id),
          isGenerating: false,
        }))

        success('Scene added to your story')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to accept suggestion'
        setState((prev) => ({ ...prev, error: message, isGenerating: false }))
        showError(message)
      }
    },
    [storyStack, storyCards, addCard, addChoice, success, showError, getChoicesForCard]
  )

  // Decline a suggestion
  const declineNextStep = useCallback((suggestionId: string) => {
    setState((prev) => ({
      ...prev,
      nextStepSuggestions: prev.nextStepSuggestions.filter((s) => s.id !== suggestionId),
    }))
  }, [])

  // Dismiss all suggestions
  const dismissAllSuggestions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      nextStepSuggestions: [],
      contentVariants: [],
    }))
  }, [])

  // Set mode
  const setMode = useCallback((mode: AICompanionMode) => {
    setState((prev) => ({ ...prev, mode }))
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  return {
    state,
    setMode,
    clearError,

    // Content generation
    generateContentVariants,
    applyContentVariant,

    // Next steps
    generateNextSteps,
    acceptNextStep,
    declineNextStep,
    dismissAllSuggestions,

    // Story architect
    generateStoryStructure,

    // Context
    storyCardsLength: storyCards.length,
    currentCardId,
    hasCurrentCard: !!currentCard,
  }
}
