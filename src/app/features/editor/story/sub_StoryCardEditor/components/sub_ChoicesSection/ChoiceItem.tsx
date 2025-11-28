'use client'

import { GripVertical, Trash2, ArrowRight, AlertCircle } from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface ChoiceItemProps {
  choice: Choice
  isEditing: boolean
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

export function ChoiceItem({
  choice,
  isEditing,
  isSaving,
  otherCards,
  onLabelChange,
  onLabelBlur,
  onFocus,
  onTargetChange,
  onDelete,
  getTargetCardTitle,
  isTargetValid,
}: ChoiceItemProps) {
  const isValid = isTargetValid(choice.targetCardId)

  return (
    <div
      className={cn(
        'border-2 rounded-lg p-4 bg-card transition-all duration-200 halloween-skeleton-rattle',
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
              onChange={(e) => onLabelChange(choice.id, e.target.value)}
              onBlur={() => onLabelBlur(choice.id)}
              onFocus={() => onFocus(choice.id)}
              placeholder="e.g., Go north, Fight the dragon, Open the door..."
              className="border-2 border-border focus:border-primary
                         shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] halloween-candle-flicker-focus"
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
              onValueChange={(value) => onTargetChange(choice.id, value)}
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
          onClick={() => onDelete(choice.id)}
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
}
