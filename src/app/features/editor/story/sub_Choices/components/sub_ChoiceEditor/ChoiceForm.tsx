'use client'

/**
 * ChoiceForm Component
 * 
 * Renders the form inputs for editing a single choice's label.
 * Handles input state and blur-based saving.
 */

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Choice } from '@/lib/types'

interface ChoiceFormProps {
  choice: Choice
  isSaving: boolean
  onLabelChange: (choiceId: string, newLabel: string) => void
  onLabelBlur: (choiceId: string, newLabel: string, originalLabel: string) => void
  onFocus: (choiceId: string) => void
}

export function ChoiceForm({
  choice,
  isSaving,
  onLabelChange,
  onLabelBlur,
  onFocus,
}: ChoiceFormProps) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1">
        Choice Label
      </Label>
      <Input
        value={choice.label}
        onChange={(e) => onLabelChange(choice.id, e.target.value)}
        onBlur={(e) => {
          const newLabel = e.target.value.trim()
          onLabelBlur(choice.id, newLabel, choice.label)
        }}
        onFocus={() => onFocus(choice.id)}
        placeholder="e.g., Go north, Fight the dragon"
        className="text-xs sm:text-sm"
        disabled={isSaving}
      />
    </div>
  )
}
