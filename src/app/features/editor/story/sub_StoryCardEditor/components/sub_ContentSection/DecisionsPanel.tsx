'use client'

import { useState, useCallback, useMemo } from 'react'
import { Plus, Trash2, ArrowRight, Link2, Loader2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/EditorContext'
import { createChoice, updateChoice, deleteChoice } from '../../lib/cardApi'
import type { StoryCard, Choice } from '@/lib/types'

interface DecisionsPanelProps {
  cardId: string
  storyStackId: string
  disabled?: boolean
}

/**
 * DecisionsPanel - Manage up to 4 player decisions/choices for a card
 *
 * Features:
 * - Add/edit/delete choices (max 4)
 * - Connect choices to target cards
 * - Reorder choices with drag/orderIndex
 * - Visual 2x2 grid preview matching CardPreview
 */
export function DecisionsPanel({
  cardId,
  storyStackId,
  disabled = false,
}: DecisionsPanelProps) {
  const { choices, storyCards, addChoice: addChoiceContext, updateChoice: updateChoiceContext } = useEditor()
  const [isAdding, setIsAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newTargetId, setNewTargetId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Filter choices for the current card
  const cardChoices = useMemo(() =>
    choices
      .filter(c => c.storyCardId === cardId)
      .sort((a, b) => a.orderIndex - b.orderIndex),
    [choices, cardId]
  )

  // Get available target cards (exclude current card)
  const availableTargets = useMemo(() =>
    storyCards.filter(card => card.id !== cardId),
    [storyCards, cardId]
  )

  const canAddMore = cardChoices.length < 4

  /**
   * Add a new choice
   */
  const handleAddChoice = useCallback(async () => {
    if (!newLabel.trim() || !newTargetId || !canAddMore) return

    setIsSaving(true)
    try {
      const newChoice = await createChoice(storyStackId, cardId, {
        label: newLabel.trim(),
        targetCardId: newTargetId,
        orderIndex: cardChoices.length,
      })
      addChoiceContext(newChoice)
      setNewLabel('')
      setNewTargetId('')
      setIsAdding(false)
    } catch (err) {
      console.error('Failed to add choice:', err)
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId, newLabel, newTargetId, cardChoices.length, canAddMore, addChoiceContext])

  /**
   * Update an existing choice
   */
  const handleUpdateChoice = useCallback(async (choiceId: string, updates: { label?: string; targetCardId?: string }) => {
    setIsSaving(true)
    try {
      const updated = await updateChoice(storyStackId, cardId, choiceId, updates)
      updateChoiceContext(choiceId, updated)
      setEditingId(null)
    } catch (err) {
      console.error('Failed to update choice:', err)
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId, updateChoiceContext])

  /**
   * Delete a choice
   */
  const handleDeleteChoice = useCallback(async (choiceId: string) => {
    setIsSaving(true)
    try {
      await deleteChoice(storyStackId, cardId, choiceId)
      // Update context (filter out deleted choice)
      // Note: EditorContext should handle this, but we may need to force refresh
      window.location.reload() // Temporary - should be handled by context
    } catch (err) {
      console.error('Failed to delete choice:', err)
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId])

  /**
   * Get target card name for display
   */
  const getTargetName = (targetCardId: string) => {
    const card = storyCards.find(c => c.id === targetCardId)
    return card?.title || 'Unknown Card'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Link2 className="w-4 h-4" />
          Decisions
          <span className="text-xs font-normal text-muted-foreground">
            ({cardChoices.length}/4)
          </span>
        </Label>
        {canAddMore && !isAdding && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdding(true)}
            disabled={disabled || isSaving}
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Decision
          </Button>
        )}
      </div>

      {/* Existing Choices */}
      {cardChoices.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {cardChoices.map((choice, index) => (
            <ChoiceItem
              key={choice.id}
              choice={choice}
              index={index}
              isEditing={editingId === choice.id}
              availableTargets={availableTargets}
              disabled={disabled || isSaving}
              onEdit={() => setEditingId(choice.id)}
              onCancelEdit={() => setEditingId(null)}
              onUpdate={(updates) => handleUpdateChoice(choice.id, updates)}
              onDelete={() => handleDeleteChoice(choice.id)}
              getTargetName={getTargetName}
            />
          ))}
        </div>
      ) : !isAdding && (
        <div className="text-center py-4 bg-muted/30 rounded-lg border-2 border-dashed border-border">
          <Link2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">
            No decisions yet. Add up to 4 choices for players.
          </p>
        </div>
      )}

      {/* Add New Choice Form */}
      {isAdding && (
        <div className="p-3 bg-muted/30 rounded-lg border-2 border-primary/30 space-y-3">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Decision Label</Label>
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g., Go north, Fight the dragon..."
              className="h-8 text-sm"
              disabled={isSaving}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Links to Card</Label>
            <select
              value={newTargetId}
              onChange={(e) => setNewTargetId(e.target.value)}
              className={cn(
                "w-full h-8 text-sm rounded-md border border-input bg-background px-3",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
              disabled={isSaving}
            >
              <option value="">Select a card...</option>
              {availableTargets.map(card => (
                <option key={card.id} value={card.id}>
                  {card.title || 'Untitled Card'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddChoice}
              disabled={!newLabel.trim() || !newTargetId || isSaving}
              className="flex-1 h-8"
            >
              {isSaving ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <Plus className="w-3 h-3 mr-1" />
              )}
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                setNewLabel('')
                setNewTargetId('')
              }}
              disabled={isSaving}
              className="h-8"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        Decisions connect to other cards and appear as choices for players
      </p>
    </div>
  )
}

// === Sub-component for individual choice items ===

interface ChoiceItemProps {
  choice: Choice
  index: number
  isEditing: boolean
  availableTargets: StoryCard[]
  disabled: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onUpdate: (updates: { label?: string; targetCardId?: string }) => void
  onDelete: () => void
  getTargetName: (targetCardId: string) => string
}

function ChoiceItem({
  choice,
  index,
  isEditing,
  availableTargets,
  disabled,
  onEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  getTargetName,
}: ChoiceItemProps) {
  const [editLabel, setEditLabel] = useState(choice.label)
  const [editTargetId, setEditTargetId] = useState(choice.targetCardId)

  const handleSave = () => {
    const updates: { label?: string; targetCardId?: string } = {}
    if (editLabel !== choice.label) updates.label = editLabel
    if (editTargetId !== choice.targetCardId) updates.targetCardId = editTargetId

    if (Object.keys(updates).length > 0) {
      onUpdate(updates)
    } else {
      onCancelEdit()
    }
  }

  if (isEditing) {
    return (
      <div className="p-2 bg-muted/50 rounded-lg border-2 border-primary/50 space-y-2">
        <Input
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          className="h-7 text-xs"
          disabled={disabled}
          autoFocus
        />
        <select
          value={editTargetId}
          onChange={(e) => setEditTargetId(e.target.value)}
          className={cn(
            "w-full h-7 text-xs rounded-md border border-input bg-background px-2",
            "focus:outline-none focus:ring-1 focus:ring-ring"
          )}
          disabled={disabled}
        >
          {availableTargets.map(card => (
            <option key={card.id} value={card.id}>
              {card.title || 'Untitled Card'}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          <Button size="sm" onClick={handleSave} disabled={disabled} className="flex-1 h-6 text-[10px]">
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancelEdit} disabled={disabled} className="h-6 text-[10px]">
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="p-2 bg-muted/30 rounded-lg border-2 border-border hover:border-primary/30 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">
            {choice.label}
          </p>
          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
            <ArrowRight className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate">{getTargetName(choice.targetCardId)}</span>
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          disabled={disabled}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
          title="Delete decision"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
