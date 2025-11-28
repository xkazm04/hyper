'use client'

/**
 * OutlineTree Component
 * 
 * Renders the tree structure of story cards with empty state handling.
 */

import { forwardRef, KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import { StoryCard } from '@/lib/types'
import { OutlineItem } from './OutlineItem'

interface OutlineTreeProps {
  sortedCards: StoryCard[]
  currentCardId: string | null
  expandedNodes: Set<string>
  focusedIndex: number
  dragOverIndex: number | null
  draggedIndex: number | null
  getChildCards: (cardId: string) => StoryCard[]
  onAddCard: () => void
  onSelect: (cardId: string) => void
  onToggleExpand: (cardId: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent, dropIndex: number) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, cardId: string, index: number) => void
}

export const OutlineTree = forwardRef<HTMLDivElement, OutlineTreeProps>(
  function OutlineTree(
    {
      sortedCards,
      currentCardId,
      expandedNodes,
      focusedIndex,
      dragOverIndex,
      draggedIndex,
      getChildCards,
      onAddCard,
      onSelect,
      onToggleExpand,
      onDragStart,
      onDragOver,
      onDragEnd,
      onDrop,
      onKeyDown,
    },
    ref
  ) {
    if (sortedCards.length === 0) {
      return (
        <div
          ref={ref}
          className="flex-1 overflow-y-auto p-2"
          role="tree"
          aria-label="Story cards outline"
          data-testid="outline-tree"
        >
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              No cards yet
            </p>
            <Button
              size="sm"
              onClick={onAddCard}
              className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] touch-manipulation"
              data-testid="outline-add-first-card-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Card
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className="flex-1 overflow-y-auto p-2"
        role="tree"
        aria-label="Story cards outline"
        data-testid="outline-tree"
      >
        <div className="space-y-0.5" role="group">
          {sortedCards.map((card, index) => {
            const childCards = getChildCards(card.id)
            const hasChildren = childCards.length > 0
            const isExpanded = expandedNodes.has(card.id)

            return (
              <OutlineItem
                key={card.id}
                card={card}
                index={index}
                isSelected={currentCardId === card.id}
                isExpanded={isExpanded}
                hasChildren={hasChildren}
                focusedIndex={focusedIndex}
                dragOverIndex={dragOverIndex}
                draggedIndex={draggedIndex}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                onKeyDown={onKeyDown}
              />
            )
          })}
        </div>
      </div>
    )
  }
)
