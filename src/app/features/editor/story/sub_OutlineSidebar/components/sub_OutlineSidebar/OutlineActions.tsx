'use client'

/**
 * OutlineActions Component
 *
 * Header actions for the outline sidebar including add card button.
 */

import { Button } from '@/components/ui/button'
import { Plus, List } from 'lucide-react'

interface OutlineActionsProps {
  cardCount: number
  onAddCard: () => void
}

export function OutlineActions({
  cardCount,
  onAddCard,
}: OutlineActionsProps) {
  return (
    <div className="p-3 sm:p-4 border-b-2 border-border">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <List className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">
            Outline
          </h3>
        </div>
        <Button
          size="sm"
          onClick={onAddCard}
          className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all touch-manipulation"
          data-testid="outline-add-card-btn"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {cardCount} {cardCount === 1 ? 'card' : 'cards'}
      </p>
    </div>
  )
}
