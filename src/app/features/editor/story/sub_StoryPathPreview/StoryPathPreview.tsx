'use client'

import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/EditorContext'
import { useStoryPathPreview } from './StoryPathPreviewContext'
import { useStoryPath } from './lib/useStoryPath'
import { PathCardThumbnail } from './components/PathCardThumbnail'
import { ChevronLeft, ChevronRight, Map, X } from 'lucide-react'

export default function StoryPathPreview() {
  const { isOpen, close, resetAutoCloseTimer } = useStoryPathPreview()
  const {
    storyCards,
    choices,
    currentCardId,
    storyStack,
    setCurrentCardId,
  } = useEditor()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const currentCardRef = useRef<HTMLDivElement>(null)

  const pathCards = useStoryPath({
    storyCards,
    choices,
    currentCardId,
    firstCardId: storyStack?.firstCardId ?? null,
    maxDepth: 8,
  })

  // Find the index of current card for auto-scroll
  const currentCardIndex = pathCards.findIndex((pc) => pc.isCurrentCard)

  // Scroll to center current card when overlay opens
  useEffect(() => {
    if (isOpen && currentCardRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const currentElement = currentCardRef.current

      // Calculate scroll position to center the current card
      const containerWidth = container.clientWidth
      const elementLeft = currentElement.offsetLeft
      const elementWidth = currentElement.offsetWidth
      const scrollPosition = elementLeft - containerWidth / 2 + elementWidth / 2

      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth',
      })
    }
  }, [isOpen, currentCardIndex])

  // Handle card click - navigate to that card
  const handleCardClick = useCallback(
    (cardId: string) => {
      setCurrentCardId(cardId)
      resetAutoCloseTimer()
    },
    [setCurrentCardId, resetAutoCloseTimer]
  )

  // Scroll navigation
  const scrollBy = useCallback(
    (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
        const scrollAmount = direction === 'left' ? -200 : 200
        scrollContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: 'smooth',
        })
        resetAutoCloseTimer()
      }
    },
    [resetAutoCloseTimer]
  )

  // Keyboard navigation within the preview
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        scrollBy('left')
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        scrollBy('right')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, scrollBy])

  // Mouse interaction resets auto-close timer
  const handleMouseEnter = useCallback(() => {
    resetAutoCloseTimer()
  }, [resetAutoCloseTimer])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-50',
        'pointer-events-none',
        'pb-safe' // Safe area for mobile
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Story path preview"
      data-testid="story-path-preview-overlay"
    >
      {/* Overlay panel */}
      <div
        className={cn(
          'pointer-events-auto',
          'mx-4 mb-4 md:mx-8 md:mb-6',
          'bg-card/95 backdrop-blur-md',
          'border-2 border-border',
          'rounded-xl',
          'shadow-[4px_4px_0px_0px_hsl(var(--border))]',
          // Slide-in animation
          'animate-in slide-in-from-bottom-8 fade-in-0 duration-300'
        )}
        onMouseEnter={handleMouseEnter}
        data-testid="story-path-preview-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Map className="w-4 h-4" />
            <span>Story Path</span>
            <span className="text-xs opacity-70">
              ({pathCards.length} card{pathCards.length !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation hint */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">
                &larr;&rarr;
              </kbd>
              <span>Scroll</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono ml-2">
                Esc
              </kbd>
              <span>Close</span>
            </div>

            {/* Close button */}
            <button
              onClick={close}
              className={cn(
                'p-1.5 rounded-md',
                'text-muted-foreground hover:text-foreground',
                'hover:bg-muted/50',
                'transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              )}
              aria-label="Close path preview"
              data-testid="story-path-preview-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Path cards container */}
        <div className="relative">
          {/* Left scroll button */}
          <button
            onClick={() => scrollBy('left')}
            className={cn(
              'absolute left-0 top-0 bottom-0 z-10',
              'w-10 flex items-center justify-center',
              'bg-gradient-to-r from-card via-card/80 to-transparent',
              'text-muted-foreground hover:text-foreground',
              'transition-opacity',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Scroll left"
            data-testid="story-path-preview-scroll-left-btn"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Scrollable path */}
          <div
            ref={scrollContainerRef}
            className={cn(
              'flex items-center gap-3 px-12 py-4',
              'overflow-x-auto scrollbar-thin',
              'scroll-smooth'
            )}
            style={{
              scrollbarWidth: 'thin',
            }}
            data-testid="story-path-preview-scroll-container"
          >
            {/* Connecting line behind cards */}
            <div className="absolute top-1/2 left-12 right-12 h-0.5 bg-border -translate-y-1/2 pointer-events-none" />

            {pathCards.length === 0 ? (
              <div className="flex items-center justify-center w-full py-4 text-muted-foreground text-sm">
                No cards in the story path
              </div>
            ) : (
              pathCards.map((pathCard, index) => (
                <div
                  key={pathCard.card.id}
                  ref={pathCard.isCurrentCard ? currentCardRef : undefined}
                  className="relative z-1"
                >
                  <PathCardThumbnail
                    pathCard={pathCard}
                    onClick={() => handleCardClick(pathCard.card.id)}
                    index={index}
                  />

                  {/* Arrow connector between cards */}
                  {index < pathCards.length - 1 && (
                    <div
                      className={cn(
                        'absolute top-1/2 -right-3 w-3 h-0.5',
                        'bg-border',
                        '-translate-y-1/2'
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Right scroll button */}
          <button
            onClick={() => scrollBy('right')}
            className={cn(
              'absolute right-0 top-0 bottom-0 z-10',
              'w-10 flex items-center justify-center',
              'bg-gradient-to-l from-card via-card/80 to-transparent',
              'text-muted-foreground hover:text-foreground',
              'transition-opacity',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Scroll right"
            data-testid="story-path-preview-scroll-right-btn"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Footer with auto-close indicator */}
        <div className="flex items-center justify-center px-4 py-2 border-t border-border">
          <div className="text-xs text-muted-foreground opacity-70">
            Auto-closes in a few seconds
          </div>
        </div>
      </div>
    </div>
  )
}
