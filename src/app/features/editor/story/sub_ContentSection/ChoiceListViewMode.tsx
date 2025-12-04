'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { ArrowRight, Pencil, Check, X, Trash2, Plus, Loader2, Target, GripVertical } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Choice, StoryCard } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ChoiceListViewModeProps {
  choices: Choice[]
  otherCards: StoryCard[]
  isSaving: boolean
  canAddChoices: boolean
  onAddChoice: () => void
  onLabelChange: (choiceId: string, label: string) => void
  onLabelBlur: (choiceId: string) => void
  onTargetChange: (choiceId: string, targetCardId: string) => void
  onDelete: (choiceId: string) => void
  getTargetCardTitle: (targetCardId: string) => string
  isTargetValid: (targetCardId: string) => boolean
}

interface ChoiceItemViewModeProps {
  choice: Choice
  otherCards: StoryCard[]
  isSaving: boolean
  onLabelChange: (choiceId: string, label: string) => void
  onLabelBlur: (choiceId: string) => void
  onTargetChange: (choiceId: string, targetCardId: string) => void
  onDelete: (choiceId: string) => void
  getTargetCardTitle: (targetCardId: string) => string
  isTargetValid: (targetCardId: string) => boolean
}

/**
 * Single choice item with view/edit modes
 */
function ChoiceItemViewMode({
  choice,
  otherCards,
  isSaving,
  onLabelChange,
  onLabelBlur,
  onTargetChange,
  onDelete,
  getTargetCardTitle,
  isTargetValid,
}: ChoiceItemViewModeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [editLabel, setEditLabel] = useState(choice.label)
  const inputRef = useRef<HTMLInputElement>(null)

  const isValid = isTargetValid(choice.targetCardId)
  const targetTitle = getTargetCardTitle(choice.targetCardId)

  // Sync edit value
  useEffect(() => {
    if (!isEditing) {
      setEditLabel(choice.label)
    }
  }, [choice.label, isEditing])

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = useCallback(() => {
    if (isSaving) return
    setEditLabel(choice.label)
    setIsEditing(true)
  }, [isSaving, choice.label])

  const handleSave = useCallback(() => {
    const trimmed = editLabel.trim()
    if (trimmed && trimmed !== choice.label) {
      onLabelChange(choice.id, trimmed)
      onLabelBlur(choice.id)
    }
    setIsEditing(false)
  }, [editLabel, choice.id, choice.label, onLabelChange, onLabelBlur])

  const handleCancel = useCallback(() => {
    setEditLabel(choice.label)
    setIsEditing(false)
  }, [choice.label])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }, [handleSave, handleCancel])

  const handleDelete = useCallback(() => {
    // Immediate deletion without confirmation
    onDelete(choice.id)
  }, [choice.id, onDelete])

  // Edit Mode
  if (isEditing) {
    return (
      <div
        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border-2 border-primary"
        data-testid={`choice-item-edit-${choice.id}`}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground/50 shrink-0" />

        <div className="flex-1 flex items-center gap-2">
          {/* Label input */}
          <Input
            ref={inputRef}
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            placeholder="Choice label..."
            className="flex-1 h-8 text-sm border-border"
          />

          {/* Target select */}
          <Select
            value={choice.targetCardId}
            onValueChange={(value) => onTargetChange(choice.id, value)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {otherCards.map(card => (
                <SelectItem key={card.id} value={card.id} className="text-xs">
                  {card.title || 'Untitled'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 rounded text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
            aria-label="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // View Mode
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors',
        'hover:bg-muted/50 cursor-pointer',
        !isValid && 'bg-destructive/5'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleEdit}
      data-testid={`choice-item-${choice.id}`}
    >
      {/* Drag handle */}
      <GripVertical className={cn(
        'w-4 h-4 text-muted-foreground/30 shrink-0 transition-opacity',
        isHovered ? 'opacity-100' : 'opacity-0'
      )} />

      {/* Arrow bullet */}
      <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />

      {/* Label */}
      <span className="flex-1 text-sm text-foreground truncate">
        {choice.label || 'Untitled choice'}
      </span>

      {/* Target indicator */}
      <span className={cn(
        'text-xs px-2 py-0.5 rounded-full shrink-0',
        isValid
          ? 'text-muted-foreground bg-muted/50'
          : 'text-destructive bg-destructive/10'
      )}>
        → {targetTitle}
      </span>

      {/* Actions on hover */}
      <div className={cn(
        'flex items-center gap-0.5 shrink-0 transition-opacity',
        isHovered ? 'opacity-100' : 'opacity-0'
      )}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleEdit()
          }}
          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          disabled={isSaving}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

/**
 * ChoiceListViewMode - View-first choice list
 *
 * Shows choices in a compact list format:
 * → Choice label                    → Target Card
 *
 * Click on a choice to edit it inline.
 * Empty state shows a subtle "Add choice" prompt.
 */
export function ChoiceListViewMode({
  choices,
  otherCards,
  isSaving,
  canAddChoices,
  onAddChoice,
  onLabelChange,
  onLabelBlur,
  onTargetChange,
  onDelete,
  getTargetCardTitle,
  isTargetValid,
}: ChoiceListViewModeProps) {
  // Empty state
  if (choices.length === 0) {
    return (
      <div className="space-y-3" data-testid="choice-list-empty">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Choices</span>
          </div>
        </div>

        {/* Empty prompt */}
        <button
          type="button"
          onClick={onAddChoice}
          disabled={isSaving || !canAddChoices}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-6 rounded-md',
            'border-2 border-dashed border-border text-muted-foreground/60',
            'hover:border-primary/50 hover:text-muted-foreground hover:bg-muted/30',
            'transition-colors',
            (!canAddChoices || isSaving) && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Add player choice</span>
        </button>

        {!canAddChoices && (
          <p className="text-xs text-muted-foreground text-center">
            Create more cards to add choices
          </p>
        )}
      </div>
    )
  }

  // List with choices
  return (
    <div className="space-y-2" data-testid="choice-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Choices</span>
          <span className="text-xs text-muted-foreground">
            ({choices.length})
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onAddChoice}
          disabled={isSaving || !canAddChoices}
          className="h-7 px-2 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </div>

      {/* Choice list */}
      <div className="space-y-1 rounded-md border border-border/50 p-1 bg-muted/20">
        {choices.map((choice) => (
          <ChoiceItemViewMode
            key={choice.id}
            choice={choice}
            otherCards={otherCards}
            isSaving={isSaving}
            onLabelChange={onLabelChange}
            onLabelBlur={onLabelBlur}
            onTargetChange={onTargetChange}
            onDelete={onDelete}
            getTargetCardTitle={getTargetCardTitle}
            isTargetValid={isTargetValid}
          />
        ))}
      </div>
    </div>
  )
}
