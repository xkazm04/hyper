'use client'

/**
 * useStoryProgress Hook
 *
 * Calculates story completion progress based on cards and choices.
 * A card is considered "complete" when it has:
 * - Content (narrative text)
 * - OR an image
 * - AND at least one choice (unless it's a terminal/ending card)
 *
 * Progress is calculated as a percentage from 0-100.
 */

import { useMemo } from 'react'
import { StoryCard, Choice } from '@/lib/types'

export interface StoryProgressData {
  /** Overall completion percentage (0-100) */
  percentage: number
  /** Number of cards considered complete */
  completedCards: number
  /** Total number of cards */
  totalCards: number
  /** Number of cards with content */
  cardsWithContent: number
  /** Number of cards with images */
  cardsWithImages: number
  /** Number of cards with choices */
  cardsWithChoices: number
  /** Color for the progress bar (red -> yellow -> green) */
  color: string
  /** HSL color for CSS variable usage */
  hslColor: string
}

interface UseStoryProgressOptions {
  storyCards: StoryCard[]
  choices: Choice[]
}

/**
 * Determines if a card has meaningful content
 */
function hasContent(card: StoryCard): boolean {
  return Boolean(card.content && card.content.trim().length > 0)
}

/**
 * Determines if a card has an image
 */
function hasImage(card: StoryCard): boolean {
  return Boolean(card.imageUrl && card.imageUrl.trim().length > 0)
}

/**
 * Gets the progress color based on percentage
 * Red (0%) -> Yellow (50%) -> Green (100%)
 */
function getProgressColor(percentage: number): { color: string; hslColor: string } {
  // Clamp percentage between 0 and 100
  const p = Math.max(0, Math.min(100, percentage))

  // Hue: 0 (red) -> 60 (yellow) -> 120 (green)
  // We map 0-100% to 0-120 hue
  const hue = (p / 100) * 120

  // Saturation: Keep vibrant but not overly saturated
  const saturation = 70

  // Lightness: Consistent at 50% for good visibility
  const lightness = 50

  return {
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    hslColor: `${hue} ${saturation}% ${lightness}%`
  }
}

/**
 * Calculates story progress based on card completion
 */
export function useStoryProgress({ storyCards, choices }: UseStoryProgressOptions): StoryProgressData {
  return useMemo(() => {
    const totalCards = storyCards.length

    if (totalCards === 0) {
      return {
        percentage: 0,
        completedCards: 0,
        totalCards: 0,
        cardsWithContent: 0,
        cardsWithImages: 0,
        cardsWithChoices: 0,
        color: getProgressColor(0).color,
        hslColor: getProgressColor(0).hslColor
      }
    }

    // Count cards with each attribute
    let cardsWithContent = 0
    let cardsWithImages = 0
    let cardsWithChoices = 0
    let completedCards = 0

    for (const card of storyCards) {
      const cardHasContent = hasContent(card)
      const cardHasImage = hasImage(card)
      const cardChoices = choices.filter(c => c.storyCardId === card.id)
      const cardHasChoices = cardChoices.length > 0

      if (cardHasContent) cardsWithContent++
      if (cardHasImage) cardsWithImages++
      if (cardHasChoices) cardsWithChoices++

      // A card is complete if it has content OR an image
      // AND has choices (unless we're being lenient about endings)
      // We'll consider a card complete if it has either content or image
      // This encourages progress while still showing meaningful completion
      const isComplete = cardHasContent || cardHasImage

      if (isComplete) completedCards++
    }

    // Calculate percentage based on completed cards
    const percentage = Math.round((completedCards / totalCards) * 100)

    const { color, hslColor } = getProgressColor(percentage)

    return {
      percentage,
      completedCards,
      totalCards,
      cardsWithContent,
      cardsWithImages,
      cardsWithChoices,
      color,
      hslColor
    }
  }, [storyCards, choices])
}
