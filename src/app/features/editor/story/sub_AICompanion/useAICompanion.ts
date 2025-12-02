'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
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
  autoSuggestDebounceMs?: number
}

export function useAICompanion(options: UseAICompanionOptions = {}) {
  const { enabled = true, autoSuggestDebounceMs = 3000 } = options

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
  } = useEditor()

  const { success, error: showError } = useToast()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [state, setState] = useState<AICompanionState>({
    mode: 'suggest',
    isGenerating: false,
    error: null,
    contentVariants: [],
    selectedVariantId: null,
    nextStepSuggestions: [],
    architectPlan: null,
  })

  // Build story context from editor state
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

    // Find predecessors (cards that lead to current card)
    const predecessors = choices
      .filter((c) => c.targetCardId === currentCardId)
      .map((c) => {
        const sourceCard = storyCards.find((card) => card.id === c.storyCardId)
        return sourceCard
          ? {
              card: {
                id: sourceCard.id,
                title: sourceCard.title,
                content: sourceCard.content,
                message: sourceCard.message,
                speaker: sourceCard.speaker,
              },
              choiceLabel: c.label,
            }
          : null
      })
      .filter(Boolean) as StoryContext['predecessors']

    // Find successors (cards that current card leads to)
    const successors = choices
      .filter((c) => c.storyCardId === currentCardId)
      .map((c) => {
        const targetCard = storyCards.find((card) => card.id === c.targetCardId)
        return targetCard
          ? {
              card: {
                id: targetCard.id,
                title: targetCard.title,
                content: targetCard.content,
                message: targetCard.message,
                speaker: targetCard.speaker,
              },
              choiceLabel: c.label,
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
  }, [storyStack, storyCards, choices, currentCard, currentCardId, characters])

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

  // Generate story structure via architect
  const generateStoryStructure = useCallback(
    async (description: string, cardCount: number) => {
      if (!description.trim()) {
        showError('Please provide a story description')
        return
      }

      setState((prev) => ({ ...prev, isGenerating: true, error: null }))

      try {
        const response = await fetch('/api/ai/story-companion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'architect-story',
            description,
            cardCount,
            currentCards: storyCards.map((c) => ({ id: c.id, title: c.title })),
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to generate story')
        }

        const data = await response.json()
        if (data.success && data.cards && data.choices) {
          // Add generated cards to editor
          const now = new Date().toISOString()
          data.cards.forEach((card: any, index: number) => {
            addCard({
              id: card.id || uuidv4(),
              storyStackId: storyStack?.id || '',
              title: card.title || 'Untitled',
              content: card.content || '',
              script: '',
              imageUrl: null,
              imagePrompt: null,
              imageDescription: null,
              message: null,
              speaker: null,
              speakerType: null,
              orderIndex: storyCards.length + index,
              version: 1,
              createdAt: now,
              updatedAt: now,
            })
          })

          data.choices.forEach((choice: any, index: number) => {
            addChoice({
              id: choice.id || uuidv4(),
              storyCardId: choice.storyCardId,
              targetCardId: choice.targetCardId,
              label: choice.label,
              orderIndex: index,
              createdAt: now,
              updatedAt: now,
            })
          })

          success(`Created ${data.cards.length} scenes and ${data.choices.length} connections`)
          setState((prev) => ({ ...prev, isGenerating: false }))
        } else {
          throw new Error(data.error || 'Generation failed')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate story'
        setState((prev) => ({ ...prev, error: message, isGenerating: false }))
        showError(message)
      }
    },
    [storyStack, storyCards, addCard, addChoice, success, showError]
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
              message: null,
              speaker: null,
              speakerType: null,
              orderIndex: storyCards.length + i,
              version: 1,
              createdAt: now,
              updatedAt: now,
            })

            // Create the choice
            addChoice({
              id: uuidv4(),
              storyCardId: currentCard.id,
              targetCardId: newCardId,
              label: choice.label,
              orderIndex: choices.filter((c) => c.storyCardId === currentCard.id).length + i,
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
    [currentCard, storyStack, storyCards, choices, updateCardContext, addCard, addChoice, success, showError]
  )

  // Accept a next step suggestion - create new card and choice
  const acceptNextStep = useCallback(
    async (suggestion: NextStepSuggestion) => {
      if (!storyStack) return

      const now = new Date().toISOString()
      const newCardId = uuidv4()

      // Create the new card
      addCard({
        id: newCardId,
        storyStackId: storyStack.id,
        title: suggestion.title,
        content: suggestion.content,
        script: '',
        imageUrl: null,
        imagePrompt: suggestion.imagePrompt || null,
        imageDescription: null,
        message: null,
        speaker: null,
        speakerType: null,
        orderIndex: storyCards.length,
        version: 1,
        createdAt: now,
        updatedAt: now,
      })

      // Create choice linking to the new card
      if (suggestion.sourceCardId) {
        addChoice({
          id: uuidv4(),
          storyCardId: suggestion.sourceCardId,
          targetCardId: newCardId,
          label: suggestion.choiceLabel,
          orderIndex: choices.filter((c) => c.storyCardId === suggestion.sourceCardId).length,
          createdAt: now,
          updatedAt: now,
        })
      }

      // Remove from suggestions
      setState((prev) => ({
        ...prev,
        nextStepSuggestions: prev.nextStepSuggestions.filter((s) => s.id !== suggestion.id),
      }))

      success('Scene added to your story')

      // Trigger new suggestions after a delay
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        generateNextSteps(newCardId)
      }, autoSuggestDebounceMs)
    },
    [storyStack, storyCards, choices, addCard, addChoice, success, generateNextSteps, autoSuggestDebounceMs]
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

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
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
