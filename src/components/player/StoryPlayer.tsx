'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { StoryStack, StoryCard, Choice } from '@/lib/types'
import { StoryService } from '@/lib/services/story'
import { useCardContrastRef } from '@/app/features/accessibility'
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

export default function StoryPlayer({ stack }: StoryPlayerProps) {
  const [currentCard, setCurrentCard] = useState<StoryCard | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [cards, setCards] = useState<StoryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<string[]>([])
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const storyService = new StoryService()
  const containerRef = useRef<HTMLDivElement>(null)
  const storyCardRef = useCardContrastRef<HTMLDivElement>()

  useEffect(() => {
    loadStoryData()
  }, [stack.id])

  const loadStoryData = async () => {
    try {
      setLoading(true)
      const allCards = await storyService.getStoryCards(stack.id)
      setCards(allCards)

      const firstCard = stack.firstCardId 
        ? allCards.find(c => c.id === stack.firstCardId) || allCards[0]
        : allCards[0]

      if (firstCard) {
        await loadCard(firstCard.id, allCards)
      }
    } catch (error) {
      console.error('Failed to load story:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCard = async (cardId: string, allCards?: StoryCard[]) => {
    try {
      const cardsList = allCards || cards
      const card = cardsList.find(c => c.id === cardId) || await storyService.getStoryCard(cardId)
      if (!card) return

      setCurrentCard(card)
      const cardChoices = await storyService.getChoices(cardId)
      setChoices(cardChoices)
    } catch (error) {
      console.error('Failed to load card:', error)
    }
  }

  const handleChoiceClick = (targetCardId: string) => {
    if (currentCard) {
      setHistory(prev => [...prev, currentCard.id])
      window.history.pushState(
        { cardId: targetCardId, previousCardId: currentCard.id },
        '',
        `#card-${targetCardId}`
      )
    }
    loadCard(targetCardId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    if (history.length === 0) return
    const previousCardId = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    loadCard(previousCardId)
    window.history.back()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.cardId) {
        loadCard(event.state.cardId)
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
  }, [cards])

  useEffect(() => {
    setSelectedChoiceIndex(0)
  }, [choices])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
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
        if (cards.length > 0) {
          const firstCard = stack.firstCardId
            ? cards.find(c => c.id === stack.firstCardId) || cards[0]
            : cards[0]
          if (firstCard && currentCard?.id !== firstCard.id) {
            setHistory([])
            loadCard(firstCard.id)
            window.history.pushState({ cardId: firstCard.id }, '', `#card-${firstCard.id}`)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }
        break
      case 'End':
        event.preventDefault()
        if (choices.length === 0 && history.length > 0) {
          const firstCard = stack.firstCardId
            ? cards.find(c => c.id === stack.firstCardId) || cards[0]
            : cards[0]
          if (firstCard) {
            setHistory([])
            loadCard(firstCard.id)
            window.history.pushState({ cardId: firstCard.id }, '', `#card-${firstCard.id}`)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
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
  }, [choices, selectedChoiceIndex, history, cards, currentCard, stack.firstCardId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (loading) return <LoadingState />
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
    </div>
  )
}
