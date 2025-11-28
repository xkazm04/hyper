'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import { StoryCard, Choice } from '@/lib/types'

interface PlayerContentProps {
  currentCard: StoryCard
  choices: Choice[]
  selectedChoiceIndex: number
  onChoiceClick: (targetCardId: string) => void
}

/**
 * PlayerContent - Main story card content with image, title, text, and choices
 */
export const PlayerContent = forwardRef<HTMLDivElement, PlayerContentProps>(
  function PlayerContent(
    { currentCard, choices, selectedChoiceIndex, onChoiceClick },
    ref
  ) {
    return (
      <div
        ref={ref}
        className="bg-card rounded-lg shadow-xl overflow-hidden group"
        data-story-card
        data-testid="story-card-player"
      >
        {/* Image */}
        {currentCard.imageUrl && (
          <div className="relative w-full aspect-video bg-muted overflow-hidden">
            <Image
              src={currentCard.imageUrl}
              alt={currentCard.title}
              fill
              className="object-cover animate-image-zoom transition-transform duration-300"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-6 md:p-8 lg:p-10">
          {/* Title */}
          <h1
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center leading-tight"
            style={{ color: 'hsl(var(--card-title, var(--foreground)))' }}
            data-testid="player-card-title"
          >
            {currentCard.title}
          </h1>

          {/* Story text */}
          <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none mb-6 sm:mb-8">
            <p
              className="leading-relaxed whitespace-pre-wrap text-center text-sm sm:text-base md:text-lg"
              style={{ color: 'hsl(var(--card-content, var(--muted-foreground)))' }}
              data-testid="player-card-content"
            >
              {currentCard.content}
            </p>
          </div>

          {/* Choices */}
          {choices.length > 0 ? (
            <div className="space-y-2.5 sm:space-y-3 mt-6 sm:mt-8" data-testid="player-choices">
              {choices.map((choice, index) => (
                <button
                  key={choice.id}
                  onClick={() => onChoiceClick(choice.targetCardId)}
                  className={`w-full py-3 sm:py-4 md:py-5 lg:py-6 text-sm sm:text-base md:text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] touch-manipulation min-h-[44px] animate-choice-hover border-2 ${
                    index === selectedChoiceIndex
                      ? 'ring-2 ring-offset-2 ring-offset-card'
                      : 'hover:opacity-90'
                  }`}
                  style={{
                    backgroundColor: 'hsl(var(--card-choice-bg, var(--primary)))',
                    color: 'hsl(var(--card-choice-text, var(--primary-foreground)))',
                    borderColor: 'hsl(var(--card-choice-border, var(--border)))',
                    ['--tw-ring-color' as string]: 'hsl(var(--card-choice-bg, var(--primary)))'
                  }}
                  data-testid={`choice-btn-${index}`}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <StoryEndBadge />
          )}
        </div>
      </div>
    )
  }
)

/**
 * StoryEndBadge - Displayed when the story path ends
 */
function StoryEndBadge() {
  return (
    <div className="text-center py-6 sm:py-8" data-testid="story-end">
      <div
        className="inline-block px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg border-2"
        style={{
          backgroundColor: 'hsl(var(--card-end-badge-bg, var(--muted)))',
          borderColor: 'hsl(var(--border))'
        }}
      >
        <p
          className="text-base sm:text-lg md:text-xl font-semibold"
          style={{ color: 'hsl(var(--card-end-badge-text, var(--foreground)))' }}
        >
          The End
        </p>
        <p
          className="text-xs sm:text-sm mt-1 sm:mt-2"
          style={{ color: 'hsl(var(--card-content, var(--muted-foreground)))' }}
        >
          You've reached the end of this story path
        </p>
      </div>
    </div>
  )
}
