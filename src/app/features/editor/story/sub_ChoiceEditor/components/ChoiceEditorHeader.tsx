'use client'

import { Plus, Target, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export interface ChoiceEditorHeaderProps {
  choiceCount: number
  isSaving: boolean
  canAddChoices: boolean
  onAddChoice: () => void
}

/**
 * ChoiceEditorHeader - Header for the choice editor
 *
 * Note: AI suggestion generation has been consolidated into the AICompanionBottomPanel's
 * "Next Steps" feature which creates both new cards AND choices in one operation.
 */
export function ChoiceEditorHeader({
  choiceCount,
  isSaving,
  canAddChoices,
  onAddChoice,
}: ChoiceEditorHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Story Choices</Label>
          <span className="text-xs text-muted-foreground">
            ({choiceCount} {choiceCount === 1 ? 'choice' : 'choices'})
          </span>
        </div>
        <Button
          onClick={onAddChoice}
          disabled={isSaving || !canAddChoices}
          size="sm"
          className="border-2 border-border bg-primary text-primary-foreground
                     shadow-[2px_2px_0px_0px_hsl(var(--border))]
                     hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                     hover:-translate-x-px hover:-translate-y-px transition-all"
          data-testid="add-choice-btn"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Add Choice
        </Button>
      </div>

      {/* Helper Warning */}
      {!canAddChoices && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200">
            Create more cards to add choices. Use the AI Companion's "Next Steps" to create connected scenes.
          </p>
        </div>
      )}
    </div>
  )
}
