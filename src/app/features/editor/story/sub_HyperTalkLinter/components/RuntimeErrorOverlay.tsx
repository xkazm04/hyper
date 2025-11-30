'use client'

import { X, AlertOctagon, Code, RefreshCw, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { RuntimeError, ScriptExecutionResult } from '../lib'

interface RuntimeErrorOverlayProps {
  error: RuntimeError | null
  consoleOutput?: ScriptExecutionResult['consoleOutput']
  onDismiss: () => void
  onRetry?: () => void
  className?: string
}

/**
 * Overlay that displays runtime errors in a user-friendly way
 */
export function RuntimeErrorOverlay({
  error,
  consoleOutput = [],
  onDismiss,
  onRetry,
  className,
}: RuntimeErrorOverlayProps) {
  if (!error) return null

  const getErrorTypeLabel = (type: RuntimeError['type']) => {
    switch (type) {
      case 'SyntaxError':
        return 'Syntax Error'
      case 'ReferenceError':
        return 'Reference Error'
      case 'TypeError':
        return 'Type Error'
      case 'RangeError':
        return 'Range Error'
      default:
        return 'Runtime Error'
    }
  }

  const getErrorTypeDescription = (type: RuntimeError['type']) => {
    switch (type) {
      case 'SyntaxError':
        return 'The script contains invalid syntax that cannot be parsed.'
      case 'ReferenceError':
        return 'The script tried to use a variable or function that doesn\'t exist.'
      case 'TypeError':
        return 'The script tried to use a value in an unexpected way.'
      case 'RangeError':
        return 'A numeric value was outside its valid range.'
      default:
        return 'An error occurred while running the script.'
    }
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/60 backdrop-blur-sm',
        className
      )}
      role="alertdialog"
      aria-labelledby="error-title"
      aria-describedby="error-description"
      data-testid="runtime-error-overlay"
    >
      <div
        className={cn(
          'w-full max-w-lg rounded-lg border-2 border-destructive/50',
          'bg-card shadow-xl overflow-hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 bg-destructive/10 border-b border-destructive/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 id="error-title" className="font-bold text-foreground">
                {getErrorTypeLabel(error.type)}
              </h2>
              <p className="text-xs text-muted-foreground">
                Script execution failed
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            className="shrink-0"
            data-testid="error-dismiss-btn"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>

        {/* Error Content */}
        <div className="p-4 space-y-4">
          <p id="error-description" className="text-sm text-muted-foreground">
            {getErrorTypeDescription(error.type)}
          </p>

          {/* Error Message */}
          <div className="rounded-md border border-border bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <Code className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-mono text-sm text-destructive break-words">
                  {error.message}
                </p>
                {error.line && (
                  <p className="text-xs text-muted-foreground mt-1">
                    at line {error.line}
                    {error.column ? `, column ${error.column}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Console Output (if any) */}
          {consoleOutput.length > 0 && (
            <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Console Output</span>
              </div>
              <div className="max-h-32 overflow-y-auto p-2 space-y-1">
                {consoleOutput.map((entry, index) => (
                  <div
                    key={index}
                    className={cn(
                      'text-xs font-mono px-2 py-1 rounded',
                      entry.level === 'error' && 'bg-destructive/10 text-destructive',
                      entry.level === 'warn' && 'bg-yellow-500/10 text-yellow-600',
                      entry.level === 'info' && 'bg-blue-500/10 text-blue-600',
                      entry.level === 'log' && 'text-foreground'
                    )}
                    data-testid={`console-output-${index}`}
                  >
                    {entry.args.map(arg => String(arg)).join(' ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stack Trace (collapsible) */}
          {error.stack && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                Show stack trace
              </summary>
              <pre className="mt-2 p-2 rounded bg-muted/50 overflow-x-auto text-muted-foreground font-mono whitespace-pre-wrap break-words">
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/30">
          <Button
            variant="outline"
            onClick={onDismiss}
            data-testid="error-close-btn"
          >
            Close
          </Button>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="gap-2"
              data-testid="error-retry-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface RuntimeErrorBoundaryProps {
  error: RuntimeError | null
  onDismiss: () => void
  onRetry?: () => void
  children: React.ReactNode
}

/**
 * Error boundary wrapper that shows overlay when there's a runtime error
 */
export function RuntimeErrorBoundary({
  error,
  onDismiss,
  onRetry,
  children,
}: RuntimeErrorBoundaryProps) {
  return (
    <>
      {children}
      <RuntimeErrorOverlay
        error={error}
        onDismiss={onDismiss}
        onRetry={onRetry}
      />
    </>
  )
}
