'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, GripVertical, AlertCircle, ArrowRight, Target, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Choice, StoryCard } from '@/lib/types'
import { useAutoSave } from '../lib/useAutoSave'
import {
  fetchChoices,
  createChoice,
  updateChoice as updateChoiceApi,
  deleteChoice as deleteChoiceApi,
} from '../lib/cardApi'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { cn } from '@/lib/utils'

interface CardContext {
  id: string
  title: string
  content: string
  orderIndex: number
}

interface PredecessorInfo {
  card: CardContext
  choiceLabel: string
}

interface GeneratedChoice {
  label: string
  description: string
}

interface ChoicesSectionProps {
  cardId: string
  storyStackId: string
  availableCards: StoryCard[]
  currentCard?: StoryCard
}

export function ChoicesSection({
  cardId,
  storyStackId,
  availableCards,
  currentCard,
}: ChoicesSectionProps) {
  const { addChoice, updateChoice: updateChoiceContext, deleteChoice: deleteChoiceContext } = useEditor()
  const { success, error: showError } = useToast()

  const [choices, setChoices] = useState<Choice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingChoiceId, setEditingChoiceId] = useState<string | null>(null)
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<Choice>>>(new Map())
  
  // LLM generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [predecessors, setPredecessors] = useState<PredecessorInfo[]>([])
  const [hasPredecessors, setHasPredecessors] = useState(false)
  const [suggestedChoices, setSuggestedChoices] = useState<GeneratedChoice[]>([])

  // Fetch choices when card changes
  useEffect(() => {
    const loadChoices = async () => {
      setIsLoading(true)
      try {
        const data = await fetchChoices(storyStackId, cardId)
        setChoices(data)
      } catch (err) {
        showError('Failed to load choices')
      } finally {
        setIsLoading(false)
      }
    }
    loadChoices()
  }, [cardId, storyStackId, showError])

  // Fetch predecessors to determine if LLM button should show
  useEffect(() => {
    const fetchPredecessors = async () => {
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
    fetchPredecessors()
  }, [cardId, storyStackId])

  const handleGenerateChoices = async () => {
    if (!currentCard) return
    
    setIsGenerating(true)
    setSuggestedChoices([])
    
    try {
      const response = await fetch('/api/ai/generate-choices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCard: {
            id: currentCard.id,
            title: currentCard.title,
            content: currentCard.content,
          },
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
  }

  const handleApplySuggestion = async (suggestion: GeneratedChoice) => {
    const defaultTarget = availableCards.find(c => c.id !== cardId)
    if (!defaultTarget) {
      showError('Create more cards to add this choice')
      return
    }

    setIsSaving(true)
    try {
      const newChoice = await createChoice(storyStackId, cardId, {
        label: suggestion.label,
        targetCardId: defaultTarget.id,
        orderIndex: choices.length,
      })
      setChoices(prev => [...prev, newChoice])
      addChoice(newChoice)
      
      // Remove from suggestions
      setSuggestedChoices(prev => prev.filter(s => s.label !== suggestion.label))
      success('Choice added')
    } catch (err) {
      showError('Failed to add choice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddChoice = async () => {
    const defaultTarget = availableCards.find(c => c.id !== cardId)
    if (!defaultTarget) {
      showError('Create more cards before adding choices')
      return
    }

    setIsSaving(true)
    try {
      const newChoice = await createChoice(storyStackId, cardId, {
        label: 'New choice',
        targetCardId: defaultTarget.id,
        orderIndex: choices.length,
      })
      setChoices(prev => [...prev, newChoice])
      addChoice(newChoice)
      setEditingChoiceId(newChoice.id)
      success('Choice added')
    } catch (err) {
      showError('Failed to add choice')
    } finally {
      setIsSaving(false)
    }
  }

  const saveChoiceLabel = useCallback(async (choiceId: string, label: string) => {
    const choice = choices.find(c => c.id === choiceId)
    if (!choice || choice.label === label) return

    setIsSaving(true)
    try {
      const updated = await updateChoiceApi(storyStackId, cardId, choiceId, { label })
      setChoices(prev => prev.map(c => c.id === choiceId ? updated : c))
      updateChoiceContext(choiceId, updated)
    } catch (err) {
      showError('Failed to update choice')
    } finally {
      setIsSaving(false)
    }
  }, [choices, storyStackId, cardId, updateChoiceContext, showError])

  const handleLabelChange = (choiceId: string, label: string) => {
    // Update local state immediately
    setChoices(prev => prev.map(c => c.id === choiceId ? { ...c, label } : c))
    // Update context for graph
    updateChoiceContext(choiceId, { label })
    // Track pending update
    setPendingUpdates(prev => {
      const updated = new Map(prev)
      updated.set(choiceId, { ...updated.get(choiceId), label })
      return updated
    })
  }

  const handleTargetChange = async (choiceId: string, targetCardId: string) => {
    setIsSaving(true)
    try {
      const updated = await updateChoiceApi(storyStackId, cardId, choiceId, { targetCardId })
      setChoices(prev => prev.map(c => c.id === choiceId ? updated : c))
      updateChoiceContext(choiceId, updated)
    } catch (err) {
      showError('Failed to update choice target')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteChoice = async (choiceId: string) => {
    if (!confirm('Delete this choice?')) return

    setIsSaving(true)
    try {
      await deleteChoiceApi(storyStackId, cardId, choiceId)
      setChoices(prev => prev.filter(c => c.id !== choiceId))
      deleteChoiceContext(choiceId)
      success('Choice deleted')
    } catch (err) {
      showError('Failed to delete choice')
    } finally {
      setIsSaving(false)
    }
  }

  const getTargetCardTitle = (targetCardId: string) => {
    const card = availableCards.find(c => c.id === targetCardId)
    return card?.title || 'Untitled Card'
  }

  const isTargetValid = (targetCardId: string) => {
    return availableCards.some(c => c.id === targetCardId)
  }

  const otherCards = availableCards.filter(c => c.id !== cardId)
  const canAddChoices = otherCards.length > 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading choices...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Story Choices</Label>
          <span className="text-xs text-muted-foreground">
            ({choices.length} {choices.length === 1 ? 'choice' : 'choices'})
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasPredecessors && currentCard && (
            <Button
              onClick={handleGenerateChoices}
              disabled={isSaving || isGenerating}
              size="sm"
              variant="outline"
              className="border-2 border-primary/50 hover:border-primary hover:bg-primary/10"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Suggest Choices
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleAddChoice}
            disabled={isSaving || !canAddChoices}
            size="sm"
            className="border-2 border-border bg-primary text-primary-foreground
                       shadow-[2px_2px_0px_0px_hsl(var(--border))]
                       hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                       hover:-translate-x-px hover:-translate-y-px transition-all"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Choice
          </Button>
        </div>
      </div>

      {/* Suggested Choices from AI */}
      {suggestedChoices.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">AI Suggestions (click to add):</Label>
          <div className="grid gap-2">
            {suggestedChoices.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleApplySuggestion(suggestion)}
                disabled={isSaving || !canAddChoices}
                className={cn(
                  "text-left p-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5",
                  "hover:border-primary hover:bg-primary/10 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-medium text-sm">{suggestion.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-5.5">
                  {suggestion.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Choices List */}
      {choices.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-border rounded-lg bg-muted/30">
          <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No choices yet</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Add choices to let players navigate between cards and shape their story
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {choices.map((choice, index) => {
            const isValid = isTargetValid(choice.targetCardId)
            const isEditing = editingChoiceId === choice.id

            return (
              <div
                key={choice.id}
                className={cn(
                  'border-2 rounded-lg p-4 bg-card transition-all duration-200',
                  isEditing
                    ? 'border-primary shadow-[4px_4px_0px_0px_hsl(var(--primary)/0.3)]'
                    : 'border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  <button
                    className="mt-2.5 cursor-move text-muted-foreground hover:text-foreground
                               opacity-50 hover:opacity-100 transition-opacity"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  {/* Choice Content */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Label Input */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">
                        Choice Label
                      </Label>
                      <Input
                        value={choice.label}
                        onChange={(e) => handleLabelChange(choice.id, e.target.value)}
                        onBlur={() => {
                          const pending = pendingUpdates.get(choice.id)
                          if (pending?.label) {
                            saveChoiceLabel(choice.id, pending.label)
                            setPendingUpdates(prev => {
                              const updated = new Map(prev)
                              updated.delete(choice.id)
                              return updated
                            })
                          }
                          setEditingChoiceId(null)
                        }}
                        onFocus={() => setEditingChoiceId(choice.id)}
                        placeholder="e.g., Go north, Fight the dragon, Open the door..."
                        className="border-2 border-border focus:border-primary
                                   shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]"
                        disabled={isSaving}
                      />
                    </div>

                    {/* Target Card Select */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3" />
                        Target Card
                      </Label>
                      <Select
                        value={choice.targetCardId}
                        onValueChange={(value) => handleTargetChange(choice.id, value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="border-2 border-border">
                          <SelectValue>
                            {getTargetCardTitle(choice.targetCardId)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {otherCards.map(card => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.title || 'Untitled Card'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {!isValid && (
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive">
                          <AlertCircle className="w-3 h-3" />
                          <span>Target card no longer exists</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    onClick={() => handleDeleteChoice(choice.id)}
                    disabled={isSaving}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Helper Warning */}
      {!canAddChoices && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Create more cards to add choices. Choices allow players to navigate between cards in your story.
          </p>
        </div>
      )}
    </div>
  )
}
