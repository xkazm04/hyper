'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PROMPT_COLUMNS,
  PromptDimension,
  PromptOption,
  composePrompt,
} from '@/lib/promptComposer'
import { useEditor } from '@/contexts/EditorContext'
import { getEffectiveArtStylePrompt, getArtStyleDetails } from '../sub_Story/lib/artStyleService'
import { Header } from './components/Header'
import { OptionSelector } from './components/OptionSelector'
import { PromptPreview } from './components/PromptPreview'
import { ResizableSplitter, SplitterToggleButton } from './components/ResizableSplitter'
import { useResizablePanel } from './hooks/useResizablePanel'

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
  const { storyStack } = useEditor()
  const [selections, setSelections] = useState<SelectionState>({})
  const [copied, setCopied] = useState(false)
  const [expandedColumn, setExpandedColumn] = useState<string | null>('style')
  const [showPreviewInCollapsed, setShowPreviewInCollapsed] = useState(false)

  // Resizable panel state
  const {
    leftPanelWidth,
    isCollapsed,
    isDragging,
    startDrag,
    onDrag,
    endDrag,
    containerRef,
  } = useResizablePanel()

  // Get story-level art style info
  const storyArtStyle = useMemo(() => {
    if (!storyStack) return null
    return {
      prompt: getEffectiveArtStylePrompt(storyStack),
      details: getArtStyleDetails(storyStack)
    }
  }, [storyStack])

  const handleSelect = useCallback((dimension: PromptDimension, option: PromptOption) => {
    setSelections((prev) => {
      // Toggle selection
      const isSelected = prev[dimension]?.id === option.id
      const next = isSelected
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: option }

      return next
    })
  }, [])

  const handleClear = useCallback(() => {
    setSelections({})
  }, [])

  const handleCopyPrompt = useCallback(async () => {
    const prompt = finalPrompt
    if (prompt) {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [])

  const handleImageSelect = useCallback((imageUrl: string, prompt: string) => {
    onImageSelect?.(imageUrl, prompt)
  }, [onImageSelect])

  // Compose final prompt, using story-level art style as base if available
  const finalPrompt = useMemo(() => {
    const basePrompt = composePrompt(selections)

    // If story has a custom art style set, prepend it to the prompt
    if (storyArtStyle?.prompt && !selections.style) {
      // No style selected - use story-level art style
      const parts: string[] = [storyArtStyle.prompt]

      if (selections.setting) {
        parts.push(`\n\nScene: ${selections.setting.prompt}`)
      }
      if (selections.mood) {
        parts.push(`\n\nMood: ${selections.mood.prompt}`)
      }

      return parts.join('')
    }

    return basePrompt
  }, [selections, storyArtStyle])

  const hasSelections = Object.values(selections).some(Boolean)
  const showPreview = hasSelections || storyArtStyle

  const toggleColumn = useCallback((columnId: string) => {
    setExpandedColumn(prev => prev === columnId ? null : columnId)
  }, [])

  const togglePreviewInCollapsed = useCallback(() => {
    setShowPreviewInCollapsed(prev => !prev)
  }, [])

  // Keyboard navigation for columns
  const handleKeyDown = useCallback((e: React.KeyboardEvent, columnIndex: number) => {
    const columns = PROMPT_COLUMNS
    let newIndex = columnIndex

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        newIndex = Math.min(columnIndex + 1, columns.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        newIndex = Math.max(columnIndex - 1, 0)
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = columns.length - 1
        break
      default:
        return
    }

    if (newIndex !== columnIndex) {
      const columnId = columns[newIndex].id
      setExpandedColumn(columnId)
      // Focus the new column header
      const element = document.querySelector(`[data-column-id="${columnId}"]`) as HTMLElement
      element?.focus()
    }
  }, [])

  // Collapsed layout: Stack vertically with toggle
  if (isCollapsed) {
    return (
      <section
        className="space-y-4"
        aria-label="Image Prompt Builder"
        data-testid="prompt-composer"
      >
        <Header
          hasSelections={hasSelections}
          loading={externalGenerating}
          onClear={handleClear}
        />

        {/* Toggle between options and preview in collapsed mode */}
        {showPreview && finalPrompt && (
          <div className="flex justify-end">
            <SplitterToggleButton
              isPreviewVisible={showPreviewInCollapsed}
              onToggle={togglePreviewInCollapsed}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {!showPreviewInCollapsed ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Story Art Style Indicator */}
              {storyArtStyle && !selections.style && (
                <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-primary/10 border-2 border-primary/30 rounded-lg">
                  <span className="text-lg">{storyArtStyle.details.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary">Story Art Style Active</p>
                    <p className="text-xs text-muted-foreground truncate">{storyArtStyle.details.label}</p>
                  </div>
                </div>
              )}

              {/* Options columns */}
              <nav
                className="space-y-2"
                role="group"
                aria-label="Prompt dimensions"
                data-testid="prompt-composer-dimensions"
              >
                {PROMPT_COLUMNS.map((column, index) => (
                  <OptionSelector
                    key={column.id}
                    column={column}
                    selectedOption={selections[column.id]}
                    isExpanded={expandedColumn === column.id}
                    loading={externalGenerating}
                    onToggle={toggleColumn}
                    onSelect={handleSelect}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    prefillContent={column.id === 'setting' ? cardContent : undefined}
                    artStyleId={selections.style?.id || storyStack?.artStyleId || undefined}
                  />
                ))}
              </nav>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {showPreview && finalPrompt && (
                <PromptPreview
                  prompt={finalPrompt}
                  copied={copied}
                  loading={externalGenerating}
                  onCopy={handleCopyPrompt}
                  onImageSelect={handleImageSelect}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!hasSelections && !storyArtStyle && (
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center"
            role="status"
            aria-live="polite"
            data-testid="prompt-composer-empty-state"
          >
            <p className="text-xs text-muted-foreground">
              Select options above to build your image prompt
            </p>
          </div>
        )}
      </section>
    )
  }

  // Full layout: Side-by-side with resizable splitter
  return (
    <section
      className="space-y-4"
      aria-label="Image Prompt Builder"
      data-testid="prompt-composer"
    >
      <Header
        hasSelections={hasSelections}
        loading={externalGenerating}
        onClear={handleClear}
      />

      {/* Story Art Style Indicator */}
      {storyArtStyle && !selections.style && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border-2 border-primary/30 rounded-lg">
          <span className="text-lg">{storyArtStyle.details.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-primary">Story Art Style Active</p>
            <p className="text-xs text-muted-foreground truncate">{storyArtStyle.details.label}</p>
          </div>
        </div>
      )}

      {/* Two-column layout with resizable splitter */}
      <div
        ref={containerRef}
        className="flex min-h-[300px] border-2 border-border rounded-lg overflow-hidden bg-card"
        data-testid="prompt-composer-resizable-container"
      >
        {/* Left Panel: Options */}
        <motion.div
          className="overflow-y-auto p-3"
          style={{ width: `${leftPanelWidth}%` }}
          animate={{ width: `${leftPanelWidth}%` }}
          transition={isDragging ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
          data-testid="prompt-composer-options-panel"
        >
          <nav
            className="space-y-2"
            role="group"
            aria-label="Prompt dimensions"
            data-testid="prompt-composer-dimensions"
          >
            {PROMPT_COLUMNS.map((column, index) => (
              <OptionSelector
                key={column.id}
                column={column}
                selectedOption={selections[column.id]}
                isExpanded={expandedColumn === column.id}
                loading={externalGenerating}
                onToggle={toggleColumn}
                onSelect={handleSelect}
                onKeyDown={(e) => handleKeyDown(e, index)}
                prefillContent={column.id === 'setting' ? cardContent : undefined}
                artStyleId={selections.style?.id || storyStack?.artStyleId || undefined}
              />
            ))}
          </nav>
        </motion.div>

        {/* Splitter */}
        <ResizableSplitter
          isDragging={isDragging}
          onDragStart={startDrag}
          onDrag={onDrag}
          onDragEnd={endDrag}
        />

        {/* Right Panel: Preview */}
        <motion.div
          className="overflow-y-auto p-3 flex-1 min-w-0"
          data-testid="prompt-composer-preview-panel"
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {showPreview && finalPrompt ? (
            <PromptPreview
              prompt={finalPrompt}
              copied={copied}
              loading={externalGenerating}
              onCopy={handleCopyPrompt}
              onImageSelect={handleImageSelect}
            />
          ) : (
            <div
              className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg p-4"
              role="status"
              aria-live="polite"
              data-testid="prompt-composer-empty-state"
            >
              <p className="text-xs text-muted-foreground text-center">
                Select options on the left to build your image prompt
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
