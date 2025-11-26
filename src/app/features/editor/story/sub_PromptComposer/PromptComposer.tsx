'use client'

import { useState, useMemo } from 'react'
import {
  PROMPT_COLUMNS,
  PromptDimension,
  PromptOption,
  composePrompt,
} from '@/lib/promptComposer'
import { Header } from './components/Header'
import { OptionSelector } from './components/OptionSelector'
import { PromptPreview } from './components/PromptPreview'

interface PromptComposerProps {
  onImageSelect?: (imageUrl: string, prompt: string) => void
  isGenerating?: boolean
  cardContent?: string  // Card content for prefilling custom setting
}

interface SelectionState {
  style?: PromptOption
  setting?: PromptOption
  mood?: PromptOption
}

export default function PromptComposer({
  onImageSelect,
  isGenerating: externalGenerating = false,
  cardContent,
}: PromptComposerProps) {
  const [selections, setSelections] = useState<SelectionState>({})
  const [copied, setCopied] = useState(false)
  const [expandedColumn, setExpandedColumn] = useState<string | null>('style')

  const handleSelect = (dimension: PromptDimension, option: PromptOption) => {
    setSelections((prev) => {
      // Toggle selection
      const isSelected = prev[dimension]?.id === option.id
      const next = isSelected
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: option }

      return next
    })
  }

  const handleClear = () => {
    setSelections({})
  }

  const handleCopyPrompt = async () => {
    const prompt = composePrompt(selections)
    if (prompt) {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleImageSelect = (imageUrl: string, prompt: string) => {
    onImageSelect?.(imageUrl, prompt)
  }

  const finalPrompt = useMemo(() => composePrompt(selections), [selections])
  const hasSelections = Object.values(selections).some(Boolean)

  const toggleColumn = (columnId: string) => {
    setExpandedColumn(prev => prev === columnId ? null : columnId)
  }

  return (
    <div className="space-y-4">
      <Header
        hasSelections={hasSelections}
        loading={externalGenerating}
        onClear={handleClear}
      />

      {/* Columns */}
      <div className="space-y-2">
        {PROMPT_COLUMNS.map((column) => (
          <OptionSelector
            key={column.id}
            column={column}
            selectedOption={selections[column.id]}
            isExpanded={expandedColumn === column.id}
            loading={externalGenerating}
            onToggle={toggleColumn}
            onSelect={handleSelect}
            prefillContent={column.id === 'setting' ? cardContent : undefined}
            artStyleId={selections.style?.id}
          />
        ))}
      </div>

      {/* Prompt Preview with Sketch Generation */}
      {hasSelections && (
        <PromptPreview
          prompt={finalPrompt}
          copied={copied}
          loading={externalGenerating}
          onCopy={handleCopyPrompt}
          onImageSelect={handleImageSelect}
        />
      )}

      {/* Empty State */}
      {!hasSelections && (
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Select options above to build your image prompt
          </p>
        </div>
      )}
    </div>
  )
}
