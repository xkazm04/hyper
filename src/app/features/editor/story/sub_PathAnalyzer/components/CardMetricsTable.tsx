'use client'

import { useState } from 'react'
import {
  LayoutGrid,
  ArrowUpDown,
  Eye,
  Clock,
  Flag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryAnalytics, CardAnalytics } from '../lib/types'
import { formatDuration } from '../lib/types'

interface CardMetricsTableProps {
  analytics: StoryAnalytics
  onCardClick?: (cardId: string) => void
  className?: string
}

type SortField = 'visits' | 'time' | 'entryRate'
type SortOrder = 'asc' | 'desc'

export function CardMetricsTable({
  analytics,
  onCardClick,
  className,
}: CardMetricsTableProps) {
  const [sortField, setSortField] = useState<SortField>('visits')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [expanded, setExpanded] = useState(false)

  // Convert to array and filter out cards with no visits
  const cardData = Array.from(analytics.cardAnalytics.values()).filter(
    (c) => c.visitCount > 0
  )

  // Sort cards
  const sortedCards = [...cardData].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'visits':
        comparison = a.visitCount - b.visitCount
        break
      case 'time':
        comparison = a.averageTimeSpent - b.averageTimeSpent
        break
      case 'entryRate':
        comparison = a.entryRate - b.entryRate
        break
    }
    return sortOrder === 'desc' ? -comparison : comparison
  })

  const displayCards = expanded ? sortedCards : sortedCards.slice(0, 5)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const SortButton = ({
    field,
    children,
  }: {
    field: SortField
    children: React.ReactNode
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        'flex items-center gap-1 text-xs hover:text-foreground transition-colors',
        sortField === field ? 'text-foreground' : 'text-muted-foreground'
      )}
      data-testid={`sort-by-${field}-btn`}
    >
      {children}
      {sortField === field && (
        <ArrowUpDown
          className={cn(
            'w-3 h-3',
            sortOrder === 'desc' && 'rotate-180'
          )}
        />
      )}
    </button>
  )

  if (cardData.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground uppercase tracking-wide">
          Card Metrics
        </span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-2 py-1 bg-muted/50 rounded-md text-xs">
        <div className="text-muted-foreground">Card</div>
        <SortButton field="visits">
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">Visits</span>
        </SortButton>
        <SortButton field="time">
          <Clock className="w-3 h-3" />
          <span className="hidden sm:inline">Avg Time</span>
        </SortButton>
        <SortButton field="entryRate">
          <Flag className="w-3 h-3" />
          <span className="hidden sm:inline">Rate</span>
        </SortButton>
      </div>

      {/* Table rows */}
      <div className="space-y-1">
        {displayCards.map((card, index) => {
          const isDeadEnd = analytics.deadEndCards.includes(card.cardId)

          return (
            <button
              key={card.cardId}
              onClick={() => onCardClick?.(card.cardId)}
              className={cn(
                'w-full grid grid-cols-[1fr,auto,auto,auto] gap-2 px-2 py-1.5 rounded-md',
                'hover:bg-muted/50 transition-colors text-left',
                isDeadEnd && 'border-l-2 border-green-500'
              )}
              data-testid={`card-metric-row-${index}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-mono text-muted-foreground w-4">
                  {index + 1}
                </span>
                <span className="text-xs text-foreground truncate">
                  {card.cardTitle}
                </span>
                {isDeadEnd && (
                  <span className="shrink-0 px-1 py-0.5 text-[10px] bg-green-500/10 text-green-600 rounded">
                    END
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-foreground text-right">
                {card.visitCount}
              </span>
              <span className="text-xs text-muted-foreground text-right">
                {formatDuration(card.averageTimeSpent)}
              </span>
              <span className="text-xs text-muted-foreground text-right">
                {(card.entryRate * 100).toFixed(0)}%
              </span>
            </button>
          )
        })}
      </div>

      {/* Expand/collapse button */}
      {sortedCards.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="card-metrics-expand-btn"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              Show {sortedCards.length - 5} more cards
            </>
          )}
        </button>
      )}
    </div>
  )
}
