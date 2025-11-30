'use client'

import { useState, useCallback, useRef } from 'react'
import { createSandbox, ScriptExecutionResult, RuntimeError } from '../lib'

interface UseScriptRunnerOptions {
  /** Current card context */
  cardContext: { id: string; title: string }
  /** Callback when script navigates to another card */
  onNavigate?: (cardId: string) => void
  /** Callback when script shows a dialog */
  onDialog?: (message: string, options?: { title?: string }) => void
  /** Callback when script shows a choice dialog */
  onChoice?: (message: string, choices: string[]) => Promise<number>
}

interface UseScriptRunnerResult {
  /** Execute a script */
  execute: (script: string) => Promise<ScriptExecutionResult>
  /** Last execution result */
  lastResult: ScriptExecutionResult | null
  /** Whether currently executing */
  isExecuting: boolean
  /** Current runtime error if any */
  runtimeError: RuntimeError | null
  /** Clear the runtime error */
  clearError: () => void
  /** Get all stored variables */
  getVariables: () => Record<string, unknown>
  /** Console output from last execution */
  consoleOutput: ScriptExecutionResult['consoleOutput']
}

/**
 * Hook for executing scripts in a sandboxed environment
 */
export function useScriptRunner(options: UseScriptRunnerOptions): UseScriptRunnerResult {
  const { cardContext, onNavigate, onDialog, onChoice } = options

  const [lastResult, setLastResult] = useState<ScriptExecutionResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [runtimeError, setRuntimeError] = useState<RuntimeError | null>(null)
  const [consoleOutput, setConsoleOutput] = useState<ScriptExecutionResult['consoleOutput']>([])

  // Keep sandbox instance alive between executions
  const sandboxRef = useRef<ReturnType<typeof createSandbox> | null>(null)

  // Recreate sandbox when card context changes
  const getSandbox = useCallback(() => {
    if (!sandboxRef.current) {
      sandboxRef.current = createSandbox(cardContext, {
        onNavigate,
        onDialog,
        onChoice,
      })
    }
    return sandboxRef.current
  }, [cardContext, onNavigate, onDialog, onChoice])

  const execute = useCallback(async (script: string): Promise<ScriptExecutionResult> => {
    setIsExecuting(true)
    setRuntimeError(null)

    try {
      const sandbox = getSandbox()
      const result = await sandbox.execute(script)

      setLastResult(result)
      setConsoleOutput(result.consoleOutput)

      if (!result.success && result.error) {
        setRuntimeError(result.error)
      }

      return result
    } catch (error) {
      // This shouldn't happen, but handle unexpected errors
      const fallbackError: RuntimeError = {
        message: error instanceof Error ? error.message : 'Unknown error',
        script,
        type: 'RuntimeError',
      }
      setRuntimeError(fallbackError)

      const errorResult: ScriptExecutionResult = {
        success: false,
        error: fallbackError,
        consoleOutput: [],
      }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setIsExecuting(false)
    }
  }, [getSandbox])

  const clearError = useCallback(() => {
    setRuntimeError(null)
  }, [])

  const getVariables = useCallback(() => {
    const sandbox = sandboxRef.current
    return sandbox ? sandbox.getVariables() : {}
  }, [])

  return {
    execute,
    lastResult,
    isExecuting,
    runtimeError,
    clearError,
    getVariables,
    consoleOutput,
  }
}
