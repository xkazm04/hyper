'use client'

import { useState, useCallback, useEffect } from 'react'
import { StoryCard } from '@/lib/types'
import { GenerationState } from './types'

// ============================================================================
// Content Generation Hook
// ============================================================================

export function useContentGeneration(
  card: StoryCard,
  storyStackId: string,
  onUpdate: (updates: Partial<StoryCard>) => void
) {
  const [state, setState] = useState<GenerationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(card.content || '')

  const hasContent = !!(card.content && card.content.trim().length > 0)

  // Sync edit content when card changes
  useEffect(() => {
    setEditContent(card.content || '')
  }, [card.content])

  const generate = useCallback(async () => {
    if (state === 'loading') return

    setState('loading')
    setError(null)

    try {
      // Fetch predecessors/successors for context
      const [predResponse, succResponse] = await Promise.all([
        fetch(`/api/stories/${storyStackId}/cards/${card.id}/predecessors`),
        fetch(`/api/stories/${storyStackId}/cards/${card.id}/successors`),
      ])

      const predecessors = predResponse.ok ? (await predResponse.json()).predecessors || [] : []
      const successors = succResponse.ok ? (await succResponse.json()).successors || [] : []

      const response = await fetch('/api/ai/generate-card-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predecessors,
          successors,
          currentTitle: card.title,
          currentContent: card.content || '',
          currentMessage: card.message || '',
          currentSpeaker: card.speaker || '',
          existingChoices: [],
          characters: [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const data = await response.json()

      onUpdate({
        title: data.title,
        content: data.content,
        message: data.message || null,
        speaker: data.speaker || null,
      })

      setEditContent(data.content)
      setState('success')

      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content')
      setState('error')
    }
  }, [card, storyStackId, state, onUpdate])

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const saveEdit = useCallback(async () => {
    if (editContent === card.content) {
      setIsEditing(false)
      return
    }

    setState('loading')

    try {
      const response = await fetch(`/api/stories/${storyStackId}/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      onUpdate({ content: editContent })
      setIsEditing(false)
      setState('success')

      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setState('error')
    }
  }, [editContent, card.content, card.id, storyStackId, onUpdate])

  const cancelEdit = useCallback(() => {
    setEditContent(card.content || '')
    setIsEditing(false)
  }, [card.content])

  return {
    state,
    error,
    hasContent,
    isEditing,
    editContent,
    setEditContent,
    generate,
    startEditing,
    saveEdit,
    cancelEdit,
  }
}
