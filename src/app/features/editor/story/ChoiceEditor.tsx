'use client'

/**
 * ChoiceEditor Component
 * 
 * Manages choices for a story card, allowing creators to:
 * - Add new choices with labels and target cards
 * - Edit choice labels and target cards
 * - Delete choices
 * - Reorder choices (drag to reorder)
 * - Validate that target cards exist
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { useState, useEffect } from 'react'
import { Choice, StoryCard } from '@/lib/types'
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
import { Plus, Trash2, GripVertical, AlertCircle } from 'lucide-react'
import { useToast } from '@/lib/context/ToastContext'

interface ChoiceEditorProps {
  storyStackId: string
  currentCardId: string
  availableCards: StoryCard[]
}

export default function ChoiceEditor({
  storyStackId,
  currentCardId,
  availableCards,
}: ChoiceEditorProps) {
  const [choices, setChoices] = useState<Choice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingChoice, setEditingChoice] = useState<string | null>(null)
  const { success, error: showError } = useToast()

  // Fetch choices for the current card
  useEffect(() => {
    fetchChoices()
  }, [currentCardId])

  const fetchChoices = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch choices')
      }

      const data = await response.json()
      setChoices(data.choices || [])
    } catch (error) {
      console.error('Error fetching choices:', error)
      showError('Failed to load choices')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddChoice = async () => {
    // Find the first available target card (not the current card)
    const defaultTargetCard = availableCards.find(card => card.id !== currentCardId)
    
    if (!defaultTargetCard) {
      showError('Create more cards before adding choices')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: 'New choice',
            targetCardId: defaultTargetCard.id,
            orderIndex: choices.length,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to create choice')
      }

      const data = await response.json()
      setChoices([...choices, data.choice])
      setEditingChoice(data.choice.id)
      
      success('Choice added')
    } catch (error) {
      console.error('Error creating choice:', error)
      showError('Failed to add choice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateChoice = async (
    choiceId: string,
    updates: { label?: string; targetCardId?: string }
  ) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices/${choiceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update choice')
      }

      const data = await response.json()
      setChoices(choices.map(c => (c.id === choiceId ? data.choice : c)))
    } catch (error) {
      console.error('Error updating choice:', error)
      showError('Failed to update choice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteChoice = async (choiceId: string) => {
    if (!confirm('Are you sure you want to delete this choice?')) {
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices/${choiceId}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete choice')
      }

      setChoices(choices.filter(c => c.id !== choiceId))
      
      success('Choice deleted')
    } catch (error) {
      console.error('Error deleting choice:', error)
      showError('Failed to delete choice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReorder = async (choiceId: string, newIndex: number) => {
    const oldIndex = choices.findIndex(c => c.id === choiceId)
    if (oldIndex === -1 || oldIndex === newIndex) return

    // Optimistically update UI
    const reordered = [...choices]
    const [moved] = reordered.splice(oldIndex, 1)
    reordered.splice(newIndex, 0, moved)
    setChoices(reordered)

    // Update order indices in the backend
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices/${choiceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: newIndex }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to reorder choice')
      }

      const data = await response.json()
      setChoices(choices.map(c => (c.id === choiceId ? data.choice : c)))
    } catch (error) {
      console.error('Error reordering choice:', error)
      // Revert on error
      fetchChoices()
    } finally {
      setIsSaving(false)
    }
  }

  const getTargetCardTitle = (targetCardId: string) => {
    const card = availableCards.find(c => c.id === targetCardId)
    return card?.title || 'Unknown Card'
  }

  const validateTargetCard = (targetCardId: string) => {
    return availableCards.some(c => c.id === targetCardId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Choices</Label>
        </div>
        <p className="text-sm text-muted-foreground">Loading choices...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs sm:text-sm font-semibold">Choices</Label>
        <Button
          onClick={handleAddChoice}
          disabled={isSaving || availableCards.length <= 1}
          size="sm"
          variant="outline"
          className="touch-manipulation"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">Add Choice</span>
        </Button>
      </div>

      {choices.length === 0 ? (
        <div className="text-center py-6 sm:py-8 border-2 border-dashed border-border rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">No choices yet</p>
          <p className="text-xs text-muted-foreground/70">
            Add choices to let players navigate to other cards
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {choices.map((choice, index) => {
            const isValid = validateTargetCard(choice.targetCardId)
            const isEditing = editingChoice === choice.id

            return (
              <div
                key={choice.id}
                className="border border-border rounded-lg p-2.5 sm:p-3 bg-card hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <button
                    className="mt-2 cursor-move text-muted-foreground hover:text-foreground touch-manipulation hidden sm:block"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">
                        Choice Label
                      </Label>
                      <Input
                        value={choice.label}
                        onChange={(e) => {
                          const newLabel = e.target.value
                          setChoices(
                            choices.map(c =>
                              c.id === choice.id ? { ...c, label: newLabel } : c
                            )
                          )
                        }}
                        onBlur={(e) => {
                          const newLabel = e.target.value.trim()
                          if (newLabel && newLabel !== choice.label) {
                            handleUpdateChoice(choice.id, { label: newLabel })
                          }
                        }}
                        onFocus={() => setEditingChoice(choice.id)}
                        placeholder="e.g., Go north, Fight the dragon"
                        className="text-xs sm:text-sm"
                        disabled={isSaving}
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground mb-1">
                        Target Card
                      </Label>
                      <Select
                        value={choice.targetCardId}
                        onValueChange={(value) => {
                          handleUpdateChoice(choice.id, { targetCardId: value })
                        }}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCards
                            .filter(card => card.id !== currentCardId)
                            .map(card => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.title || 'Untitled Card'}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      
                      {!isValid && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>Target card no longer exists</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => handleDeleteChoice(choice.id)}
                    disabled={isSaving}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {availableCards.length <= 1 && (
        <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Create more cards to add choices. Choices allow players to navigate between cards.
          </p>
        </div>
      )}
    </div>
  )
}
