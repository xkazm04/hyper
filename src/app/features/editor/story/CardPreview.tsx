'use client'

import { useMemo } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { FileText, Eye } from 'lucide-react'
import { CardDisplay } from '@/components/player/sub_StoryPlayer/CardDisplay'

/**
 * CardPreview - Live preview of the current story card
 *
 * Uses the shared CardDisplay component with 'player' variant
 * for full content display including title, content, image, audio, and choices.
 * This provides a true WYSIWYG preview of how the card will appear to readers.
 */
export default function CardPreview() {
  const { currentCard, storyStack, choices } = useEditor()

  // Filter choices for the current card and sort by orderIndex
  const cardChoices = useMemo(() => {
    if (!currentCard) return []
    return choices
      .filter(choice => choice.storyCardId === currentCard.id)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  }, [choices, currentCard])

  if (!currentCard) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10" data-testid="card-preview-empty">
        <div className="text-center p-8">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No Card Selected</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a card from the sidebar or story graph to see the live preview
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-muted/20" data-testid="card-preview">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Live Preview
            </span>
          </div>
          {storyStack && (
            <span className="text-xs text-muted-foreground truncate">
              {storyStack.name}
            </span>
          )}
        </div>
      </div>

      {/* Card Display - Full player layout */}
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 md:py-12">
        <CardDisplay
          card={currentCard}
          choices={cardChoices}
          variant="player"
          disabled
          autoplayAudio={false}
          theme={{
            shadowStyle: 'soft',
            choiceBg: 'hsl(var(--primary))',
            choiceText: 'hsl(var(--primary-foreground))',
            choiceBorder: 'hsl(var(--border))',
          }}
        />

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {cardChoices.length === 0 ? (
              <span className="text-amber-500">⚠ This card has no choices - it's a story ending</span>
            ) : (
              <span>{cardChoices.length} choice{cardChoices.length !== 1 ? 's' : ''} available</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
