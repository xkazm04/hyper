'use client'

/**
 * QualityScore Component
 * 
 * Displays the summary section with overall quality status.
 */

import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface QualityScoreProps {
  hasErrors: boolean
  summary: string
  isExpanded: boolean
  onToggle: () => void
}

export function QualityScore({
  hasErrors,
  summary,
  isExpanded,
  onToggle,
}: QualityScoreProps) {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
        data-testid="script-analysis-summary-toggle"
      >
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : (
            <CheckCircle className="w-4 h-4 text-green-500" />
          )}
          <span className="font-medium text-sm">Summary</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {isExpanded && (
        <div className="p-3 text-sm text-muted-foreground">
          {summary}
        </div>
      )}
    </div>
  )
}
