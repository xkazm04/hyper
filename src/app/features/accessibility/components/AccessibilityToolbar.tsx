'use client'

import { useHighContrastContext } from '../HighContrastContext'
import { cn } from '@/lib/utils'
import { Contrast } from 'lucide-react'
import { useState, useEffect } from 'react'

/**
 * AccessibilityToolbar - High Contrast Toggle Button
 *
 * A compact toggle button for enabling/disabling high contrast mode.
 * Designed to be placed alongside the theme toggle.
 */
export function AccessibilityToolbar() {
  const { mode, isHighContrast, systemPrefersHighContrast, toggle } = useHighContrastContext()
  const [announcement, setAnnouncement] = useState('')

  const handleToggle = () => {
    toggle()
    const newState = !isHighContrast
    setAnnouncement(
      newState
        ? 'High contrast mode enabled'
        : 'High contrast mode disabled'
    )
  }

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(''), 1000)
      return () => clearTimeout(timer)
    }
  }, [announcement])

  const getLabel = () => {
    if (mode === 'system') {
      return systemPrefersHighContrast
        ? 'Disable high contrast (currently following system: on)'
        : 'Enable high contrast (currently following system: off)'
    }
    return isHighContrast
      ? 'Disable high contrast mode'
      : 'Enable high contrast mode'
  }

  return (
    <>
      <button
        onClick={handleToggle}
        aria-label={getLabel()}
        aria-pressed={isHighContrast}
        data-testid="high-contrast-toggle-btn"
        className={cn(
          // Base styles - matching ThemeToggle aesthetic
          'relative inline-flex items-center justify-center',
          'min-w-[44px] min-h-[44px] w-11 h-11',
          'rounded-md',
          // Retro border and shadow effects
          'border-2 border-border',
          'shadow-[2px_2px_0px_0px_hsl(var(--border))]',
          // Background and text colors
          isHighContrast ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground',
          // Hover state
          'hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]',
          'hover:-translate-x-px hover:-translate-y-px',
          isHighContrast ? 'hover:bg-primary/90' : 'hover:bg-muted',
          // Active state
          'active:shadow-[1px_1px_0px_0px_hsl(var(--border))]',
          'active:translate-x-px active:translate-y-px',
          // Focus state
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-ring focus-visible:ring-offset-2',
          'focus-visible:ring-offset-background',
          // Transitions
          'transition-all duration-150 ease-in-out',
          // Cursor
          'cursor-pointer'
        )}
        type="button"
      >
        <Contrast
          className="w-5 h-5"
          aria-hidden="true"
          data-testid="high-contrast-toggle-icon"
        />

        <span className="sr-only">
          High contrast {isHighContrast ? 'enabled' : 'disabled'}
        </span>
      </button>

      {/* Live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="high-contrast-announcement"
      >
        {announcement}
      </div>
    </>
  )
}

/**
 * HighContrastModeSelector - Full mode selector with system option
 *
 * Provides a three-state toggle: Off, System, On
 * For use in settings panels or accessibility preferences.
 */
export function HighContrastModeSelector({ className = '' }: { className?: string }) {
  const { mode, isHighContrast, systemPrefersHighContrast, setMode } = useHighContrastContext()

  const modes = [
    { value: 'off' as const, label: 'Off' },
    { value: 'system' as const, label: 'System' },
    { value: 'on' as const, label: 'On' }
  ]

  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid="high-contrast-mode-selector">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-foreground flex items-center gap-2">
            <Contrast className="w-4 h-4" />
            High Contrast
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {mode === 'system'
              ? `Following system preference (${systemPrefersHighContrast ? 'active' : 'inactive'})`
              : isHighContrast
              ? 'Enhanced colors for better visibility'
              : 'Using default color palette'}
          </div>
        </div>
      </div>

      <div
        className="flex rounded-lg border border-border overflow-hidden"
        role="radiogroup"
        aria-label="High contrast mode"
      >
        {modes.map((m) => {
          const isSelected = mode === m.value

          return (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'flex-1 px-3 py-2 text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
                m.value !== 'off' && 'border-l border-border'
              )}
              role="radio"
              aria-checked={isSelected}
              data-testid={`high-contrast-mode-${m.value}`}
            >
              {m.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
