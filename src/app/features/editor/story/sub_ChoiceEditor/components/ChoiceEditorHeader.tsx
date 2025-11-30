'use client'

import { Plus, Sparkles, Loader2, Target, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface GeneratedChoice {
  label: string
  description: string
}

export interface ChoiceEditorHeaderProps {
  choiceCount: number
  isSaving: boolean
  isGenerating: boolean
  canAddChoices: boolean
  hasPredecessors: boolean
  hasCurrentCard: boolean
  suggestedChoices: GeneratedChoice[]
  onAddChoice: () => void
  onGenerateChoices: () => void
  onApplySuggestion: (suggestion: GeneratedChoice) => void
}

export function ChoiceEditorHeader({
  choiceCount,
  isSaving,
  isGenerating,
  canAddChoices,
  hasPredecessors,
  hasCurrentCard,
  suggestedChoices,
  onAddChoice,
  onGenerateChoices,
  onApplySuggestion,
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
        <div className="flex items-center gap-2">
          {hasPredecessors && hasCurrentCard && (
            <Button
              onClick={onGenerateChoices}
              disabled={isSaving || isGenerating}
              size="sm"
              variant="outline"
              className="border-2 border-primary/50 hover:border-primary hover:bg-primary/10"
              data-testid="generate-choices-btn"
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
      </div>

      {/* Suggested Choices from AI */}
      {suggestedChoices.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">AI Suggestions (click to add):</Label>
          <div className="grid gap-2">
            {suggestedChoices.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onApplySuggestion(suggestion)}
                disabled={isSaving || !canAddChoices}
                className={cn(
                  "text-left p-3 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5",
                  "hover:border-primary hover:bg-primary/10 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                data-testid={`ai-suggestion-${index}`}
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
