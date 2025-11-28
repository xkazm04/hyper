'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Check, X } from 'lucide-react'
import { ColorTokenResolver } from '../lib/color-token-resolver'
import { useTheme } from '@/contexts/ThemeContext'
import { useHighContrast } from '../lib/use-high-contrast'

interface HighContrastPreviewProps {
  /** Show the preview in a dialog/modal context */
  showInModal?: boolean
  /** Callback when user confirms changes */
  onConfirm?: () => void
  /** Callback when user cancels changes */
  onCancel?: () => void
}

/**
 * HighContrastPreview Component
 *
 * Provides a live preview of color changes before applying high contrast mode.
 * Shows side-by-side comparison of normal vs high contrast colors.
 */
export function HighContrastPreview({
  showInModal = false,
  onConfirm,
  onCancel
}: HighContrastPreviewProps) {
  const { theme } = useTheme()
  const { isHighContrast, toggle } = useHighContrast()
  const [previewActive, setPreviewActive] = useState(false)

  const isDarkTheme = theme === 'halloween'

  // Initialize resolver using useMemo to avoid effect setState
  const previewResolver = useMemo(
    () => new ColorTokenResolver(isDarkTheme, true),
    [isDarkTheme]
  )

  // Apply preview styles
  useEffect(() => {
    if (!previewActive) return

    const previewContainer = document.getElementById('high-contrast-preview-container')
    if (previewContainer) {
      previewResolver.applyToElement(previewContainer)
    }

    return () => {
      if (previewContainer) {
        previewResolver.removeFromElement(previewContainer)
      }
    }
  }, [previewActive, previewResolver])

  const handleConfirm = () => {
    if (!isHighContrast) {
      toggle()
    }
    setPreviewActive(false)
    onConfirm?.()
  }

  const handleCancel = () => {
    setPreviewActive(false)
    onCancel?.()
  }

  return (
    <div className="space-y-4" data-testid="high-contrast-preview">
      {/* Preview toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
        <div>
          <h3 className="text-sm font-semibold text-foreground">High Contrast Preview</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Preview how colors will look with high contrast enabled
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreviewActive(!previewActive)}
          className="gap-2"
          data-testid="preview-toggle-btn"
        >
          {previewActive ? (
            <>
              <EyeOff className="w-4 h-4" />
              Hide Preview
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Show Preview
            </>
          )}
        </Button>
      </div>

      {/* Preview container */}
      {previewActive && (
        <div
          id="high-contrast-preview-container"
          className="rounded-lg border-2 border-dashed border-border p-4 space-y-4"
          data-testid="preview-container"
        >
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Preview Mode Active
          </div>

          {/* Sample card preview */}
          <div className="bg-card rounded-lg border-2 border-border p-4 shadow-theme-sm">
            <h4 className="text-lg font-bold text-foreground mb-2">Sample Card Title</h4>
            <p className="text-sm text-muted-foreground mb-4">
              This is how your story cards will appear with high contrast colors.
              Text should be easier to read with increased contrast ratios.
            </p>

            {/* Sample buttons */}
            <div className="space-y-2">
              <Button className="w-full" data-testid="preview-primary-btn">
                Primary Action
              </Button>
              <Button variant="outline" className="w-full" data-testid="preview-secondary-btn">
                Secondary Action
              </Button>
            </div>
          </div>

          {/* Color comparison swatches */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Text Colors</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-foreground" />
                  <span className="text-xs text-foreground">Foreground</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Muted</span>
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">UI Colors</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span className="text-xs text-foreground">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-border" />
                  <span className="text-xs text-foreground">Border</span>
                </div>
              </div>
            </div>
          </div>

          {/* Confirm/Cancel actions */}
          {showInModal && (
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="gap-1"
                data-testid="preview-cancel-btn"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                className="gap-1"
                data-testid="preview-confirm-btn"
              >
                <Check className="w-4 h-4" />
                Apply High Contrast
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
