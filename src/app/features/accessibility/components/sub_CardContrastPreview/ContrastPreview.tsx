'use client'

import { Button } from '@/components/ui/button'
import { Check, X } from 'lucide-react'
import { ColorTokenResolver } from '../../lib/color-token-resolver'

interface ContrastPreviewProps {
  cardTitle: string
  cardContent: string
  choices: string[]
  isDarkTheme: boolean
  isHighContrast: boolean
  previewResolver: ColorTokenResolver
  normalResolver: ColorTokenResolver
  showInModal: boolean
  onApply: () => void
  onCancel: () => void
}

/**
 * ContrastPreview - Live preview of story card with high contrast mode
 */
export function ContrastPreview({
  cardTitle,
  cardContent,
  choices,
  isDarkTheme,
  isHighContrast,
  previewResolver,
  normalResolver,
  showInModal,
  onApply,
  onCancel
}: ContrastPreviewProps) {
  return (
    <div
      id="card-contrast-preview-container"
      className="rounded-lg border-2 border-dashed border-primary/50 p-4 space-y-4"
      data-testid="card-preview-container"
    >
      <div className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Live Preview Mode
      </div>

      {/* Sample story card */}
      <div
        className="bg-card rounded-lg border-2 border-border shadow-theme-sm overflow-hidden"
        data-testid="preview-story-card"
      >
        {/* Simulated image area */}
        <div className="relative w-full h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <div className="text-4xl opacity-50">
            {isDarkTheme ? '🎃' : '🌲'}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        </div>

        {/* Card content */}
        <div className="p-4 space-y-3">
          <h2
            className="text-lg font-bold"
            style={{ color: `hsl(var(--card-title, var(--foreground)))` }}
            data-testid="preview-card-title"
          >
            {cardTitle}
          </h2>

          <p
            className="text-sm leading-relaxed"
            style={{ color: `hsl(var(--card-content, var(--muted-foreground)))` }}
            data-testid="preview-card-content"
          >
            {cardContent}
          </p>

          {/* Choice buttons */}
          <div className="space-y-2 pt-2">
            {choices.map((choice, index) => (
              <button
                key={index}
                className="w-full py-2.5 px-4 rounded-md text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: `hsl(var(--card-choice-bg, var(--primary)))`,
                  color: `hsl(var(--card-choice-text, var(--primary-foreground)))`,
                  borderWidth: '2px',
                  borderColor: `hsl(var(--card-choice-border, var(--border)))`
                }}
                disabled
                data-testid={`preview-choice-btn-${index}`}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-side comparison */}
      <ContrastComparison
        normalResolver={normalResolver}
        previewResolver={previewResolver}
      />

      {/* Apply/Cancel actions */}
      {(showInModal || !isHighContrast) && (
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="gap-1"
            data-testid="card-preview-cancel-btn"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onApply}
            className="gap-1"
            data-testid="card-preview-apply-btn"
          >
            <Check className="w-4 h-4" />
            Apply High Contrast
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * ContrastComparison - Side-by-side comparison of normal vs high contrast
 */
function ContrastComparison({
  normalResolver,
  previewResolver
}: {
  normalResolver: ColorTokenResolver
  previewResolver: ColorTokenResolver
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">Normal</div>
        <div className="space-y-1">
          <div
            className="h-6 rounded flex items-center px-2 text-xs font-medium"
            style={{
              backgroundColor: `hsl(${normalResolver.resolveToken('card')?.resolvedValue})`,
              color: `hsl(${normalResolver.resolveToken('card-foreground')?.resolvedValue})`,
              border: `1px solid hsl(${normalResolver.resolveToken('border')?.resolvedValue})`
            }}
          >
            Card text
          </div>
          <div
            className="h-6 rounded flex items-center px-2 text-xs font-medium"
            style={{
              backgroundColor: `hsl(${normalResolver.resolveToken('primary')?.resolvedValue})`,
              color: `hsl(${normalResolver.resolveToken('primary-foreground')?.resolvedValue})`
            }}
          >
            Button text
          </div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted-foreground">High Contrast</div>
        <div className="space-y-1">
          <div
            className="h-6 rounded flex items-center px-2 text-xs font-medium"
            style={{
              backgroundColor: `hsl(${previewResolver.resolveToken('card')?.resolvedValue})`,
              color: `hsl(${previewResolver.resolveToken('card-foreground')?.resolvedValue})`,
              border: `1px solid hsl(${previewResolver.resolveToken('border')?.resolvedValue})`
            }}
          >
            Card text
          </div>
          <div
            className="h-6 rounded flex items-center px-2 text-xs font-medium"
            style={{
              backgroundColor: `hsl(${previewResolver.resolveToken('primary')?.resolvedValue})`,
              color: `hsl(${previewResolver.resolveToken('primary-foreground')?.resolvedValue})`
            }}
          >
            Button text
          </div>
        </div>
      </div>
    </div>
  )
}
