'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { lintScript, isValidSyntax, LintResult, LintError } from '../lib'

interface UseLinterOptions {
  /** Debounce delay for linting (ms) */
  debounceMs?: number
  /** Whether linting is enabled */
  enabled?: boolean
}

interface UseLinterResult {
  /** Current lint result */
  lintResult: LintResult | null
  /** Whether currently linting */
  isLinting: boolean
  /** Trigger immediate lint */
  lint: (script: string) => void
  /** Get errors for a specific line */
  getLineErrors: (line: number) => LintError[]
  /** Quick syntax validation (synchronous) */
  isValid: boolean
  /** Clear all lint errors */
  clear: () => void
}

const EMPTY_RESULT: LintResult = {
  isValid: true,
  errors: [],
  summary: { errorCount: 0, warningCount: 0, infoCount: 0 }
}

/**
 * Hook for linting scripts with debouncing
 */
export function useLinter(
  script: string,
  options: UseLinterOptions = {}
): UseLinterResult {
  const { debounceMs = 300, enabled = true } = options

  const [lintResult, setLintResult] = useState<LintResult | null>(null)
  const [isLinting, setIsLinting] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scriptRef = useRef(script)

  // Update script ref
  scriptRef.current = script

  // Quick synchronous validation
  const isValid = useMemo(() => {
    if (!enabled || !script) return true
    return isValidSyntax(script)
  }, [script, enabled])

  // Debounced lint effect
  useEffect(() => {
    if (!enabled) {
      setLintResult(EMPTY_RESULT)
      return
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set up debounced lint
    setIsLinting(true)
    timeoutRef.current = setTimeout(() => {
      const result = lintScript(script)
      setLintResult(result)
      setIsLinting(false)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [script, debounceMs, enabled])

  // Immediate lint function
  const lint = useCallback((scriptToLint: string) => {
    if (!enabled) return
    setIsLinting(true)
    const result = lintScript(scriptToLint)
    setLintResult(result)
    setIsLinting(false)
  }, [enabled])

  // Get errors for a specific line
  const getLineErrors = useCallback((line: number): LintError[] => {
    if (!lintResult) return []
    return lintResult.errors.filter(e => e.line === line)
  }, [lintResult])

  // Clear lint results
  const clear = useCallback(() => {
    setLintResult(null)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return {
    lintResult,
    isLinting,
    lint,
    getLineErrors,
    isValid,
    clear,
  }
}

/**
 * Hook for validating script before save
 * Returns a function that validates and optionally blocks save
 */
export function useValidateBeforeSave(
  onValidationFail?: (errors: LintError[]) => void
): {
  validate: (script: string) => boolean
  canSave: (script: string) => boolean
} {
  const validate = useCallback((script: string): boolean => {
    if (!script || script.trim() === '') return true

    const result = lintScript(script)

    if (!result.isValid && onValidationFail) {
      const criticalErrors = result.errors.filter(e => e.severity === 'error')
      onValidationFail(criticalErrors)
    }

    return result.isValid
  }, [onValidationFail])

  const canSave = useCallback((script: string): boolean => {
    // For save, we only block on syntax errors, not warnings
    return isValidSyntax(script)
  }, [])

  return { validate, canSave }
}
