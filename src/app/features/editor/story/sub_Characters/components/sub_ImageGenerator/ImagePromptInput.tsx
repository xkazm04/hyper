'use client'

import { RefreshCw, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CHARACTER_PROMPT_COLUMNS,
  CharacterDimension,
  CharacterPromptOption,
} from '../../lib/characterPromptComposer'
import { CharacterOptionSelector } from '../CharacterOptionSelector'

export type SelectionState = Partial<Record<CharacterDimension, CharacterPromptOption>>

interface ImagePromptInputProps {
  selections: SelectionState
  expandedColumn: CharacterDimension | null
  loading: boolean
  hasSelections: boolean
  finalPrompt: string
  onSelect: (dimension: CharacterDimension, option: CharacterPromptOption) => void
  onToggleColumn: (columnId: CharacterDimension) => void
  onClear: () => void
  // AI composition state (FR-3.2, Task 10.1, 10.2)
  isComposingPrompt?: boolean
  composedPrompt?: string | null
  compositionError?: string | null
  usedFallbackPrompt?: boolean
}

export function ImagePromptInput({
  selections,
  expandedColumn,
  loading,
  hasSelections,
  finalPrompt,
  onSelect,
  onToggleColumn,
  onClear,
  isComposingPrompt = false,
  composedPrompt = null,
  compositionError = null,
  usedFallbackPrompt = false,
}: ImagePromptInputProps) {
  // Display the AI-composed prompt if available, otherwise show the base prompt
  const displayPrompt = composedPrompt || finalPrompt
  return (
    <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Build Character Prompt</h3>
        {hasSelections && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="h-7 text-xs"
            disabled={loading}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Option Selectors */}
      <div className="space-y-2">
        {CHARACTER_PROMPT_COLUMNS.map((column) => (
          <CharacterOptionSelector
            key={column.id}
            column={column}
            selectedOption={selections[column.id]}
            isExpanded={expandedColumn === column.id}
            loading={loading}
            onToggle={onToggleColumn}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Prompt Preview */}
      {hasSelections && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isComposingPrompt ? 'Composing Prompt...' : 'Generated Prompt'}
            </span>
            {/* Show AI badge when using AI-composed prompt */}
            {composedPrompt && !usedFallbackPrompt && !isComposingPrompt && (
              <span className="flex items-center gap-1 text-xs text-primary">
                <Sparkles className="w-3 h-3" />
                AI Enhanced
              </span>
            )}
          </div>
          
          {/* Loading state during AI composition (Task 10.1) */}
          {isComposingPrompt ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                AI is composing your prompt with story art style...
              </span>
            </div>
          ) : (
            <p className="text-xs text-foreground line-clamp-4">{displayPrompt}</p>
          )}
          
          {/* Composition error message (Task 10.2) */}
          {compositionError && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{compositionError}</span>
            </div>
          )}
          
          {!isComposingPrompt && (
            <span className="text-xs text-muted-foreground">
              {displayPrompt.length}/1600 characters
            </span>
          )}
        </div>
      )}
    </div>
  )
}
