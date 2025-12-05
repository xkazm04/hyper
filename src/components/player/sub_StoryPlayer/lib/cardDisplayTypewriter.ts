'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// Typewriter Hook - Animates text appearance (player mode only)
// ============================================================================

export function useTypewriter(text: string | null, enabled: boolean, speed: number = 25) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const previousTextRef = useRef<string | null>(null)

  useEffect(() => {
    // Reset when text changes
    if (text !== previousTextRef.current) {
      previousTextRef.current = text
      setDisplayedText('')
      setIsComplete(false)
    }

    // Disabled = show all text immediately (used for preview mode)
    if (!text || !enabled) {
      setDisplayedText(text || '')
      setIsComplete(true)
      return
    }

    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(intervalId)
      }
    }, speed)

    return () => clearInterval(intervalId)
  }, [text, enabled, speed])

  const skip = useCallback(() => {
    if (text) {
      setDisplayedText(text)
      setIsComplete(true)
    }
  }, [text])

  return { displayedText, isComplete, skip }
}
