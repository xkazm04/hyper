'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getMoodColors, defaultMoodColors, MoodColors } from '@/lib/services/mood'
import { StoryCard, StoryStack } from '@/lib/types'

/**
 * Custom hook for mood-based theme synchronization
 *
 * Analyzes story content (images and title) to dynamically adjust
 * the editor's color palette with smooth CSS transitions.
 */

interface UseMoodThemeOptions {
  /** Story stack containing title for sentiment analysis */
  storyStack: StoryStack | null
  /** Array of story cards for finding first card image */
  storyCards: StoryCard[]
  /** Whether the feature is enabled */
  enabled?: boolean
  /** Debounce delay in ms for color updates */
  debounceMs?: number
}

interface UseMoodThemeResult {
  /** Current mood colors being applied */
  moodColors: MoodColors
  /** Whether mood colors are being calculated */
  isLoading: boolean
  /** Reset to default colors */
  resetToDefault: () => void
  /** Manually trigger color extraction */
  refresh: () => void
}

/**
 * CSS custom property names for mood colors
 * These are applied in addition to the base theme colors
 */
const MOOD_CSS_VARS = {
  '--mood-primary': 'primary',
  '--mood-secondary': 'secondary',
  '--mood-muted': 'muted',
  '--mood-accent': 'accent',
} as const

/**
 * Apply mood colors to CSS custom properties with smooth transition
 */
function applyMoodColors(colors: MoodColors): void {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  // Add transitioning class for smooth animation
  root.classList.add('mood-transitioning')

  // Set mood-specific CSS variables
  root.style.setProperty('--mood-primary', colors.primary)
  root.style.setProperty('--mood-secondary', colors.secondary)
  root.style.setProperty('--mood-muted', colors.muted)
  root.style.setProperty('--mood-accent', colors.accent)

  // Also set the accent color to influence primary elements
  // This creates a more immersive mood effect
  root.style.setProperty('--accent', colors.primary)
  root.style.setProperty('--ring', colors.primary)

  // Remove transitioning class after animation
  setTimeout(() => {
    root.classList.remove('mood-transitioning')
  }, 400)
}

/**
 * Remove mood colors and reset to theme defaults
 */
function clearMoodColors(): void {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  root.classList.add('mood-transitioning')

  // Remove mood-specific properties
  root.style.removeProperty('--mood-primary')
  root.style.removeProperty('--mood-secondary')
  root.style.removeProperty('--mood-muted')
  root.style.removeProperty('--mood-accent')
  root.style.removeProperty('--accent')
  root.style.removeProperty('--ring')

  setTimeout(() => {
    root.classList.remove('mood-transitioning')
  }, 400)
}

/**
 * Hook to sync editor theme with story mood
 */
export function useMoodTheme({
  storyStack,
  storyCards,
  enabled = true,
  debounceMs = 500,
}: UseMoodThemeOptions): UseMoodThemeResult {
  const [moodColors, setMoodColors] = useState<MoodColors>(defaultMoodColors)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // Find the first card's image for color extraction
  const firstCard = storyCards.find(
    (card) => card.id === storyStack?.firstCardId
  ) || storyCards[0]

  const imageUrl = firstCard?.imageUrl
  const title = storyStack?.name || ''

  const updateColors = useCallback(async () => {
    if (!enabled || !mountedRef.current) return

    setIsLoading(true)

    try {
      const colors = await getMoodColors(imageUrl, title)

      if (mountedRef.current) {
        setMoodColors(colors)
        applyMoodColors(colors)

        if (process.env.NODE_ENV === 'development') {
          console.log('[Mood Theme] Applied colors:', colors)
        }
      }
    } catch (error) {
      console.warn('[Mood Theme] Failed to update colors:', error)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [enabled, imageUrl, title])

  // Debounced color update when dependencies change
  useEffect(() => {
    if (!enabled) {
      clearMoodColors()
      return
    }

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the color update
    debounceRef.current = setTimeout(() => {
      updateColors()
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [enabled, imageUrl, title, debounceMs, updateColors])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      clearMoodColors()
    }
  }, [])

  const resetToDefault = useCallback(() => {
    setMoodColors(defaultMoodColors)
    clearMoodColors()
  }, [])

  const refresh = useCallback(() => {
    updateColors()
  }, [updateColors])

  return {
    moodColors,
    isLoading,
    resetToDefault,
    refresh,
  }
}

export type { MoodColors }
