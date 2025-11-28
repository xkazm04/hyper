'use client'

import { Keyboard } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { AccessibilityToolbar } from '@/app/features/accessibility'

interface PlayerControlsProps {
  showKeyboardHelp: boolean
  onToggleKeyboardHelp: () => void
}

/**
 * PlayerControls - Top-right controls for theme, accessibility, and keyboard help
 */
export function PlayerControls({
  showKeyboardHelp,
  onToggleKeyboardHelp
}: PlayerControlsProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      <button
        onClick={onToggleKeyboardHelp}
        className="p-2 rounded-lg bg-card/80 hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (?)"
        data-testid="keyboard-help-btn"
      >
        <Keyboard className="w-4 h-4" />
      </button>
      <AccessibilityToolbar />
      <ThemeToggle />
    </div>
  )
}

/**
 * KeyboardHelpTooltip - Displays keyboard shortcuts help
 */
export function KeyboardHelpTooltip({
  onClose
}: {
  onClose: () => void
}) {
  return (
    <div
      className="fixed top-16 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-4 max-w-xs"
      data-testid="keyboard-help-tooltip"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground text-sm">Keyboard Shortcuts</h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Close help"
          data-testid="keyboard-help-close-btn"
        >
          <span className="text-lg leading-none">&times;</span>
        </button>
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Navigate choices</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">↑ ↓</kbd>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Select choice</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">Space / Enter / →</kbd>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Go back</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">←</kbd>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Restart story</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">Home</kbd>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Toggle this help</span>
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">?</kbd>
        </div>
      </div>
    </div>
  )
}
