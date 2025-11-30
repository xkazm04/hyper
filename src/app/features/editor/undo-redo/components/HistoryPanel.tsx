'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, ChevronDown, ChevronUp, Undo2, Redo2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUndoRedoContext } from '../UndoRedoContext'
import { HistoryEntryItem } from './HistoryEntryItem'
import { Button } from '@/components/ui/button'

interface HistoryPanelProps {
  className?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  maxVisibleEntries?: number
}

export function HistoryPanel({
  className,
  collapsible = true,
  defaultCollapsed = false,
  maxVisibleEntries = 20,
}: HistoryPanelProps) {
  const {
    historyEntries,
    futureEntries,
    currentIndex,
    totalEntries,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHistory,
    jumpToHistoryIndex,
  } = useUndoRedoContext()

  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to current entry when it changes
  useEffect(() => {
    if (scrollContainerRef.current && !isCollapsed) {
      const currentElement = scrollContainerRef.current.querySelector(
        '[aria-current="step"]'
      )
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }, [currentIndex, isCollapsed])

  const handleUndo = useCallback(() => {
    undo()
  }, [undo])

  const handleRedo = useCallback(() => {
    redo()
  }, [redo])

  const handleClearHistory = useCallback(() => {
    if (window.confirm('Clear all history? This cannot be undone.')) {
      clearHistory()
    }
  }, [clearHistory])

  const handleJumpToEntry = useCallback(
    (index: number) => {
      jumpToHistoryIndex(index)
    },
    [jumpToHistoryIndex]
  )

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  // Combine past and future entries for display
  // Show in reverse chronological order (newest first)
  const allEntries = [
    ...historyEntries.map((entry, idx) => ({
      entry,
      originalIndex: idx,
      isFuture: false,
    })),
    ...futureEntries.map((entry, idx) => ({
      entry,
      originalIndex: currentIndex + idx + 1,
      isFuture: true,
    })),
  ].reverse()

  // Limit visible entries
  const visibleEntries = allEntries.slice(0, maxVisibleEntries)
  const hasMoreEntries = allEntries.length > maxVisibleEntries

  const isEmpty = historyEntries.length === 0 && futureEntries.length === 0

  return (
    <div
      className={cn(
        'flex flex-col bg-card border-2 border-border rounded-lg overflow-hidden shadow-theme-sm',
        className
      )}
      data-testid="history-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <h3 className="text-sm font-medium text-foreground">History</h3>
          {!isEmpty && (
            <span className="text-xs text-muted-foreground">
              ({historyEntries.length} actions)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Undo/Redo buttons */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            data-testid="history-undo-btn"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            data-testid="history-redo-btn"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </Button>

          {/* Clear button */}
          {!isEmpty && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleClearHistory}
              title="Clear history"
              data-testid="history-clear-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Collapse toggle */}
          {collapsible && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleCollapse}
              title={isCollapsed ? 'Expand history' : 'Collapse history'}
              data-testid="history-toggle-btn"
            >
              {isCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {isEmpty ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No history yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Start editing to build your history
                </p>
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="max-h-80 overflow-y-auto p-2 space-y-1"
                role="list"
                aria-label="Edit history"
              >
                {/* Current state marker */}
                <div
                  className={cn(
                    'flex items-center gap-3 p-2 text-xs font-medium',
                    futureEntries.length === 0
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                  data-testid="history-current-marker"
                >
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center border-2',
                      futureEntries.length === 0
                        ? 'border-primary bg-primary/10'
                        : 'border-muted-foreground/50 bg-muted'
                    )}
                  >
                    <span className="text-[10px]">NOW</span>
                  </div>
                  <span>Current state</span>
                </div>

                {/* Timeline entries */}
                {visibleEntries.map(({ entry, originalIndex, isFuture }) => (
                  <HistoryEntryItem
                    key={entry.id}
                    entry={entry}
                    index={originalIndex}
                    isActive={originalIndex === currentIndex - 1}
                    isCurrent={originalIndex === currentIndex - 1 && !isFuture}
                    isFuture={isFuture}
                    onClick={() => handleJumpToEntry(originalIndex)}
                  />
                ))}

                {/* More entries indicator */}
                {hasMoreEntries && (
                  <div className="text-center py-2 text-xs text-muted-foreground">
                    +{allEntries.length - maxVisibleEntries} more entries
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed summary */}
      {isCollapsed && !isEmpty && (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {canUndo && (
            <span>
              Can undo {historyEntries.length} action
              {historyEntries.length !== 1 ? 's' : ''}
            </span>
          )}
          {canRedo && (
            <span className="ml-2">
              · Can redo {futureEntries.length} action
              {futureEntries.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
