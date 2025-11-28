'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/** Storage key for persisting high contrast preference */
const STORAGE_KEY = 'high-contrast-preference'

/** Media query for system high contrast preference */
const HIGH_CONTRAST_MEDIA_QUERY = '(prefers-contrast: more)'

/** Forced colors media query (Windows High Contrast Mode) */
const FORCED_COLORS_MEDIA_QUERY = '(forced-colors: active)'

export type HighContrastMode = 'off' | 'on' | 'system'

export interface UseHighContrastReturn {
  /** Current high contrast mode setting */
  mode: HighContrastMode
  /** Whether high contrast is currently active (resolved from mode + system preference) */
  isHighContrast: boolean
  /** Whether system prefers high contrast */
  systemPrefersHighContrast: boolean
  /** Set the high contrast mode */
  setMode: (mode: HighContrastMode) => void
  /** Toggle between off and on (ignoring system) */
  toggle: () => void
}

/**
 * Get initial mode from localStorage
 */
function getInitialMode(): HighContrastMode {
  if (typeof window === 'undefined') return 'system'
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && ['off', 'on', 'system'].includes(saved)) {
      return saved as HighContrastMode
    }
  } catch {
    // Ignore localStorage errors
  }
  return 'system'
}

/**
 * Hook for detecting and managing high contrast preferences
 *
 * Detects:
 * - prefers-contrast: more (CSS media query)
 * - forced-colors: active (Windows High Contrast Mode)
 * - User manual preference stored in localStorage
 *
 * @returns Object with high contrast state and controls
 */
export function useHighContrast(): UseHighContrastReturn {
  const [mode, setModeState] = useState<HighContrastMode>(getInitialMode)
  const [systemPrefersHighContrast, setSystemPrefersHighContrast] = useState(false)
  const mountedRef = useRef(typeof window !== 'undefined')

  // Detect system preference
  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefersContrast = window.matchMedia(HIGH_CONTRAST_MEDIA_QUERY)
    const forcedColors = window.matchMedia(FORCED_COLORS_MEDIA_QUERY)

    const updateSystemPreference = () => {
      setSystemPrefersHighContrast(prefersContrast.matches || forcedColors.matches)
    }

    updateSystemPreference()

    // Listen for changes
    prefersContrast.addEventListener('change', updateSystemPreference)
    forcedColors.addEventListener('change', updateSystemPreference)

    return () => {
      prefersContrast.removeEventListener('change', updateSystemPreference)
      forcedColors.removeEventListener('change', updateSystemPreference)
    }
  }, [])

  // Calculate effective high contrast state
  const isHighContrast =
    mode === 'on' || (mode === 'system' && systemPrefersHighContrast)

  // Apply high contrast class to document
  useEffect(() => {
    if (!mountedRef.current) return

    const html = document.documentElement

    if (isHighContrast) {
      html.classList.add('high-contrast')
      html.setAttribute('data-high-contrast', 'true')
    } else {
      html.classList.remove('high-contrast')
      html.removeAttribute('data-high-contrast')
    }
  }, [isHighContrast])

  // Save preference to localStorage
  const setMode = useCallback((newMode: HighContrastMode) => {
    setModeState(newMode)
    try {
      localStorage.setItem(STORAGE_KEY, newMode)
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Toggle between off and on
  const toggle = useCallback(() => {
    setMode(isHighContrast ? 'off' : 'on')
  }, [isHighContrast, setMode])

  return {
    mode,
    isHighContrast,
    systemPrefersHighContrast,
    setMode,
    toggle
  }
}
