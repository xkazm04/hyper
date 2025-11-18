'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeName, ThemeConfig, themes, defaultTheme } from '@/lib/theme/theme-config'

/**
 * Theme context type definition
 * @property {ThemeName} theme - Current active theme name
 * @property {Function} setTheme - Function to set a specific theme
 * @property {Function} toggleTheme - Function to cycle through available themes
 * @property {ThemeConfig[]} availableThemes - Array of all available theme configurations
 */
interface ThemeContextType {
  theme: ThemeName
  setTheme: (theme: ThemeName) => void
  toggleTheme: () => void
  availableThemes: ThemeConfig[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

/** localStorage key for persisting theme preference */
const STORAGE_KEY = 'theme-preference'

/**
 * Type guard to validate if a string is a valid theme name
 * @param theme - String to validate
 * @returns True if the theme name exists in the themes configuration
 */
const isValidTheme = (theme: string): theme is ThemeName => {
  return themes.some(t => t.name === theme)
}

/**
 * Loads the saved theme preference from localStorage
 * @returns The saved theme if valid, otherwise returns the default theme
 * @remarks Handles SSR by checking for window object and catches localStorage errors
 */
const loadTheme = (): ThemeName => {
  try {
    if (typeof window === 'undefined') return defaultTheme
    
    const savedTheme = localStorage.getItem(STORAGE_KEY)
    if (savedTheme && isValidTheme(savedTheme)) {
      return savedTheme
    }
  } catch (error) {
    console.warn('Failed to load theme preference:', error)
  }
  return defaultTheme
}

/**
 * Saves the theme preference to localStorage
 * @param theme - Theme name to save
 * @remarks Catches and logs localStorage errors (e.g., quota exceeded, private browsing)
 */
const saveTheme = (theme: ThemeName): void => {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Failed to save theme preference:', error)
  }
}

/**
 * ThemeProvider component that manages theme state and persistence
 * 
 * Features:
 * - Loads theme from localStorage on mount
 * - Applies theme to HTML element via className
 * - Manages smooth transitions between themes
 * - Prevents flash of unstyled content (FOUC) on initial load
 * - Persists theme selection across sessions
 * - Optimized for performance with minimal re-renders
 * 
 * @example
 * ```tsx
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 * ```
 * 
 * @remarks
 * - Uses 'no-transitions' class on initial load to prevent FOUC
 * - Uses 'theme-transitioning' class during theme changes for smooth animations
 * - Respects prefers-reduced-motion via CSS media query
 * - Memoizes context value to prevent unnecessary re-renders
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    // Initialize with saved theme to avoid flash
    if (typeof window !== 'undefined') {
      return loadTheme()
    }
    return defaultTheme
  })
  const [mounted, setMounted] = useState(false)

  // Load theme on mount (only for SSR hydration)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply theme to HTML element with optimized DOM manipulation
  useEffect(() => {
    const startTime = performance.now()
    
    if (!mounted) {
      // On initial load, disable transitions to prevent FOUC
      const html = document.documentElement
      html.classList.add('no-transitions')
      html.className = `${theme} no-transitions`
      
      // Force reflow to ensure no-transitions is applied
      void html.offsetHeight
      
      // Remove no-transitions after a brief delay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          html.classList.remove('no-transitions')
          
          // Log initial theme application time
          const endTime = performance.now()
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Theme] Initial load: ${(endTime - startTime).toFixed(2)}ms`)
          }
        })
      })
    } else {
      // On theme change, enable transitions
      const html = document.documentElement
      html.classList.add('theme-transitioning')
      html.className = `${theme} theme-transitioning`
      
      // Remove transitioning class after transition completes (200ms + buffer)
      const timeout = setTimeout(() => {
        html.classList.remove('theme-transitioning')
        
        // Log theme switch time
        const endTime = performance.now()
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Theme] Switch to '${theme}': ${(endTime - startTime).toFixed(2)}ms`)
        }
      }, 250)
      
      return () => clearTimeout(timeout)
    }
  }, [theme, mounted])

  // Memoize setTheme to prevent recreating on every render
  const setTheme = React.useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme)
    saveTheme(newTheme)
  }, [])

  // Memoize toggleTheme to prevent recreating on every render
  const toggleTheme = React.useCallback(() => {
    const currentIndex = themes.findIndex(t => t.name === theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex].name)
  }, [theme, setTheme])

  // Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo<ThemeContextType>(() => ({
    theme,
    setTheme,
    toggleTheme,
    availableThemes: themes
  }), [theme, setTheme, toggleTheme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook for consuming theme context
 * 
 * @returns Theme context containing current theme, setTheme, toggleTheme, and availableThemes
 * @throws Error if used outside of ThemeProvider
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
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
