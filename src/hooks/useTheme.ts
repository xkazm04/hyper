'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useCallback, useMemo, useEffect, useState } from 'react'
import { ThemeName, ThemeConfig, themes, defaultTheme } from '@/lib/theme/theme-config'

/**
 * Theme context type definition (matches original API for backward compatibility)
 */
export interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  availableThemes: ThemeConfig[]
}

/**
 * Type guard to validate if a string is a valid theme name
 */
const isValidTheme = (theme: string | undefined): theme is ThemeName => {
  return theme !== undefined && themes.some(t => t.name === theme)
}

/**
 * Compatibility hook wrapping next-themes to match original useTheme API
 *
 * This hook provides the same interface as the original ThemeContext's useTheme hook,
 * ensuring all existing components continue working without modification.
 *
 * @returns Theme context containing current theme, setTheme, toggleTheme, and availableThemes
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { theme, setTheme, toggleTheme } = useTheme()
 *
 *   return (
 *     <div>
 *       <p>Current theme: {theme}</p>
 *       <button onClick={toggleTheme}>Toggle Theme</button>
 *       <button onClick={() => setTheme('halloween')}>Halloween Mode</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTheme(): ThemeContextType {
  const { theme: nextTheme, setTheme: setNextTheme, resolvedTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use resolvedTheme when mounted, fallback to defaultTheme during SSR
  const currentTheme: ThemeName = useMemo(() => {
    if (!mounted) return defaultTheme
    const themeToUse = resolvedTheme || nextTheme
    return isValidTheme(themeToUse) ? themeToUse : defaultTheme
  }, [mounted, resolvedTheme, nextTheme])

  const setTheme = useCallback((newTheme: ThemeName) => {
    setNextTheme(newTheme)
  }, [setNextTheme])

  const toggleTheme = useCallback(() => {
    const currentIndex = themes.findIndex(t => t.name === currentTheme)
    const nextIndex = (currentIndex + 1) % themes.length
    setNextTheme(themes[nextIndex].name)
  }, [currentTheme, setNextTheme])

  return useMemo(() => ({
    theme: currentTheme,
    setTheme,
    toggleTheme,
    availableThemes: themes
  }), [currentTheme, setTheme, toggleTheme])
}
