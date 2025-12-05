'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { StoryStack } from '@/lib/types'
import { useCardContrastRef } from '@/app/features/accessibility'
import { useLazyCardLoader } from './sub_StoryPlayer/useLazyCardLoader'
import {
  PlayerControls,
  KeyboardHelpTooltip,
  PlayerContent,
  PlayerProgress,
  LoadingState,
  EmptyState
} from './sub_StoryPlayer'

interface StoryPlayerProps {
  stack: StoryStack
}

/**
 * StoryPlayer - Interactive story player with lazy card loading
 *
 * Performance optimizations:
 * - Loads only the current card + choices on initial load (not all cards)
 * - Prefetches 1-2 cards ahead based on choice targets
 * - Caches visited cards in memory for instant back-navigation
 *
 * This enables smooth playback of stories with 100+ cards without
 * loading megabytes of content the user may never see.
 */
export default function StoryPlayer({ stack }: StoryPlayerProps) {
  // Lazy card loader with caching and prefetching
  const {
    currentCardData,
    loading,
    error,
    loadCard,
    loadFirstCard,
    prefetchChoiceTargets,
    getCachedCard,
    cacheSize
  } = useLazyCardLoader()

  // Navigation history for back button
  const [history, setHistory] = useState<string[]>([])

  // Keyboard navigation state
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)

  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const storyCardRef = useCardContrastRef<HTMLDivElement>()

  // Extract current card and choices from lazy loader
  const currentCard = currentCardData?.card ?? null
  const choices = currentCardData?.choices ?? []

  // Load first card on mount
  useEffect(() => {
    loadFirstCard(stack.id, stack.firstCardId)
  }, [stack.id, stack.firstCardId, loadFirstCard])

  // Prefetch choice targets when current card changes
  useEffect(() => {
    if (choices.length > 0) {
      prefetchChoiceTargets(choices)
    }
  }, [choices, prefetchChoiceTargets])

  // Reset selected choice index when choices change
  useEffect(() => {
    setSelectedChoiceIndex(0)
  }, [choices])

  // Handle choice click - navigate to target card
  const handleChoiceClick = useCallback((targetCardId: string) => {
    if (currentCard) {
      // Add current card to history for back navigation
      setHistory(prev => [...prev, currentCard.id])

      // Update browser history for shareable URLs
      window.history.pushState(
        { cardId: targetCardId, previousCardId: currentCard.id },
        '',
        `#card-${targetCardId}`
      )
    }

    // Load the target card (may be from cache if prefetched)
    loadCard(targetCardId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentCard, loadCard])

  // Handle back button - navigate to previous card
  const handleBack = useCallback(() => {
    if (history.length === 0) return

    const previousCardId = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))

    // Previous card should be in cache for instant navigation
    loadCard(previousCardId)
    window.history.back()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [history, loadCard])

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.cardId) {
        loadCard(event.state.cardId)

        // Update history based on navigation direction
        if (event.state.previousCardId) {
          setHistory(prev => {
            const index = prev.indexOf(event.state.previousCardId)
            return index >= 0 ? prev.slice(0, index + 1) : prev
          })
        }
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [loadCard])

  // Keyboard navigation handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't capture if user is typing in an input
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        if (choices.length > 0) {
          setSelectedChoiceIndex(prev => prev > 0 ? prev - 1 : choices.length - 1)
        }
        break

      case 'ArrowDown':
        event.preventDefault()
        if (choices.length > 0) {
          setSelectedChoiceIndex(prev => prev < choices.length - 1 ? prev + 1 : 0)
        }
        break

      case 'ArrowLeft':
        event.preventDefault()
        if (history.length > 0) handleBack()
        break

      case 'ArrowRight':
      case ' ':
      case 'Enter':
        event.preventDefault()
        if (choices.length > 0 && choices[selectedChoiceIndex]) {
          handleChoiceClick(choices[selectedChoiceIndex].targetCardId)
        }
        break

      case 'Home':
        event.preventDefault()
        // Go to first card
        if (currentCard?.id !== stack.firstCardId) {
          setHistory([])
          loadFirstCard(stack.id, stack.firstCardId)
          if (stack.firstCardId) {
            window.history.pushState({ cardId: stack.firstCardId }, '', `#card-${stack.firstCardId}`)
          }
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        break

      case 'End':
        event.preventDefault()
        // If at a dead end (no choices), restart
        if (choices.length === 0 && history.length > 0) {
          setHistory([])
          loadFirstCard(stack.id, stack.firstCardId)
          if (stack.firstCardId) {
            window.history.pushState({ cardId: stack.firstCardId }, '', `#card-${stack.firstCardId}`)
          }
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        break

      case '?':
        event.preventDefault()
        setShowKeyboardHelp(prev => !prev)
        break

      case 'Escape':
        event.preventDefault()
        setShowKeyboardHelp(false)
        break
    }
  }, [choices, selectedChoiceIndex, history, currentCard, stack.id, stack.firstCardId, handleBack, handleChoiceClick, loadFirstCard])

  // Attach keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Loading state
  if (loading && !currentCard) return <LoadingState />

  // Error state
  if (error) {
    return (
      <div
        className="min-h-screen bg-gradient-theme flex items-center justify-center p-4"
        data-testid="story-player-error"
      >
        <div className="text-center text-destructive">
          <p className="text-lg font-semibold mb-2">Failed to load story</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => loadFirstCard(stack.id, stack.firstCardId)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="retry-load-btn"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Empty state (no cards)
  if (!currentCard) return <EmptyState />

  return (
    <div
      className="min-h-screen bg-gradient-theme halloween-fog"
      ref={containerRef}
      tabIndex={-1}
      data-testid="story-player"
    >
      <PlayerControls
        showKeyboardHelp={showKeyboardHelp}
        onToggleKeyboardHelp={() => setShowKeyboardHelp(prev => !prev)}
      />

      {showKeyboardHelp && (
        <KeyboardHelpTooltip onClose={() => setShowKeyboardHelp(false)} />
      )}

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 lg:py-12">
        <PlayerContent
          ref={storyCardRef}
          currentCard={currentCard}
          choices={choices}
          selectedChoiceIndex={selectedChoiceIndex}
          onChoiceClick={handleChoiceClick}
        />

        <PlayerProgress
          stack={stack}
          historyLength={history.length}
          onBack={handleBack}
        />
      </div>

      {/* Debug info in development - shows cache stats */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="fixed bottom-4 left-4 text-xs text-muted-foreground/50 bg-background/80 px-2 py-1 rounded"
          data-testid="cache-debug-info"
        >
          Cache: {cacheSize} cards
        </div>
      )}
    </div>
  )
}
