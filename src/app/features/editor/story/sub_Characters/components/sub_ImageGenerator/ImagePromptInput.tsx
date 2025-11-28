'use client'

import { RefreshCw } from 'lucide-react'
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
  onGenerateSketches: () => void
  isGeneratingSketches: boolean
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
  onGenerateSketches,
  isGeneratingSketches,
}: ImagePromptInputProps) {
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
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Generated Prompt
          </span>
          <p className="text-xs text-foreground line-clamp-4">{finalPrompt}</p>
          <span className="text-xs text-muted-foreground">
            {finalPrompt.length}/1618 characters
          </span>
        </div>
      )}
    </div>
  )
}
