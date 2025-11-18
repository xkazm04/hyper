'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

/**
 * ThemeToggle component - A button that allows users to cycle through available themes
 * Features:
 * - Displays current theme icon
 * - Cycles through themes on click
 * - Retro aesthetic with border and shadow effects
 * - Accessible with keyboard navigation and screen reader support
 * - Minimum 44x44px touch target
 */
export function ThemeToggle() {
  const { theme, toggleTheme, availableThemes } = useTheme()
  const [announcement, setAnnouncement] = useState('')

  // Get current and next theme for accessibility labels
  const currentThemeIndex = availableThemes.findIndex(t => t.name === theme)
  const currentTheme = availableThemes[currentThemeIndex]
  const nextThemeIndex = (currentThemeIndex + 1) % availableThemes.length
  const nextTheme = availableThemes[nextThemeIndex]

  const handleToggle = () => {
    toggleTheme()
    // Announce theme change to screen readers
    setAnnouncement(`Switched to ${nextTheme.label} theme`)
  }

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [announcement])

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={`Switch to ${nextTheme.label} theme. Current theme: ${currentTheme.label}`}
        className={cn(
          // Base styles - retro aesthetic
          'relative inline-flex items-center justify-center',
          'min-w-[44px] min-h-[44px] w-11 h-11',
          'rounded-md',
          // Retro border and shadow effects
          'border-2 border-border',
          'shadow-[2px_2px_0px_0px_hsl(var(--border))]',
          // Background and text colors
          'bg-background text-foreground',
          // Hover state
          'hover:bg-muted hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]',
          'hover:-translate-x-px hover:-translate-y-px',
          // Active state
          'active:shadow-[1px_1px_0px_0px_hsl(var(--border))]',
          'active:translate-x-px active:translate-y-px',
          // Focus state - visible in both themes
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          // Transitions
          'transition-all duration-150 ease-in-out',
          // Cursor
          'cursor-pointer',
          // Disabled state
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'disabled:hover:translate-x-0 disabled:hover:translate-y-0'
        )}
        type="button"
      >
        {/* Theme icon */}
        <span 
          className="text-2xl leading-none select-none" 
          aria-hidden="true"
        >
          {currentTheme.icon}
        </span>
        
        {/* Screen reader only text for current theme */}
        <span className="sr-only">
          {currentTheme.label} theme active
        </span>
      </button>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </>
  )
}
