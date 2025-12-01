'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'

interface StoryPathPreviewContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  resetAutoCloseTimer: () => void
}

const StoryPathPreviewContext = createContext<StoryPathPreviewContextType | undefined>(
  undefined
)

interface StoryPathPreviewProviderProps {
  children: ReactNode
  autoCloseDelay?: number // milliseconds before auto-close
}

const DEFAULT_AUTO_CLOSE_DELAY = 4000 // 4 seconds

export function StoryPathPreviewProvider({
  children,
  autoCloseDelay = DEFAULT_AUTO_CLOSE_DELAY,
}: StoryPathPreviewProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null)

  const clearAutoCloseTimer = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current)
      autoCloseTimerRef.current = null
    }
  }, [])

  const startAutoCloseTimer = useCallback(() => {
    clearAutoCloseTimer()
    autoCloseTimerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, autoCloseDelay)
  }, [autoCloseDelay, clearAutoCloseTimer])

  const open = useCallback(() => {
    setIsOpen(true)
    startAutoCloseTimer()
  }, [startAutoCloseTimer])

  const close = useCallback(() => {
    setIsOpen(false)
    clearAutoCloseTimer()
  }, [clearAutoCloseTimer])

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev
      if (newState) {
        startAutoCloseTimer()
      } else {
        clearAutoCloseTimer()
      }
      return newState
    })
  }, [startAutoCloseTimer, clearAutoCloseTimer])

  const resetAutoCloseTimer = useCallback(() => {
    if (isOpen) {
      startAutoCloseTimer()
    }
  }, [isOpen, startAutoCloseTimer])

  // Global keyboard shortcut: Ctrl+P (or Cmd+P on Mac)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+P or Cmd+P (NOT Shift, to differentiate from command palette)
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'p'
      ) {
        // Prevent browser print dialog
        event.preventDefault()
        toggle()
      }

      // Close on Escape
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        close()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, toggle, close])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearAutoCloseTimer()
    }
  }, [clearAutoCloseTimer])

  return (
    <StoryPathPreviewContext.Provider
      value={{ isOpen, open, close, toggle, resetAutoCloseTimer }}
    >
      {children}
    </StoryPathPreviewContext.Provider>
  )
}

export function useStoryPathPreview() {
  const context = useContext(StoryPathPreviewContext)
  if (context === undefined) {
    throw new Error(
      'useStoryPathPreview must be used within a StoryPathPreviewProvider'
    )
  }
  return context
}
