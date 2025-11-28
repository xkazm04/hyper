'use client'

import { Button } from '@/components/ui/button'
import { Contrast, Monitor, Check } from 'lucide-react'
import { useHighContrast, HighContrastMode } from '../lib/use-high-contrast'

interface HighContrastToggleProps {
  /** Show label text next to the toggle */
  showLabel?: boolean
  /** Compact mode for toolbar placement */
  compact?: boolean
  /** Additional class names */
  className?: string
}

/**
 * HighContrastToggle Component
 *
 * Provides a toggle control for switching between high contrast modes.
 * Supports three modes: off, on, and system (follow OS preference).
 */
export function HighContrastToggle({
  showLabel = true,
  compact = false,
  className = ''
}: HighContrastToggleProps) {
  const {
    mode,
    isHighContrast,
    systemPrefersHighContrast,
    setMode
  } = useHighContrast()

  const modes: { value: HighContrastMode; label: string; icon: typeof Contrast }[] = [
    { value: 'off', label: 'Off', icon: Contrast },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'on', label: 'On', icon: Check }
  ]

  const currentModeIndex = modes.findIndex((m) => m.value === mode)

  const cycleMode = () => {
    const nextIndex = (currentModeIndex + 1) % modes.length
    setMode(modes[nextIndex].value)
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={cycleMode}
        className={`p-2 ${isHighContrast ? 'bg-primary/10' : ''} ${className}`}
        aria-label={`High contrast: ${mode}${mode === 'system' ? (systemPrefersHighContrast ? ' (active)' : ' (inactive)') : ''}`}
        title={`High Contrast: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`}
        data-testid="high-contrast-toggle-compact"
      >
        <Contrast className={`w-4 h-4 ${isHighContrast ? 'text-primary' : 'text-muted-foreground'}`} />
      </Button>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="high-contrast-toggle">
      {showLabel && (
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">High Contrast</div>
          <div className="text-xs text-muted-foreground">
            {mode === 'system'
              ? systemPrefersHighContrast
                ? 'Following system (active)'
                : 'Following system (inactive)'
              : mode === 'on'
              ? 'Always enabled'
              : 'Disabled'}
          </div>
        </div>
      )}

      {/* Mode buttons */}
      <div
        className="flex rounded-lg border border-border overflow-hidden"
        role="radiogroup"
        aria-label="High contrast mode"
      >
        {modes.map((m) => {
          const Icon = m.icon
          const isSelected = mode === m.value

          return (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`
                px-3 py-1.5 text-xs font-medium transition-colors
                flex items-center gap-1.5
                ${isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                }
                ${m.value !== 'off' ? 'border-l border-border' : ''}
              `}
              role="radio"
              aria-checked={isSelected}
              data-testid={`high-contrast-mode-${m.value}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Simple toggle button for high contrast
 * Used in toolbars or compact UI contexts
 */
export function HighContrastButton({ className = '' }: { className?: string }) {
  const { isHighContrast, toggle } = useHighContrast()

  return (
    <Button
      variant={isHighContrast ? 'default' : 'outline'}
      size="sm"
      onClick={toggle}
      className={`gap-2 ${className}`}
      aria-pressed={isHighContrast}
      data-testid="high-contrast-button"
    >
      <Contrast className="w-4 h-4" />
      <span className="hidden sm:inline">
        {isHighContrast ? 'High Contrast On' : 'High Contrast'}
      </span>
    </Button>
  )
}
