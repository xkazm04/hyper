'use client'

import { AlertCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LintError, LintResult } from '../lib'

interface LintErrorListProps {
  result: LintResult | null
  onErrorClick?: (error: LintError) => void
  className?: string
}

/**
 * Displays a list of lint errors/warnings with clickable navigation
 */
export function LintErrorList({ result, onErrorClick, className }: LintErrorListProps) {
  if (!result || result.errors.length === 0) {
    return null
  }

  const getIcon = (severity: LintError['severity']) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
      case 'info':
        return <Info className="w-4 h-4 text-blue-500 shrink-0" />
    }
  }

  const getSeverityClass = (severity: LintError['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10'
      case 'info':
        return 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10'
    }
  }

  return (
    <div
      className={cn('space-y-1.5', className)}
      role="list"
      aria-label="Script issues"
      data-testid="lint-error-list"
    >
      {result.errors.map((error, index) => (
        <button
          key={`${error.code}-${error.line}-${error.column}-${index}`}
          onClick={() => onErrorClick?.(error)}
          className={cn(
            'w-full text-left p-2 rounded-md border text-sm transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            getSeverityClass(error.severity)
          )}
          role="listitem"
          data-testid={`lint-error-item-${index}`}
        >
          <div className="flex items-start gap-2">
            {getIcon(error.severity)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground">
                  {error.message}
                </span>
                <span className="text-xs text-muted-foreground">
                  Line {error.line}:{error.column}
                </span>
              </div>
              {error.suggestion && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Lightbulb className="w-3 h-3" />
                  <span>{error.suggestion}</span>
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

interface LintStatusBadgeProps {
  result: LintResult | null
  isLinting?: boolean
  className?: string
}

/**
 * Compact badge showing lint status
 */
export function LintStatusBadge({ result, isLinting, className }: LintStatusBadgeProps) {
  if (isLinting) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-muted text-muted-foreground',
          className
        )}
        data-testid="lint-status-checking"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        Checking...
      </span>
    )
  }

  if (!result) {
    return null
  }

  if (result.isValid && result.errors.length === 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-green-500/10 text-green-600',
          className
        )}
        data-testid="lint-status-valid"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Valid
      </span>
    )
  }

  const { errorCount, warningCount } = result.summary

  if (errorCount > 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-destructive/10 text-destructive',
          className
        )}
        data-testid="lint-status-error"
      >
        <AlertCircle className="w-3 h-3" />
        {errorCount} error{errorCount > 1 ? 's' : ''}
        {warningCount > 0 && `, ${warningCount} warning${warningCount > 1 ? 's' : ''}`}
      </span>
    )
  }

  if (warningCount > 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-yellow-500/10 text-yellow-600',
          className
        )}
        data-testid="lint-status-warning"
      >
        <AlertTriangle className="w-3 h-3" />
        {warningCount} warning{warningCount > 1 ? 's' : ''}
      </span>
    )
  }

  return null
}
