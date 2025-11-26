'use client'

import { useEditor } from '@/contexts/EditorContext'
import { Button } from '@/components/ui/button'
import { Plus, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardListProps {
  onAddCard: () => void
}

export default function CardList({ onAddCard }: CardListProps) {
  const { storyCards, currentCardId, setCurrentCardId } = useEditor()

  return (
    <div className="h-full flex flex-col bg-card lg:border-r-2 border-border">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b-2 border-border">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">Cards</h3>
          <Button
            size="sm"
            onClick={onAddCard}
            className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all touch-manipulation"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {storyCards.length} {storyCards.length === 1 ? 'card' : 'cards'}
        </p>
      </div>

      {/* Card List */}
      <div className="flex-1 overflow-y-auto p-2">
        {storyCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">No cards yet</p>
            <Button
              size="sm"
              onClick={onAddCard}
              className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] touch-manipulation"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Card
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {storyCards
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => setCurrentCardId(card.id)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded border transition-all touch-manipulation',
                    'hover:bg-muted active:scale-[0.98]',
                    currentCardId === card.id
                      ? 'bg-primary/10 border-primary'
                      : 'border-transparent hover:border-border'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">
                        {card.title || 'Untitled Card'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
