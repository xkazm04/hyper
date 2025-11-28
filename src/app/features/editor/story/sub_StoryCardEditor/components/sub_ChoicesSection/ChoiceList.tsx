'use client'

import { Target } from 'lucide-react'
import { Choice, StoryCard } from '@/lib/types'
import { ChoiceItem } from './ChoiceItem'

interface ChoiceListProps {
  choices: Choice[]
  editingChoiceId: string | null
  isSaving: boolean
  otherCards: StoryCard[]
  onLabelChange: (choiceId: string, label: string) => void
  onLabelBlur: (choiceId: string) => void
  onFocus: (choiceId: string) => void
  onTargetChange: (choiceId: string, targetCardId: string) => void
  onDelete: (choiceId: string) => void
  getTargetCardTitle: (targetCardId: string) => string
  isTargetValid: (targetCardId: string) => boolean
}

export function ChoiceList({
  choices,
  editingChoiceId,
  isSaving,
  otherCards,
  onLabelChange,
  onLabelBlur,
  onFocus,
  onTargetChange,
  onDelete,
  getTargetCardTitle,
  isTargetValid,
}: ChoiceListProps) {
  if (choices.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-border rounded-lg bg-muted/30">
        <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">No choices yet</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Add choices to let players navigate between cards and shape their story
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {choices.map((choice) => (
        <ChoiceItem
          key={choice.id}
          choice={choice}
          isEditing={editingChoiceId === choice.id}
          isSaving={isSaving}
          otherCards={otherCards}
          onLabelChange={onLabelChange}
          onLabelBlur={onLabelBlur}
          onFocus={onFocus}
          onTargetChange={onTargetChange}
          onDelete={onDelete}
          getTargetCardTitle={getTargetCardTitle}
          isTargetValid={isTargetValid}
        />
      ))}
    </div>
  )
}
