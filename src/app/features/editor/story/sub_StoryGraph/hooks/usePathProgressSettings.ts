import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hyper_path_progress_visible'

/**
 * Hook to manage PathProgressBar visibility settings with localStorage persistence
 *
 * @returns Object with isVisible state and toggle function
 */
export function usePathProgressSettings() {
  // Default to visible
  const [isVisible, setIsVisible] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored !== null) {
          setIsVisible(stored === 'true')
        }
      } catch {
        // Ignore localStorage errors
      }
      setIsLoaded(true)
    }
  }, [])

  // Persist to localStorage when visibility changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, String(isVisible))
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [isVisible, isLoaded])

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev)
  }, [])

  return {
    isVisible,
    toggleVisibility,
    isLoaded,
  }
}
