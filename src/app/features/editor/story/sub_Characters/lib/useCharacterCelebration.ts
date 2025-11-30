'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/lib/context/ToastContext'

interface UseCharacterCelebrationResult {
  /** Whether confetti is currently showing */
  isConfettiActive: boolean
  /** Trigger celebration for a newly created character */
  celebrateNewCharacter: (characterName: string) => void
  /** Clear the confetti state */
  clearConfetti: () => void
}

/**
 * Hook that provides celebration effects for character creation
 * Combines confetti burst, toast message, and haptic feedback
 */
export function useCharacterCelebration(): UseCharacterCelebrationResult {
  const [isConfettiActive, setIsConfettiActive] = useState(false)
  const { success } = useToast()

  /**
   * Trigger haptic feedback on supported mobile devices
   */
  const triggerHapticFeedback = useCallback(() => {
    if (typeof navigator === 'undefined') return

    // Use Vibration API for haptic feedback
    if ('vibrate' in navigator) {
      // Short, gentle vibration pattern (similar to iOS success haptic)
      // Pattern: vibrate 30ms, pause 50ms, vibrate 30ms
      navigator.vibrate([30, 50, 30])
    }
  }, [])

  /**
   * Display celebratory toast with character name
   */
  const showCelebrationToast = useCallback((characterName: string) => {
    const displayName = characterName?.trim() || 'a new character'
    success(`You just created ${displayName}!`, 4000)
  }, [success])

  /**
   * Main celebration trigger - activates confetti, toast, and haptics
   */
  const celebrateNewCharacter = useCallback((characterName: string) => {
    // Start confetti animation
    setIsConfettiActive(true)

    // Show toast with character name
    showCelebrationToast(characterName)

    // Trigger haptic feedback on mobile
    triggerHapticFeedback()
  }, [showCelebrationToast, triggerHapticFeedback])

  /**
   * Clear confetti state (called when animation completes)
   */
  const clearConfetti = useCallback(() => {
    setIsConfettiActive(false)
  }, [])

  return {
    isConfettiActive,
    celebrateNewCharacter,
    clearConfetti,
  }
}
