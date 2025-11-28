'use client'

/**
 * OutlineActions Component
 * 
 * Header actions for the outline sidebar including add card and collapse buttons.
 */

import { Button } from '@/components/ui/button'
import { Plus, ChevronLeft, ChevronRight, List } from 'lucide-react'

interface OutlineActionsProps {
  cardCount: number
  isCollapsed: boolean
  onAddCard: () => void
  onToggleCollapse?: () => void
}

export function OutlineActions({
  cardCount,
  isCollapsed,
  onAddCard,
  onToggleCollapse,
}: OutlineActionsProps) {
  if (isCollapsed) {
    return (
      <>
        <div className="p-2 border-b-2 border-border">
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleCollapse}
            className="w-full h-8 p-0"
            data-testid="outline-expand-sidebar-btn"
            aria-label="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center py-2 gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddCard}
            className="w-8 h-8 p-0"
            data-testid="outline-add-card-collapsed-btn"
            aria-label="Add card"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <div className="text-xs text-muted-foreground font-bold mt-2">
            {cardCount}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="p-3 sm:p-4 border-b-2 border-border">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
            Outline
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            onClick={onAddCard}
            className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all touch-manipulation"
            data-testid="outline-add-card-btn"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          {onToggleCollapse && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              className="ml-1"
              data-testid="outline-collapse-sidebar-btn"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
      </p>
    </div>
  )
}
