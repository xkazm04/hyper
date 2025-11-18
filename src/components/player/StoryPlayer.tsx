'use client'

import { useState, useEffect } from 'react'
import { StoryStack, StoryCard, Choice } from '@/lib/types'
import { StoryService } from '@/lib/services/story'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface StoryPlayerProps {
  stack: StoryStack
}

export default function StoryPlayer({ stack }: StoryPlayerProps) {
  const [currentCard, setCurrentCard] = useState<StoryCard | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [cards, setCards] = useState<StoryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<string[]>([])
  const storyService = new StoryService()

  useEffect(() => {
    loadStoryData()
  }, [stack.id])

  const loadStoryData = async () => {
    try {
      setLoading(true)
      
      // Load all cards
      const allCards = await storyService.getStoryCards(stack.id)
      setCards(allCards)

      // Find and set the first card
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
      
      // Load choices for this card
      const cardChoices = await storyService.getChoices(cardId)
      setChoices(cardChoices)
    } catch (error) {
      console.error('Failed to load card:', error)
    }
  }

  const handleChoiceClick = (targetCardId: string) => {
    if (currentCard) {
      // Add current card to history
      setHistory(prev => [...prev, currentCard.id])
      
      // Push to browser history
      window.history.pushState(
        { cardId: targetCardId, previousCardId: currentCard.id },
        '',
        `#card-${targetCardId}`
      )
    }
    
    // Navigate to target card
    loadCard(targetCardId)
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    if (history.length === 0) return

    const previousCardId = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))
    loadCard(previousCardId)
    
    // Go back in browser history
    window.history.back()
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.cardId) {
        loadCard(event.state.cardId)
        // Update history state to match browser history
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-theme">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-foreground">Loading story...</div>
        </div>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-theme">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Story not available</h1>
          <p className="text-muted-foreground mb-6">This story doesn't have any cards yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-theme">
      {/* Theme toggle in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Story content */}
        <div className="bg-card rounded-lg shadow-xl overflow-hidden">
          {/* Image */}
          {currentCard.imageUrl && (
            <div className="relative w-full aspect-video bg-muted">
              <Image
                src={currentCard.imageUrl}
                alt={currentCard.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8 lg:p-10">
            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4 sm:mb-6 text-center leading-tight">
              {currentCard.title}
            </h1>

            {/* Story text */}
            <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none mb-6 sm:mb-8">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-center text-sm sm:text-base md:text-lg">
                {currentCard.content}
              </p>
            </div>

            {/* Choices */}
            {choices.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3 mt-6 sm:mt-8">
                {choices.map((choice) => (
                  <Button
                    key={choice.id}
                    onClick={() => handleChoiceClick(choice.targetCardId)}
                    className="w-full py-3 sm:py-4 md:py-5 lg:py-6 text-sm sm:text-base md:text-lg font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation min-h-[44px]"
                  >
                    {choice.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="inline-block px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-muted rounded-lg border-2 border-border">
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-foreground">The End</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">You've reached the end of this story path</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back button */}
        {history.length > 0 && (
          <div className="mt-4 sm:mt-6 text-center">
            <Button
              onClick={handleBack}
              variant="outline"
              className="inline-flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base touch-manipulation min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        )}

        {/* Story info footer */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground px-2">
          <p className="font-medium">{stack.name}</p>
          {stack.description && (
            <p className="mt-1 opacity-70">{stack.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
