'use client'

import { useMemo, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { useHighContrastContext } from '../HighContrastContext'
import { ColorTokenResolver, CardColorMapping } from './color-token-resolver'
import { ContrastInfo, analyzeCardContrast } from './high-contrast-palette'

export interface UseCardContrastReturn {
  /** Whether high contrast mode is active */
  isHighContrast: boolean
  /** Whether the current theme is dark (halloween) */
  isDarkTheme: boolean
  /** Resolved card color mappings */
  cardColors: CardColorMapping[]
  /** Contrast analysis for card token pairs */
  contrastAnalysis: ContrastInfo[]
  /** Whether all card colors meet WCAG AA */
  allMeetWCAGAA: boolean
  /** Tokens that fail WCAG AA requirements */
  failingTokens: ContrastInfo[]
  /** Apply card tokens to an element */
  applyToElement: (element: HTMLElement | null) => void
  /** Remove card tokens from an element */
  removeFromElement: (element: HTMLElement | null) => void
  /** Get CSS for card tokens */
  getCardCSS: () => string
  /** Resolver instance for advanced usage */
  resolver: ColorTokenResolver
}

/**
 * Hook for managing card-specific high contrast colors
 *
 * Provides automatic color token resolution based on theme and high contrast settings.
 * Updates live when settings change.
 */
export function useCardContrast(): UseCardContrastReturn {
  const { theme } = useTheme()
  const { isHighContrast } = useHighContrastContext()

  const isDarkTheme = theme === 'halloween'

  // Create resolver that updates when theme/contrast changes
  const resolver = useMemo(
    () => new ColorTokenResolver(isDarkTheme, isHighContrast),
    [isDarkTheme, isHighContrast]
  )

  // Get card colors
  const cardColors = useMemo(
    () => resolver.resolveCardTokens(),
    [resolver]
  )

  // Get contrast analysis
  const contrastAnalysis = useMemo(
    () => analyzeCardContrast(isDarkTheme, isHighContrast),
    [isDarkTheme, isHighContrast]
  )

  // Check WCAG AA compliance
  const allMeetWCAGAA = useMemo(
    () => contrastAnalysis.every(info => info.meetsAA),
    [contrastAnalysis]
  )

  // Get failing tokens
  const failingTokens = useMemo(
    () => contrastAnalysis.filter(info => !info.meetsAA),
    [contrastAnalysis]
  )

  // Apply to element callback
  const applyToElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      resolver.applyCardTokensToElement(element)
    }
  }, [resolver])

  // Remove from element callback
  const removeFromElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      resolver.removeCardTokensFromElement(element)
    }
  }, [resolver])

  // Get CSS callback
  const getCardCSS = useCallback(() => {
    return resolver.generateCardCSS()
  }, [resolver])

  return {
    isHighContrast,
    isDarkTheme,
    cardColors,
    contrastAnalysis,
    allMeetWCAGAA,
    failingTokens,
    applyToElement,
    removeFromElement,
    getCardCSS,
    resolver
  }
}

/**
 * Hook to apply card contrast tokens to a ref element
 * Automatically updates when settings change
 */
export function useCardContrastRef<T extends HTMLElement>() {
  const { isHighContrast, isDarkTheme, applyToElement, removeFromElement } = useCardContrast()
  const elementRef = useRef<T | null>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    if (isHighContrast) {
      applyToElement(element)
    } else {
      removeFromElement(element)
    }

    return () => {
      removeFromElement(element)
    }
  }, [isHighContrast, isDarkTheme, applyToElement, removeFromElement])

  return elementRef
}

/**
 * Hook to observe and apply contrast settings to dynamically loaded cards
 */
export function useCardContrastObserver(containerSelector: string) {
  const { isHighContrast, resolver } = useCardContrast()
  const observerRef = useRef<MutationObserver | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const container = document.querySelector(containerSelector)
    if (!container) return

    // Apply to existing cards
    const cards = container.querySelectorAll('[data-story-card]')
    cards.forEach(card => {
      if (card instanceof HTMLElement) {
        if (isHighContrast) {
          resolver.applyCardTokensToElement(card)
        } else {
          resolver.removeCardTokensFromElement(card)
        }
      }
    })

    // Observe for new cards
    observerRef.current = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            if (node.hasAttribute('data-story-card')) {
              if (isHighContrast) {
                resolver.applyCardTokensToElement(node)
              }
            }
            // Check descendants
            const cards = node.querySelectorAll('[data-story-card]')
            cards.forEach(card => {
              if (card instanceof HTMLElement && isHighContrast) {
                resolver.applyCardTokensToElement(card)
              }
            })
          }
        })
      })
    })

    observerRef.current.observe(container, {
      childList: true,
      subtree: true
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [containerSelector, isHighContrast, resolver])
}
