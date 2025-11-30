'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { HistoryEntry } from '../lib/types'
import {
  formatDiffSummary,
  formatRelativeTime,
  getActionIcon,
  getActionColorClass,
} from '../lib/diffUtils'

interface HistoryEntryItemProps {
  entry: HistoryEntry
  index: number
  isActive: boolean
  isCurrent: boolean
  isFuture: boolean
  onClick: () => void
}

export const HistoryEntryItem = memo(function HistoryEntryItem({
  entry,
  index,
  isActive,
  isCurrent,
  isFuture,
  onClick,
}: HistoryEntryItemProps) {
  const actionIcon = getActionIcon(entry.actionType)
  const actionColorClass = getActionColorClass(entry.actionType)
  const diffSummaryText = formatDiffSummary(entry.diffSummary)
  const relativeTime = formatRelativeTime(entry.timestamp)

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
        'hover:bg-muted/50',
        isCurrent && 'bg-primary/10 border-l-2 border-primary',
        isFuture && 'opacity-50',
        isActive && !isCurrent && 'bg-muted'
      )}
      data-testid={`history-entry-${index}`}
      aria-current={isCurrent ? 'step' : undefined}
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        {/* Action icon */}
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
            actionColorClass
          )}
          aria-hidden="true"
        >
          {actionIcon}
        </div>
        {/* Connector line (hidden for last item) */}
        <div className="w-0.5 flex-1 bg-border mt-1" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Action label */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'text-sm font-medium truncate',
              isCurrent ? 'text-primary' : 'text-foreground'
            )}
          >
            {entry.actionLabel}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {relativeTime}
          </span>
        </div>

        {/* Entity name (card/choice/character title) */}
        {entry.affectedCardTitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {entry.affectedCardTitle}
          </p>
        )}

        {/* Diff summary */}
        {entry.diffSummary && (
          <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
            {diffSummaryText}
          </p>
        )}

        {/* Current marker */}
        {isCurrent && (
          <span className="inline-flex items-center mt-1.5 text-[10px] uppercase tracking-wider font-semibold text-primary">
            ● Current
          </span>
        )}
      </div>

      {/* Thumbnail for image changes */}
      {entry.affectedCardImageUrl && (
        <div
          className="shrink-0 w-10 h-10 rounded-md overflow-hidden border border-border bg-muted"
          data-testid={`history-entry-thumbnail-${index}`}
        >
          <img
            src={entry.affectedCardImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}
    </motion.button>
  )
})
