'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { StoryService } from '@/lib/services/story/index'
import { useOrphanAttachment, ParentSuggestion } from './useOrphanAttachment'
import { v4 as uuidv4 } from 'uuid'

interface OrphanAttachmentContextType {
  // State
  activeOrphanId: string | null
  suggestions: ParentSuggestion[]
  isLoading: boolean
  error: string | null

  // Actions
  openAttachmentHelper: (orphanCardId: string) => void
  closeAttachmentHelper: () => void
  attachOrphan: (parentCardId: string, orphanCardId: string) => Promise<void>
}

const OrphanAttachmentContext = createContext<OrphanAttachmentContextType | undefined>(undefined)

export function useOrphanAttachmentState() {
  const context = useContext(OrphanAttachmentContext)
  if (!context) {
    throw new Error('useOrphanAttachmentState must be used within OrphanAttachmentProvider')
  }
  return context
}

interface OrphanAttachmentProviderProps {
  children: ReactNode
}

export function OrphanAttachmentProvider({ children }: OrphanAttachmentProviderProps) {
  const {
    storyCards,
    choices,
    storyStack,
    addChoice,
    deleteChoice,
    startOperation,
    completeOperation,
    failOperation,
  } = useEditor()
  const { getSuggestedParents } = useOrphanAttachment(
    storyCards,
    choices,
    storyStack?.firstCardId ?? null
  )

  const [activeOrphanId, setActiveOrphanId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<ParentSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openAttachmentHelper = useCallback((orphanCardId: string) => {
    setActiveOrphanId(orphanCardId)
    const suggestedParents = getSuggestedParents(orphanCardId)
    setSuggestions(suggestedParents)
    setError(null)
  }, [getSuggestedParents])

  const closeAttachmentHelper = useCallback(() => {
    setActiveOrphanId(null)
    setSuggestions([])
    setError(null)
  }, [])

  const attachOrphan = useCallback(async (parentCardId: string, orphanCardId: string) => {
    setIsLoading(true)
    setError(null)

    const orphanCard = storyCards.find(c => c.id === orphanCardId)
    const parentCard = storyCards.find(c => c.id === parentCardId)

    if (!orphanCard || !parentCard) {
      setError('Card not found')
      setIsLoading(false)
      throw new Error('Card not found')
    }

    // Generate a temporary ID for the optimistic choice
    const tempChoiceId = uuidv4()
    const operationId = startOperation(tempChoiceId, 'add_choice')

    // Optimistically add the choice to UI
    const optimisticChoice = {
      id: tempChoiceId,
      storyCardId: parentCardId,
      targetCardId: orphanCardId,
      label: orphanCard.title || 'Continue',
      orderIndex: choices.filter(c => c.storyCardId === parentCardId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addChoice(optimisticChoice)

    try {
      // Create a choice on the parent card that links to the orphan
      const storyService = new StoryService()
      const newChoice = await storyService.createChoice({
        storyCardId: parentCardId,
        targetCardId: orphanCardId,
        label: orphanCard.title || 'Continue',
      })

      // Remove the temporary choice and add the real one
      deleteChoice(tempChoiceId)
      addChoice(newChoice)
      completeOperation(operationId)
    } catch (err) {
      // Rollback - remove the optimistic choice
      deleteChoice(tempChoiceId)
      const message = err instanceof Error ? err.message : 'Failed to attach orphan'
      setError(message)
      failOperation(operationId, message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [storyCards, choices, addChoice, deleteChoice, startOperation, completeOperation, failOperation])

  const value = useMemo(() => ({
    activeOrphanId,
    suggestions,
    isLoading,
    error,
    openAttachmentHelper,
    closeAttachmentHelper,
    attachOrphan,
  }), [
    activeOrphanId,
    suggestions,
    isLoading,
    error,
    openAttachmentHelper,
    closeAttachmentHelper,
    attachOrphan,
  ])

  return (
    <OrphanAttachmentContext.Provider value={value}>
      {children}
    </OrphanAttachmentContext.Provider>
  )
}

// Export a simple hook that can be used without the context for simpler cases
export function useOrphanAttachmentActions() {
  const {
    storyCards,
    choices,
    storyStack,
    addChoice,
    deleteChoice,
    startOperation,
    completeOperation,
    failOperation,
  } = useEditor()
  const { getSuggestedParents } = useOrphanAttachment(
    storyCards,
    choices,
    storyStack?.firstCardId ?? null
  )

  const attachOrphan = useCallback(async (parentCardId: string, orphanCardId: string) => {
    const orphanCard = storyCards.find(c => c.id === orphanCardId)
    if (!orphanCard) {
      throw new Error('Orphan card not found')
    }

    // Generate a temporary ID for the optimistic choice
    const tempChoiceId = uuidv4()
    const operationId = startOperation(tempChoiceId, 'add_choice')

    // Optimistically add the choice to UI
    const optimisticChoice = {
      id: tempChoiceId,
      storyCardId: parentCardId,
      targetCardId: orphanCardId,
      label: orphanCard.title || 'Continue',
      orderIndex: choices.filter(c => c.storyCardId === parentCardId).length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    addChoice(optimisticChoice)

    try {
      const storyService = new StoryService()
      const newChoice = await storyService.createChoice({
        storyCardId: parentCardId,
        targetCardId: orphanCardId,
        label: orphanCard.title || 'Continue',
      })

      // Replace the optimistic choice with the real one
      deleteChoice(tempChoiceId)
      addChoice(newChoice)
      completeOperation(operationId)
      return newChoice
    } catch (err) {
      // Rollback
      deleteChoice(tempChoiceId)
      failOperation(operationId, err instanceof Error ? err.message : 'Failed to attach orphan')
      throw err
    }
  }, [storyCards, choices, addChoice, deleteChoice, startOperation, completeOperation, failOperation])

  return {
    getSuggestedParents,
    attachOrphan,
  }
}
