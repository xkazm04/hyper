'use client'

import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { ThemeRipple, useThemeRipple, RippleDirection } from './ThemeRipple'

/**
 * ThemeToggle component - A button that allows users to cycle through available themes
 * Features:
 * - Displays current theme icon
 * - Cycles through themes on click
 * - Retro aesthetic with border and shadow effects
 * - Accessible with keyboard navigation and screen reader support
 * - Minimum 44x44px touch target
 * - Circular ripple animation on theme change
 * - Hydration-safe with mounted state check
 */
export function ThemeToggle() {
  const { theme, toggleTheme, availableThemes } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const { rippleProps, triggerRipple } = useThemeRipple()

  // Hydration safety: wait for client-side mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Clear announcement after it's been read
  // NOTE: This must be before any conditional returns to follow Rules of Hooks
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [announcement])

  // Get current and next theme for accessibility labels
  const currentThemeIndex = availableThemes.findIndex(t => t.name === theme)
  const currentTheme = availableThemes[currentThemeIndex]
  const nextThemeIndex = (currentThemeIndex + 1) % availableThemes.length
  const nextTheme = availableThemes[nextThemeIndex]

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Determine ripple direction based on current theme
    // If current theme is light, we're going to dark/halloween
    const rippleDirection: RippleDirection = theme === 'light' ? 'to-dark' : 'to-light'

    // Trigger the ripple animation from the click position
    triggerRipple(e, rippleDirection)

    toggleTheme()
    // Announce theme change to screen readers
    setAnnouncement(`Switched to ${nextTheme.label} theme`)
  }

  // Prevent hydration mismatch by showing placeholder during SSR
  if (!mounted) {
    return (
      <button
        className={cn(
          'relative inline-flex items-center justify-center',
          'min-w-[44px] min-h-[44px] w-11 h-11',
          'rounded-md',
          'border-2 border-border',
          'shadow-[2px_2px_0px_0px_hsl(var(--border))]',
          'bg-background text-foreground'
        )}
        disabled
        aria-label="Loading theme toggle"
        type="button"
      >
        <span className="text-2xl leading-none select-none opacity-50" aria-hidden="true">
          {availableThemes[0]?.icon ?? '☀️'}
        </span>
      </button>
    )
  }

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={`Switch to ${nextTheme.label} theme. Current theme: ${currentTheme.label}`}
        data-testid="theme-toggle-btn"
        className={cn(
          // Base styles - retro aesthetic with WCAG 44px touch target
          'relative inline-flex items-center justify-center touch-manipulation',
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
          data-testid="theme-toggle-icon"
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
        data-testid="theme-toggle-announcement"
      >
        {announcement}
      </div>

      {/* Theme ripple animation overlay */}
      <ThemeRipple {...rippleProps} />
    </>
  )
}
