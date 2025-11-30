/**
 * Hook for graph validation with memoization and fix actions
 */

import { useMemo, useCallback, useState } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { validateGraph, ValidationResult, FixAction } from '../lib/graphValidator'
import { StoryService } from '@/lib/services/story'
import { createClient } from '@/lib/supabase/client'

export interface UseGraphValidationReturn {
  validationResult: ValidationResult
  applyFix: (action: FixAction) => Promise<void>
  navigateToCard: (cardId: string) => void
  isApplyingFix: boolean
  isDiagnosticsVisible: boolean
  toggleDiagnosticsVisibility: () => void
}

export function useGraphValidation(): UseGraphValidationReturn {
  const {
    storyStack,
    storyCards,
    choices,
    setCurrentCardId,
    setStoryStack,
    deleteChoice,
    deleteCard,
  } = useEditor()

  const [isApplyingFix, setIsApplyingFix] = useState(false)
  const [isDiagnosticsVisible, setIsDiagnosticsVisible] = useState(false)

  // Compute validation result with memoization
  const validationResult = useMemo(() => {
    return validateGraph(storyStack, storyCards, choices)
  }, [storyStack, storyCards, choices])

  // Navigate to a specific card
  const navigateToCard = useCallback(
    (cardId: string) => {
      setCurrentCardId(cardId)
    },
    [setCurrentCardId]
  )

  // Toggle diagnostics visibility
  const toggleDiagnosticsVisibility = useCallback(() => {
    setIsDiagnosticsVisible((prev) => !prev)
  }, [])

  // Apply a fix action
  const applyFix = useCallback(
    async (action: FixAction) => {
      if (!storyStack) return

      setIsApplyingFix(true)

      try {
        const supabase = createClient()
        const storyService = new StoryService(supabase)

        switch (action.type) {
          case 'set_first_card': {
            // Update the story stack with new first card
            const updatedStack = await storyService.updateStoryStack(storyStack.id, {
              firstCardId: action.cardId,
            })
            if (updatedStack) {
              setStoryStack(updatedStack)
            }
            break
          }

          case 'delete_choice': {
            // Delete the invalid choice
            await storyService.deleteChoice(action.choiceId)
            deleteChoice(action.choiceId)
            break
          }

          case 'delete_card': {
            // Delete the orphaned card
            await storyService.deleteStoryCard(action.cardId)
            deleteCard(action.cardId)
            break
          }

          case 'navigate_to_card': {
            // Just navigate to the card
            navigateToCard(action.cardId)
            break
          }

          case 'add_choice': {
            // Navigate to the card to add a choice
            navigateToCard(action.fromCardId)
            break
          }

          case 'update_choice_target': {
            // Update the choice with new target
            await storyService.updateChoice(action.choiceId, {
              targetCardId: action.targetCardId,
            })
            break
          }

          case 'update_card_field': {
            // Navigate to the card to update the field
            navigateToCard(action.cardId)
            break
          }
        }
      } catch (error) {
        console.error('Failed to apply fix:', error)
      } finally {
        setIsApplyingFix(false)
      }
    },
    [storyStack, setStoryStack, deleteChoice, deleteCard, navigateToCard]
  )

  return {
    validationResult,
    applyFix,
    navigateToCard,
    isApplyingFix,
    isDiagnosticsVisible,
    toggleDiagnosticsVisibility,
  }
}
