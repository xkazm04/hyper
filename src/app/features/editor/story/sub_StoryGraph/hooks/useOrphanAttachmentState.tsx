'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { StoryService } from '@/lib/services/story'
import { useOrphanAttachment, ParentSuggestion } from './useOrphanAttachment'

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
  const { storyCards, choices, storyStack, addChoice } = useEditor()
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

    try {
      const orphanCard = storyCards.find(c => c.id === orphanCardId)
      const parentCard = storyCards.find(c => c.id === parentCardId)

      if (!orphanCard || !parentCard) {
        throw new Error('Card not found')
      }

      // Create a choice on the parent card that links to the orphan
      const storyService = new StoryService()
      const newChoice = await storyService.createChoice({
        storyCardId: parentCardId,
        targetCardId: orphanCardId,
        label: orphanCard.title || 'Continue',
      })

      // Update the editor context
      addChoice(newChoice)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to attach orphan'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [storyCards, addChoice])

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
  const { storyCards, choices, storyStack, addChoice } = useEditor()
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

    const storyService = new StoryService()
    const newChoice = await storyService.createChoice({
      storyCardId: parentCardId,
      targetCardId: orphanCardId,
      label: orphanCard.title || 'Continue',
    })

    addChoice(newChoice)
    return newChoice
  }, [storyCards, addChoice])

  return {
    getSuggestedParents,
    attachOrphan,
  }
}
