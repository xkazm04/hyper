'use client'

import { useEffect, useRef, useCallback } from 'react'
import { X, Keyboard } from 'lucide-react'

export interface ShortcutItem {
  action: string
  keys: string
}

interface ShortcutOverlayProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: ShortcutItem[]
  title?: string
}

/**
 * ShortcutOverlay - A reusable keyboard shortcuts cheat sheet overlay
 *
 * Features:
 * - Translucent backdrop with glassmorphism effect
 * - Focus management (traps focus, returns focus on close)
 * - Dismissable via ESC or clicking outside
 * - Fully accessible with ARIA roles
 * - Keyboard navigable
 */
export function ShortcutOverlay({
  isOpen,
  onClose,
  shortcuts,
  title = 'Keyboard Shortcuts',
}: ShortcutOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Store the previously focused element when opening
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement
      // Focus the close button when opening
      setTimeout(() => {
        closeButtonRef.current?.focus()
      }, 0)
    }
  }, [isOpen])

  // Return focus to previously focused element when closing
  const handleClose = useCallback(() => {
    onClose()
    setTimeout(() => {
      previousActiveElement.current?.focus()
    }, 0)
  }, [onClose])

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        handleClose()
      }

      // Trap focus within the overlay
      if (event.key === 'Tab') {
        const focusableElements = panelRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>

        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0]
          const lastElement = focusableElements[focusableElements.length - 1]

          if (event.shiftKey && document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          } else if (!event.shiftKey && document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, handleClose])

  // Handle clicking outside to close
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === overlayRef.current) {
        handleClose()
      }
    },
    [handleClose]
  )

  if (!isOpen) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="presentation"
      data-testid="shortcut-overlay-backdrop"
    >
      {/* Translucent backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Overlay panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcut-overlay-title"
        className="relative z-10 w-full max-w-md bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200"
        data-testid="shortcut-overlay-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            <h2
              id="shortcut-overlay-title"
              className="text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-card"
            aria-label="Close keyboard shortcuts"
            data-testid="shortcut-overlay-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut list */}
        <div
          className="px-5 py-4 max-h-[60vh] overflow-y-auto"
          data-testid="shortcut-overlay-list"
        >
          <ul className="space-y-3" role="list">
            {shortcuts.map((shortcut, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-4 py-2"
                data-testid={`shortcut-item-${index}`}
              >
                <span className="text-sm text-muted-foreground">
                  {shortcut.action}
                </span>
                <kbd className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-muted rounded-lg text-sm font-mono text-foreground border border-border shadow-sm">
                  {shortcut.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer hint */}
        <div className="px-5 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono mx-1">ESC</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Default keyboard shortcuts for the WASM Player
 */
export const WASM_PLAYER_SHORTCUTS: ShortcutItem[] = [
  { action: 'Navigate choices up', keys: '↑' },
  { action: 'Navigate choices down', keys: '↓' },
  { action: 'Select current choice', keys: 'Space / Enter' },
  { action: 'Proceed to next', keys: '→' },
  { action: 'Go back', keys: '←' },
  { action: 'Restart story', keys: 'Home' },
  { action: 'Jump to end', keys: 'End' },
  { action: 'Toggle keyboard shortcuts', keys: 'Ctrl+K / ?' },
]
