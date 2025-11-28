'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { ColorTokenResolver } from './lib/color-token-resolver'

/** Storage key for persisting high contrast preference */
const STORAGE_KEY = 'high-contrast-preference'

/** Media query for system high contrast preference */
const HIGH_CONTRAST_MEDIA_QUERY = '(prefers-contrast: more)'

/** Forced colors media query (Windows High Contrast Mode) */
const FORCED_COLORS_MEDIA_QUERY = '(forced-colors: active)'

export type HighContrastMode = 'off' | 'on' | 'system'

interface HighContrastContextType {
  /** Current high contrast mode setting */
  mode: HighContrastMode
  /** Whether high contrast is currently active */
  isHighContrast: boolean
  /** Whether system prefers high contrast */
  systemPrefersHighContrast: boolean
  /** Set the high contrast mode */
  setMode: (mode: HighContrastMode) => void
  /** Toggle between off and on */
  toggle: () => void
  /** Whether preview mode is active */
  isPreviewMode: boolean
  /** Enable preview mode */
  enablePreview: () => void
  /** Disable preview mode */
  disablePreview: () => void
  /** Apply preview changes */
  applyPreview: () => void
}

const HighContrastContext = createContext<HighContrastContextType | undefined>(undefined)

interface HighContrastProviderProps {
  children: React.ReactNode
  /** Current theme name from ThemeContext */
  theme?: string
}

/**
 * Get initial mounted state (client-side only)
 */
function getInitialMounted(): boolean {
  return typeof window !== 'undefined'
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
 * HighContrastProvider
 *
 * Provides high contrast accessibility features throughout the app.
 * Detects system preferences and manages user overrides.
 */
export function HighContrastProvider({ children, theme = 'light' }: HighContrastProviderProps) {
  const [mode, setModeState] = useState<HighContrastMode>(getInitialMode)
  const [systemPrefersHighContrast, setSystemPrefersHighContrast] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const mountedRef = useRef(getInitialMounted())

  const isDarkTheme = theme === 'halloween'

  // Detect system preference
  useEffect(() => {
    if (typeof window === 'undefined') return

    const prefersContrast = window.matchMedia(HIGH_CONTRAST_MEDIA_QUERY)
    const forcedColors = window.matchMedia(FORCED_COLORS_MEDIA_QUERY)

    const updateSystemPreference = () => {
      setSystemPrefersHighContrast(prefersContrast.matches || forcedColors.matches)
    }

    updateSystemPreference()

    prefersContrast.addEventListener('change', updateSystemPreference)
    forcedColors.addEventListener('change', updateSystemPreference)

    return () => {
      prefersContrast.removeEventListener('change', updateSystemPreference)
      forcedColors.removeEventListener('change', updateSystemPreference)
    }
  }, [])

  // Calculate effective high contrast state
  const isHighContrast = useMemo(() => {
    if (isPreviewMode) return true
    return mode === 'on' || (mode === 'system' && systemPrefersHighContrast)
  }, [mode, systemPrefersHighContrast, isPreviewMode])

  // Apply high contrast CSS variables
  useEffect(() => {
    if (!mountedRef.current) return

    const html = document.documentElement

    if (isHighContrast) {
      html.classList.add('high-contrast')
      html.setAttribute('data-high-contrast', 'true')

      // Create and apply resolver
      const resolver = new ColorTokenResolver(isDarkTheme, true)
      resolver.applyToElement(html)
    } else {
      html.classList.remove('high-contrast')
      html.removeAttribute('data-high-contrast')

      // Remove custom properties
      const resolver = new ColorTokenResolver(isDarkTheme, false)
      resolver.removeFromElement(html)
    }
  }, [isHighContrast, isDarkTheme])

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
    const newMode = isHighContrast ? 'off' : 'on'
    setMode(newMode)
  }, [isHighContrast, setMode])

  // Preview mode controls
  const enablePreview = useCallback(() => {
    setIsPreviewMode(true)
  }, [])

  const disablePreview = useCallback(() => {
    setIsPreviewMode(false)
  }, [])

  const applyPreview = useCallback(() => {
    setIsPreviewMode(false)
    if (mode !== 'on') {
      setMode('on')
    }
  }, [mode, setMode])

  const value = useMemo<HighContrastContextType>(() => ({
    mode,
    isHighContrast,
    systemPrefersHighContrast,
    setMode,
    toggle,
    isPreviewMode,
    enablePreview,
    disablePreview,
    applyPreview
  }), [
    mode,
    isHighContrast,
    systemPrefersHighContrast,
    setMode,
    toggle,
    isPreviewMode,
    enablePreview,
    disablePreview,
    applyPreview
  ])

  return (
    <HighContrastContext.Provider value={value}>
      {children}
    </HighContrastContext.Provider>
  )
}

/**
 * Hook for consuming high contrast context
 */
export function useHighContrastContext(): HighContrastContextType {
  const context = useContext(HighContrastContext)
  if (context === undefined) {
    throw new Error('useHighContrastContext must be used within a HighContrastProvider')
  }
  return context
}
