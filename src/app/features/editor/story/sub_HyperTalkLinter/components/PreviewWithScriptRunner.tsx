'use client'

import { useEffect, useState, useCallback } from 'react'
import { RuntimeErrorBoundary } from './RuntimeErrorOverlay'
import { useScriptRunner } from '../hooks/useScriptRunner'
import type { RuntimeError, ScriptExecutionResult } from '../lib'

interface PreviewWithScriptRunnerProps {
  /** Script to execute when card loads */
  script: string | null
  /** Card context for script execution */
  cardContext: { id: string; title: string }
  /** Execute script on mount */
  executeOnMount?: boolean
  /** Callback when script navigates */
  onNavigate?: (cardId: string) => void
  /** Callback when script shows dialog */
  onDialog?: (message: string, options?: { title?: string }) => void
  /** Callback when script shows choice */
  onChoice?: (message: string, choices: string[]) => Promise<number>
  /** Children to render (the preview content) */
  children: React.ReactNode
  /** Optional class name */
  className?: string
}

/**
 * Wraps preview content with script execution and error boundary
 * Executes the script when the card loads and catches any runtime errors
 */
export function PreviewWithScriptRunner({
  script,
  cardContext,
  executeOnMount = true,
  onNavigate,
  onDialog,
  onChoice,
  children,
  className,
}: PreviewWithScriptRunnerProps) {
  const [hasExecuted, setHasExecuted] = useState(false)

  const {
    execute,
    isExecuting,
    runtimeError,
    clearError,
    consoleOutput,
  } = useScriptRunner({
    cardContext,
    onNavigate,
    onDialog,
    onChoice,
  })

  // Execute script on mount or card change
  useEffect(() => {
    if (executeOnMount && script && script.trim() && !hasExecuted) {
      execute(script).then(() => setHasExecuted(true))
    }
  }, [script, executeOnMount, execute, hasExecuted])

  // Reset executed state when card changes
  useEffect(() => {
    setHasExecuted(false)
  }, [cardContext.id])

  const handleRetry = useCallback(() => {
    if (script) {
      execute(script)
    }
  }, [script, execute])

  return (
    <RuntimeErrorBoundary
      error={runtimeError}
      onDismiss={clearError}
      onRetry={handleRetry}
    >
      <div className={className} data-script-executing={isExecuting}>
        {children}
        {/* Script status indicator */}
        {isExecuting && (
          <div
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-xs text-primary"
            data-testid="script-executing-indicator"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Running script...
          </div>
        )}
      </div>
    </RuntimeErrorBoundary>
  )
}

/**
 * Hook to wrap a preview component with script execution
 */
export function usePreviewScript(
  script: string | null,
  cardContext: { id: string; title: string },
  callbacks?: {
    onNavigate?: (cardId: string) => void
    onDialog?: (message: string, options?: { title?: string }) => void
    onChoice?: (message: string, choices: string[]) => Promise<number>
  }
): {
  execute: () => Promise<ScriptExecutionResult | null>
  isExecuting: boolean
  error: RuntimeError | null
  clearError: () => void
  consoleOutput: ScriptExecutionResult['consoleOutput']
} {
  const {
    execute: runScript,
    isExecuting,
    runtimeError,
    clearError,
    consoleOutput,
  } = useScriptRunner({
    cardContext,
    onNavigate: callbacks?.onNavigate,
    onDialog: callbacks?.onDialog,
    onChoice: callbacks?.onChoice,
  })

  const execute = useCallback(async () => {
    if (!script || !script.trim()) return null
    return runScript(script)
  }, [script, runScript])

  return {
    execute,
    isExecuting,
    error: runtimeError,
    clearError,
    consoleOutput,
  }
}
