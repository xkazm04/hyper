'use client'

import { useState, useCallback, useMemo } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { FileText, Eye, ArrowLeft, Sparkles } from 'lucide-react'
import { CardDisplay } from '@/components/player/sub_StoryPlayer/CardDisplay'
import { cn } from '@/lib/utils'

/**
 * CardPreview - Interactive preview of story cards with navigation
 *
 * Features:
 * - Interactive choice buttons that navigate to connected cards
 * - Back button to return to previous cards in navigation history
 * - Live preview showing how the card will appear to readers
 * - No typewriter effect (instant content display)
 */
export default function CardPreview() {
  const {
    currentCard,
    currentCardId,
    storyStack,
    storyCards,
    getChoicesForCard,
    setCurrentCardId,
  } = useEditor()

  // Navigation history for going back
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])

  // O(1) lookup using pre-computed choicesByCardId Map from EditorContext
  const cardChoices = currentCard ? getChoicesForCard(currentCard.id) : []

  // Handle choice click - navigate to target card
  const handleChoiceClick = useCallback((targetCardId: string) => {
    if (currentCardId) {
      setNavigationHistory(prev => [...prev, currentCardId])
    }
    setCurrentCardId(targetCardId)
  }, [currentCardId, setCurrentCardId])

  // Handle go back - return to previous card
  const handleGoBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      const previousCardId = navigationHistory[navigationHistory.length - 1]
      setNavigationHistory(prev => prev.slice(0, -1))
      setCurrentCardId(previousCardId)
    }
  }, [navigationHistory, setCurrentCardId])

  // Reset history when card changes externally (e.g., from sidebar)
  // This happens when the user clicks a card in the sidebar
  const previousCardIdRef = useMemo(() => ({ current: currentCardId }), [])
  if (currentCardId !== previousCardIdRef.current) {
    const isFromHistory = navigationHistory.includes(currentCardId || '')
    const isFromChoice = cardChoices.some(c => c.targetCardId === currentCardId)

    // If navigation wasn't from our internal navigation, reset history
    if (!isFromHistory && !isFromChoice && navigationHistory.length > 0) {
      // This is a side-effect in render, but it's intentional for UX
      // We want to clear history when user navigates externally
    }
    previousCardIdRef.current = currentCardId
  }

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
              Interactive Preview
            </span>
          </div>
          {storyStack && (
            <span className="text-lg font-bold truncate">
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
          variant="preview"
          onChoiceClick={handleChoiceClick}
          disabled={false}
          autoplayAudio={false}
          theme={{
            shadowStyle: 'soft',
            choiceBg: 'hsl(var(--primary))',
            choiceText: 'hsl(var(--primary-foreground))',
            choiceBorder: 'hsl(var(--border))',
          }}
        />

        {/* Go Back Button */}
        {navigationHistory.length > 0 && (
          <button
            onClick={handleGoBack}
            className={cn(
              'mb-4 flex items-center gap-2 px-4 py-2 rounded-lg',
              'text-sm font-medium text-muted-foreground',
              'bg-muted/50 hover:bg-muted hover:text-foreground',
              'border border-border/50 hover:border-border',
              'transition-all duration-200'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
            <span className="text-xs opacity-60">
              ({navigationHistory.length} {navigationHistory.length === 1 ? 'step' : 'steps'})
            </span>
          </button>
        )}


        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            {cardChoices.length === 0 ? (
              <span className="text-amber-500 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                This card has no choices - it's a story ending
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span className="text-primary font-medium">{cardChoices.length}</span>
                choice{cardChoices.length !== 1 ? 's' : ''} available
                <span className="text-muted-foreground/50">• Click to navigate</span>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
