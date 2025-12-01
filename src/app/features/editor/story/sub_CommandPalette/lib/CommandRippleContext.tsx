'use client'

/**
 * CommandRippleContext
 *
 * Provides command execution feedback with ripple animations and audio cues.
 * When a command is executed, a ripple propagates from the command palette
 * and highlights the target element (card/outline node).
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react'

interface RippleState {
  isActive: boolean
  originX: number
  originY: number
  targetId: string | null
  commandId: string | null
}

interface CommandRippleContextType {
  rippleState: RippleState
  triggerRipple: (originElement: HTMLElement | null, targetId?: string, commandId?: string) => void
  clearRipple: () => void
  highlightedTargetId: string | null
}

const initialState: RippleState = {
  isActive: false,
  originX: 0,
  originY: 0,
  targetId: null,
  commandId: null,
}

const CommandRippleContext = createContext<CommandRippleContextType | undefined>(undefined)

// Simple soft chime using Web Audio API
function playCommandChime() {
  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    // Create a soft, pleasant chime
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Soft bell-like tone
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
    oscillator.frequency.exponentialRampToValueAtTime(1320, audioContext.currentTime + 0.05) // Quick rise to E6
    oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.1) // Back to A5

    // Very soft volume with quick fade
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.08, audioContext.currentTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.15)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)

    // Clean up
    setTimeout(() => {
      audioContext.close()
    }, 200)
  } catch {
    // Audio not supported or blocked, silently ignore
  }
}

interface CommandRippleProviderProps {
  children: ReactNode
}

export function CommandRippleProvider({ children }: CommandRippleProviderProps) {
  const [rippleState, setRippleState] = useState<RippleState>(initialState)
  const [highlightedTargetId, setHighlightedTargetId] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerRipple = useCallback(
    (originElement: HTMLElement | null, targetId?: string, commandId?: string) => {
      // Clear any existing timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }

      // Calculate origin position from element or use center of screen
      let originX = window.innerWidth / 2
      let originY = window.innerHeight / 3

      if (originElement) {
        const rect = originElement.getBoundingClientRect()
        originX = rect.left + rect.width / 2
        originY = rect.top + rect.height / 2
      }

      // Set ripple state
      setRippleState({
        isActive: true,
        originX,
        originY,
        targetId: targetId || null,
        commandId: commandId || null,
      })

      // Play the soft chime
      playCommandChime()

      // Set highlighted target for card/node highlighting
      if (targetId) {
        setHighlightedTargetId(targetId)

        // Clear highlight after animation completes
        highlightTimeoutRef.current = setTimeout(() => {
          setHighlightedTargetId(null)
        }, 600) // Slightly longer than ripple for smooth transition
      }

      // Clear ripple after animation (200ms as specified)
      timeoutRef.current = setTimeout(() => {
        setRippleState(initialState)
      }, 200)
    },
    []
  )

  const clearRipple = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current)
    }
    setRippleState(initialState)
    setHighlightedTargetId(null)
  }, [])

  return (
    <CommandRippleContext.Provider
      value={{
        rippleState,
        triggerRipple,
        clearRipple,
        highlightedTargetId,
      }}
    >
      {children}
    </CommandRippleContext.Provider>
  )
}

// Default values for when used outside provider (graceful degradation)
const defaultContext: CommandRippleContextType = {
  rippleState: initialState,
  triggerRipple: () => {},
  clearRipple: () => {},
  highlightedTargetId: null,
}

export function useCommandRipple() {
  const context = useContext(CommandRippleContext)
  // Return default context if not wrapped in provider (graceful degradation)
  return context ?? defaultContext
}
