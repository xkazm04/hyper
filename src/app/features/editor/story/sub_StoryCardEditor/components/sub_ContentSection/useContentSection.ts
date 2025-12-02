'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAutoSave } from '../../lib/useAutoSave'
import { updateCard, fetchCard, VersionConflictError } from '../../lib/cardApi'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { useUndoRedoContext } from '@/app/features/editor/undo-redo'
import { StoryCard } from '@/lib/types'

interface PredecessorInfo {
  card: { id: string; title: string; content: string; orderIndex: number }
  choiceLabel: string
}

interface SuccessorInfo {
  card: { id: string; title: string; content: string; orderIndex: number }
  choiceLabel: string
}

interface UseContentSectionProps {
  cardId: string
  storyStackId: string
  initialTitle: string
  initialContent: string
  initialMessage?: string | null
  initialSpeaker?: string | null
  currentCard?: StoryCard
  onSaveComplete?: () => void
}

export function useContentSection({
  cardId, storyStackId, initialTitle, initialContent, initialMessage, initialSpeaker, currentCard, onSaveComplete,
}: UseContentSectionProps) {
  const { updateCard: updateCardContext, characters, currentCard: contextCard } = useEditor()
  const { error: showError, success, warning: showWarning } = useToast()
  const { recordAction } = useUndoRedoContext()
  const activeCard = currentCard || contextCard

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [message, setMessage] = useState(initialMessage || '')
  const [speaker, setSpeaker] = useState(initialSpeaker || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [predecessors, setPredecessors] = useState<PredecessorInfo[]>([])
  const [successors, setSuccessors] = useState<SuccessorInfo[]>([])
  const [hasContext, setHasContext] = useState(false)
  const [isLoadingContext, setIsLoadingContext] = useState(true)
  const [hasVersionConflict, setHasVersionConflict] = useState(false)

  // Track the current version of the card for optimistic concurrency control
  const versionRef = useRef<number>(activeCard?.version ?? 1)

  useEffect(() => {
    setTitle(initialTitle); setContent(initialContent)
    setMessage(initialMessage || ''); setSpeaker(initialSpeaker || '')
    // Update version when card changes
    versionRef.current = activeCard?.version ?? 1
    setHasVersionConflict(false)
  }, [cardId, initialTitle, initialContent, initialMessage, initialSpeaker, activeCard?.version])

  // Handle version conflict by refreshing the card
  const handleVersionConflict = useCallback(async (error: VersionConflictError): Promise<boolean> => {
    setHasVersionConflict(true)
    showWarning('This card was modified in another tab. Refreshing to latest version...')

    try {
      // Fetch the latest version of the card
      const latestCard = await fetchCard(storyStackId, cardId)

      // Update local state with the latest values
      setTitle(latestCard.title)
      setContent(latestCard.content)
      setMessage(latestCard.message || '')
      setSpeaker(latestCard.speaker || '')

      // Update the version ref
      versionRef.current = latestCard.version

      // Update context with the refreshed card
      updateCardContext(cardId, latestCard)

      setHasVersionConflict(false)
      success('Card refreshed to latest version')

      // Return false to indicate we should not retry the save
      // (the user's local changes have been overwritten with server state)
      return false
    } catch (err) {
      showError('Failed to refresh card. Please reload the page.')
      return false
    }
  }, [storyStackId, cardId, updateCardContext, success, showError, showWarning])

  useEffect(() => {
    const fetchContext = async () => {
      setIsLoadingContext(true)
      try {
        const [predResponse, succResponse] = await Promise.all([
          fetch(`/api/stories/${storyStackId}/cards/${cardId}/predecessors`),
          fetch(`/api/stories/${storyStackId}/cards/${cardId}/successors`),
        ])
        if (predResponse.ok && succResponse.ok) {
          const p = await predResponse.json(); const s = await succResponse.json()
          setPredecessors(p.predecessors || []); setSuccessors(s.successors || [])
          setHasContext((p.predecessors?.length > 0) || (s.successors?.length > 0))
        }
      } catch (err) { console.error('Error fetching card context:', err) }
      finally { setIsLoadingContext(false) }
    }
    fetchContext()
  }, [cardId, storyStackId])


  const handleGenerateContent = useCallback(async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-card-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predecessors, successors, currentTitle: title, currentContent: content,
          currentMessage: message, currentSpeaker: speaker, existingChoices: [],
          characters: characters.map(c => ({ name: c.name, appearance: c.appearance })),
        }),
      })
      if (!response.ok) { const error = await response.json(); throw new Error(error.error || 'Failed to generate content') }
      const data = await response.json()
      setTitle(data.title); setContent(data.content)
      if (data.message) setMessage(data.message); if (data.speaker) setSpeaker(data.speaker)
      updateCardContext(cardId, { title: data.title, content: data.content, message: data.message || null, speaker: data.speaker || null })
      await updateCard(storyStackId, cardId, { title: data.title, content: data.content, message: data.message || null, speaker: data.speaker || null })
      success('Content generated successfully')
    } catch (err) { showError(err instanceof Error ? err.message : 'Failed to generate content') }
    finally { setIsGenerating(false) }
  }, [predecessors, successors, title, content, message, speaker, characters, cardId, storyStackId, updateCardContext, success, showError])

  const saveTitle = useCallback(async () => {
    if (title === initialTitle) return
    recordAction('UPDATE_CARD', { id: cardId, title, imageUrl: activeCard?.imageUrl })
    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { title, version: versionRef.current })
      versionRef.current = updated.version // Update version after successful save
      updateCardContext(cardId, updated)
    } catch (err) {
      if (err instanceof VersionConflictError) {
        await handleVersionConflict(err)
      } else {
        showError(err instanceof Error ? err.message : 'Failed to save title')
        setTitle(initialTitle)
      }
    } finally {
      setIsSaving(false)
    }
  }, [title, initialTitle, storyStackId, cardId, updateCardContext, showError, recordAction, activeCard, handleVersionConflict])

  const saveContent = useCallback(async () => {
    if (content === initialContent) return
    recordAction('UPDATE_CARD', { id: cardId, title: activeCard?.title || title, imageUrl: activeCard?.imageUrl })
    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { content, version: versionRef.current })
      versionRef.current = updated.version // Update version after successful save
      updateCardContext(cardId, updated)
    } catch (err) {
      if (err instanceof VersionConflictError) {
        await handleVersionConflict(err)
      } else {
        showError(err instanceof Error ? err.message : 'Failed to save content')
        setContent(initialContent)
      }
    } finally {
      setIsSaving(false)
    }
  }, [content, initialContent, storyStackId, cardId, updateCardContext, showError, recordAction, activeCard, title, handleVersionConflict])

  const saveMessage = useCallback(async () => {
    if (message === (initialMessage || '')) return
    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { message: message || null, version: versionRef.current })
      versionRef.current = updated.version // Update version after successful save
      updateCardContext(cardId, updated)
    } catch (err) {
      if (err instanceof VersionConflictError) {
        await handleVersionConflict(err)
      } else {
        showError(err instanceof Error ? err.message : 'Failed to save message')
        setMessage(initialMessage || '')
      }
    } finally {
      setIsSaving(false)
    }
  }, [message, initialMessage, storyStackId, cardId, updateCardContext, showError, handleVersionConflict])

  const saveSpeaker = useCallback(async () => {
    if (speaker === (initialSpeaker || '')) return
    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { speaker: speaker || null, version: versionRef.current })
      versionRef.current = updated.version // Update version after successful save
      updateCardContext(cardId, updated)
    } catch (err) {
      if (err instanceof VersionConflictError) {
        await handleVersionConflict(err)
      } else {
        showError(err instanceof Error ? err.message : 'Failed to save speaker')
        setSpeaker(initialSpeaker || '')
      }
    } finally {
      setIsSaving(false)
    }
  }, [speaker, initialSpeaker, storyStackId, cardId, updateCardContext, showError, handleVersionConflict])

  const { scheduleSave: scheduleTitleSave } = useAutoSave({ delay: 800, onSave: saveTitle, onSaveComplete, onVersionConflict: handleVersionConflict })
  const { scheduleSave: scheduleContentSave } = useAutoSave({ delay: 800, onSave: saveContent, onSaveComplete, onVersionConflict: handleVersionConflict })
  const { scheduleSave: scheduleMessageSave } = useAutoSave({ delay: 800, onSave: saveMessage, onSaveComplete, onVersionConflict: handleVersionConflict })
  const { scheduleSave: scheduleSpeakerSave } = useAutoSave({ delay: 800, onSave: saveSpeaker, onSaveComplete, onVersionConflict: handleVersionConflict })

  const handleTitleChange = useCallback((value: string) => { setTitle(value); updateCardContext(cardId, { title: value }); scheduleTitleSave() }, [cardId, updateCardContext, scheduleTitleSave])
  const handleContentChange = useCallback((value: string) => { setContent(value); updateCardContext(cardId, { content: value }); scheduleContentSave() }, [cardId, updateCardContext, scheduleContentSave])
  const handleMessageChange = useCallback((value: string) => { setMessage(value); updateCardContext(cardId, { message: value || null }); scheduleMessageSave() }, [cardId, updateCardContext, scheduleMessageSave])
  const handleSpeakerChange = useCallback((value: string) => { setSpeaker(value); updateCardContext(cardId, { speaker: value || null }); scheduleSpeakerSave() }, [cardId, updateCardContext, scheduleSpeakerSave])

  return {
    title, content, message, speaker, isSaving, isGenerating, hasContext, isLoadingContext, characters, hasVersionConflict,
    handleTitleChange, handleContentChange, handleMessageChange, handleSpeakerChange,
    saveTitle, saveContent, saveMessage, saveSpeaker, handleGenerateContent,
  }
}
