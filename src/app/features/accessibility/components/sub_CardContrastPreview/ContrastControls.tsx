'use client'

import { Button } from '@/components/ui/button'
import { Eye, EyeOff, CheckCircle, AlertTriangle } from 'lucide-react'

interface ContrastControlsProps {
  isHighContrast: boolean
  allMeetWCAGAA: boolean
  localPreviewActive: boolean
  onTogglePreview: () => void
}

/**
 * ContrastControls - Header with preview toggle and status indicator
 */
export function ContrastControls({
  isHighContrast,
  allMeetWCAGAA,
  localPreviewActive,
  onTogglePreview
}: ContrastControlsProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          Card Contrast Preview
          {allMeetWCAGAA ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          )}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {isHighContrast
            ? 'High contrast mode is active'
            : 'Preview how cards will look with enhanced contrast'}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onTogglePreview}
        className="gap-2"
        data-testid="card-preview-toggle-btn"
      >
        {localPreviewActive ? (
          <>
            <EyeOff className="w-4 h-4" />
            Hide
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            Preview
          </>
        )}
      </Button>
    </div>
  )
}
