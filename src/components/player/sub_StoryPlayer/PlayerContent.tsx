'use client'

import { forwardRef } from 'react'
import { StoryCard, Choice } from '@/lib/types'
import { CardDisplay } from './CardDisplay'

interface PlayerContentProps {
  currentCard: StoryCard
  choices: Choice[]
  selectedChoiceIndex: number
  onChoiceClick: (targetCardId: string) => void
}

/**
 * PlayerContent - Main story card content with image, title, text, and choices
 *
 * Uses the shared CardDisplay component with 'player' variant
 * for the full-size player layout. Audio autoplay is enabled by default.
 */
export const PlayerContent = forwardRef<HTMLDivElement, PlayerContentProps>(
  function PlayerContent(
    { currentCard, choices, selectedChoiceIndex, onChoiceClick },
    ref
  ) {
    return (
      <CardDisplay
        ref={ref}
        card={currentCard}
        choices={choices}
        selectedChoiceIndex={selectedChoiceIndex}
        onChoiceClick={onChoiceClick}
        variant="player"
        autoplayAudio={true}
        theme={{
          shadowStyle: 'soft',
          choiceBg: 'hsl(var(--card-choice-bg, var(--primary)))',
          choiceText: 'hsl(var(--card-choice-text, var(--primary-foreground)))',
          choiceBorder: 'hsl(var(--card-choice-border, var(--border)))',
        }}
      />
    )
  }
)
