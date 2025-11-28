'use client'

/**
 * ChoiceTargets Component
 * 
 * Handles target card selection for a choice.
 * Displays available cards and validates target existence.
 */

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle } from 'lucide-react'
import { Choice, StoryCard } from '@/lib/types'

interface ChoiceTargetsProps {
  choice: Choice
  availableCards: StoryCard[]
  currentCardId: string
  isSaving: boolean
  isValid: boolean
  onTargetChange: (choiceId: string, targetCardId: string) => void
}

export function ChoiceTargets({
  choice,
  availableCards,
  currentCardId,
  isSaving,
  isValid,
  onTargetChange,
}: ChoiceTargetsProps) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1">
        Target Card
      </Label>
      <Select
        value={choice.targetCardId}
        onValueChange={(value) => onTargetChange(choice.id, value)}
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
  )
}
