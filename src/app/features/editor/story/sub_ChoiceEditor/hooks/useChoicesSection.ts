'use client'

import { useState, useEffect, useCallback } from 'react'
import { Choice, StoryCard } from '@/lib/types'
import {
  fetchChoices,
  createChoice,
  updateChoice as updateChoiceApi,
  deleteChoice as deleteChoiceApi,
} from '../../sub_StoryCardEditor/lib/cardApi'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { useUndoRedoContext } from '@/app/features/editor/undo-redo'

interface PredecessorInfo {
  card: { id: string; title: string; content: string; orderIndex: number }
  choiceLabel: string
}

interface GeneratedChoice {
  label: string
  description: string
}

export interface UseChoicesSectionProps {
  cardId: string
  storyStackId: string
  availableCards: StoryCard[]
  currentCard?: StoryCard
}

export function useChoicesSection({
  cardId, storyStackId, availableCards, currentCard,
}: UseChoicesSectionProps) {
  const { addChoice, updateChoice: updateChoiceContext, deleteChoice: deleteChoiceContext } = useEditor()
  const { success, error: showError } = useToast()
  const { recordAction } = useUndoRedoContext()

  const [choices, setChoices] = useState<Choice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<Choice>>>(new Map())
  const [isGenerating, setIsGenerating] = useState(false)
  const [predecessors, setPredecessors] = useState<PredecessorInfo[]>([])
  const [hasPredecessors, setHasPredecessors] = useState(false)
  const [suggestedChoices, setSuggestedChoices] = useState<GeneratedChoice[]>([])


  useEffect(() => {
    const loadChoices = async () => {
      setIsLoading(true)
      try {
        const data = await fetchChoices(storyStackId, cardId)
        setChoices(data)
      } catch {
        showError('Failed to load choices')
      } finally {
        setIsLoading(false)
      }
    }
    loadChoices()
  }, [cardId, storyStackId, showError])

  useEffect(() => {
    const fetchPredecessorsData = async () => {
      try {
        const response = await fetch(`/api/stories/${storyStackId}/cards/${cardId}/predecessors`)
        if (response.ok) {
          const data = await response.json()
          setPredecessors(data.predecessors || [])
          setHasPredecessors(data.hasPredecessors || false)
        }
      } catch (err) {
        console.error('Error fetching predecessors:', err)
      }
    }
    fetchPredecessorsData()
  }, [cardId, storyStackId])

  const handleGenerateChoices = useCallback(async () => {
    if (!currentCard) return
    setIsGenerating(true)
    setSuggestedChoices([])
    try {
      const response = await fetch('/api/ai/generate-choices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCard: { id: currentCard.id, title: currentCard.title, content: currentCard.content },
          predecessors,
          existingChoices: choices.map(c => c.label),
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate choices')
      }
      const data = await response.json()
      setSuggestedChoices(data.choices || [])
      success('Generated choice suggestions')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate choices')
    } finally {
      setIsGenerating(false)
    }
  }, [currentCard, predecessors, choices, success, showError])


  const handleApplySuggestion = useCallback(async (suggestion: GeneratedChoice) => {
    const defaultTarget = availableCards.find(c => c.id !== cardId)
    if (!defaultTarget) {
      showError('Create more cards to add this choice')
      return
    }
    setIsSaving(true)
    try {
      const newChoice = await createChoice(storyStackId, cardId, {
        label: suggestion.label, targetCardId: defaultTarget.id, orderIndex: choices.length,
      })
      setChoices(prev => [...prev, newChoice])
      addChoice(newChoice)
      setSuggestedChoices(prev => prev.filter(s => s.label !== suggestion.label))
      success('Choice added')
    } catch {
      showError('Failed to add choice')
    } finally {
      setIsSaving(false)
    }
  }, [availableCards, cardId, storyStackId, choices.length, addChoice, success, showError])

  const handleAddChoice = useCallback(async () => {
    const defaultTarget = availableCards.find(c => c.id !== cardId)
    if (!defaultTarget) {
      showError('Create more cards before adding choices')
      return
    }
    recordAction('ADD_CHOICE', currentCard ? { id: currentCard.id, title: currentCard.title, imageUrl: currentCard.imageUrl } : undefined)
    setIsSaving(true)
    try {
      const newChoice = await createChoice(storyStackId, cardId, {
        label: 'New choice', targetCardId: defaultTarget.id, orderIndex: choices.length,
      })
      setChoices(prev => [...prev, newChoice])
      addChoice(newChoice)
      setEditingChoiceId(newChoice.id)
      success('Choice added')
    } catch {
      showError('Failed to add choice')
    } finally {
      setIsSaving(false)
    }
  }, [availableCards, cardId, storyStackId, choices.length, currentCard, recordAction, addChoice, success, showError])

  const saveChoiceLabel = useCallback(async (choiceId: string, label: string) => {
    const choice = choices.find(c => c.id === choiceId)
    if (!choice || choice.label === label) return
    setIsSaving(true)
    try {
      const updated = await updateChoiceApi(storyStackId, cardId, choiceId, { label })
      setChoices(prev => prev.map(c => c.id === choiceId ? updated : c))
      updateChoiceContext(choiceId, updated)
    } catch {
      showError('Failed to update choice')
    } finally {
      setIsSaving(false)
    }
  }, [choices, storyStackId, cardId, updateChoiceContext, showError])


  const handleLabelChange = useCallback((choiceId: string, label: string) => {
    setChoices(prev => prev.map(c => c.id === choiceId ? { ...c, label } : c))
    updateChoiceContext(choiceId, { label })
    setPendingUpdates(prev => {
      const updated = new Map(prev)
      updated.set(choiceId, { ...updated.get(choiceId), label })
      return updated
    })
  }, [updateChoiceContext])

  const handleLabelBlur = useCallback((choiceId: string) => {
    const pending = pendingUpdates.get(choiceId)
    if (pending?.label) {
      saveChoiceLabel(choiceId, pending.label)
      setPendingUpdates(prev => {
        const updated = new Map(prev)
        updated.delete(choiceId)
        return updated
      })
    }
    setEditingChoiceId(null)
  }, [pendingUpdates, saveChoiceLabel])

  const handleTargetChange = useCallback(async (choiceId: string, targetCardId: string) => {
    setIsSaving(true)
    try {
      const updated = await updateChoiceApi(storyStackId, cardId, choiceId, { targetCardId })
      setChoices(prev => prev.map(c => c.id === choiceId ? updated : c))
      updateChoiceContext(choiceId, updated)
    } catch {
      showError('Failed to update choice target')
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId, updateChoiceContext, showError])

  const handleDeleteChoice = useCallback(async (choiceId: string) => {
    if (!confirm('Delete this choice?')) return
    recordAction('DELETE_CHOICE', currentCard ? { id: currentCard.id, title: currentCard.title, imageUrl: currentCard.imageUrl } : undefined)
    setIsSaving(true)
    try {
      await deleteChoiceApi(storyStackId, cardId, choiceId)
      setChoices(prev => prev.filter(c => c.id !== choiceId))
      deleteChoiceContext(choiceId)
      success('Choice deleted')
    } catch {
      showError('Failed to delete choice')
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId, currentCard, recordAction, deleteChoiceContext, success, showError])

  const getTargetCardTitle = useCallback((targetCardId: string) => {
    const card = availableCards.find(c => c.id === targetCardId)
    return card?.title || 'Untitled Card'
  }, [availableCards])

  const isTargetValid = useCallback((targetCardId: string) => {
    return availableCards.some(c => c.id === targetCardId)
  }, [availableCards])

  const otherCards = availableCards.filter(c => c.id !== cardId)
  const canAddChoices = otherCards.length > 0

  return {
    choices, isLoading, isSaving, editingChoiceId, isGenerating, hasPredecessors,
    suggestedChoices, otherCards, canAddChoices, handleGenerateChoices, handleApplySuggestion,
    handleAddChoice, handleLabelChange, handleLabelBlur, handleTargetChange, handleDeleteChoice,
    getTargetCardTitle, isTargetValid, setEditingChoiceId,
  }
}
