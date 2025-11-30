'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Code, Play, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useLinter, useValidateBeforeSave } from '../hooks/useLinter'
import { useScriptRunner } from '../hooks/useScriptRunner'
import { LintErrorList, LintStatusBadge } from './LintErrorList'
import { RuntimeErrorOverlay } from './RuntimeErrorOverlay'
import type { LintError } from '../lib'

interface ScriptEditorProps {
  /** Initial script content */
  script: string
  /** Called when script changes */
  onScriptChange: (script: string) => void
  /** Called when script should be saved */
  onSave?: (script: string) => Promise<void>
  /** Card context for script execution */
  cardContext: { id: string; title: string }
  /** Whether editor is disabled */
  disabled?: boolean
  /** Whether to show the test run button */
  showTestRun?: boolean
  /** Callback when script navigates (for preview) */
  onNavigate?: (cardId: string) => void
  /** Callback when script shows dialog */
  onDialog?: (message: string, options?: { title?: string }) => void
  className?: string
}

/**
 * Full-featured script editor with linting and test execution
 */
export function ScriptEditor({
  script,
  onScriptChange,
  onSave,
  cardContext,
  disabled = false,
  showTestRun = true,
  onNavigate,
  onDialog,
  className,
}: ScriptEditorProps) {
  const [localScript, setLocalScript] = useState(script)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync with external script changes
  useEffect(() => {
    setLocalScript(script)
  }, [script])

  // Linting
  const {
    lintResult,
    isLinting,
    getLineErrors,
    isValid,
  } = useLinter(localScript, { debounceMs: 300 })

  // Validation before save
  const { canSave } = useValidateBeforeSave()

  // Script runner for test execution
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
  })

  // Handle script change
  const handleChange = useCallback((value: string) => {
    setLocalScript(value)
    onScriptChange(value)
  }, [onScriptChange])

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave || disabled || isSaving) return

    // Check if script is valid before saving
    if (!canSave(localScript)) {
      // Scroll to first error if there's a textarea
      if (textareaRef.current && lintResult?.errors.length) {
        const firstError = lintResult.errors[0]
        scrollToLine(textareaRef.current, firstError.line)
      }
      return
    }

    setIsSaving(true)
    try {
      await onSave(localScript)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, localScript, disabled, isSaving, canSave, lintResult])

  // Handle test run
  const handleTestRun = useCallback(async () => {
    if (disabled || isExecuting) return
    await execute(localScript)
  }, [execute, localScript, disabled, isExecuting])

  // Handle error click - scroll to line
  const handleErrorClick = useCallback((error: LintError) => {
    if (textareaRef.current) {
      scrollToLine(textareaRef.current, error.line)
    }
  }, [])

  // Handle blur to trigger save
  const handleBlur = useCallback(() => {
    if (localScript !== script) {
      handleSave()
    }
  }, [localScript, script, handleSave])

  // Get line-specific error styling
  const getLineDecorations = useCallback(() => {
    if (!lintResult) return ''

    // Create CSS for highlighting error lines
    const errorLines = lintResult.errors
      .filter(e => e.severity === 'error')
      .map(e => e.line)

    // This is a simplified approach - for full line highlighting,
    // a proper code editor like Monaco would be needed
    return errorLines.length > 0 ? 'ring-2 ring-destructive/30' : ''
  }, [lintResult])

  const hasErrors = lintResult && !lintResult.isValid

  return (
    <div className={cn('space-y-4', className)} data-testid="script-editor">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm font-semibold text-foreground">
            Card Script
          </Label>
          <LintStatusBadge result={lintResult} isLinting={isLinting} />
        </div>

        <div className="flex items-center gap-2">
          {showTestRun && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestRun}
              disabled={disabled || isExecuting || !localScript.trim()}
              className={cn(
                'border-2',
                hasErrors
                  ? 'border-destructive/50 text-destructive'
                  : 'border-primary/50 hover:border-primary hover:bg-primary/10'
              )}
              data-testid="script-test-run-btn"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Test Run
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Script Textarea */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={localScript}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={`// Write your card script here
// Available functions:
//   goToCard('cardId') - Navigate to another card
//   showDialog('message') - Show a dialog
//   getVariable('name') - Get a stored variable
//   setVariable('name', value) - Set a variable
//   random(min, max) - Random number
//   wait(ms) - Pause execution

console.log('Hello from script!')`}
          className={cn(
            'min-h-[200px] resize-y font-mono text-sm',
            'bg-card border-2 border-border',
            'focus:border-primary focus:ring-1 focus:ring-primary/20',
            'shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]',
            'placeholder:text-muted-foreground/50',
            getLineDecorations(),
            hasErrors && 'border-destructive/50 focus:border-destructive'
          )}
          disabled={disabled || isSaving}
          spellCheck={false}
          data-testid="script-textarea"
        />

        {/* Saving indicator */}
        {isSaving && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </div>
        )}

        {/* Inline error indicator */}
        {hasErrors && !isSaving && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="w-3.5 h-3.5" />
            Fix errors to save
          </div>
        )}
      </div>

      {/* Lint Errors */}
      {lintResult && lintResult.errors.length > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Issues Found
          </h3>
          <LintErrorList
            result={lintResult}
            onErrorClick={handleErrorClick}
          />
        </div>
      )}

      {/* Console Output (from last run) */}
      {consoleOutput.length > 0 && !runtimeError && (
        <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground">
              Console Output (last run)
            </span>
          </div>
          <div className="max-h-24 overflow-y-auto p-2 space-y-1">
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
              >
                {entry.args.map(arg => String(arg)).join(' ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runtime Error Overlay */}
      <RuntimeErrorOverlay
        error={runtimeError}
        consoleOutput={consoleOutput}
        onDismiss={clearError}
        onRetry={handleTestRun}
      />
    </div>
  )
}

/**
 * Scroll textarea to show a specific line
 */
function scrollToLine(textarea: HTMLTextAreaElement, line: number) {
  const lines = textarea.value.split('\n')
  let charPosition = 0

  for (let i = 0; i < line - 1 && i < lines.length; i++) {
    charPosition += lines[i].length + 1 // +1 for newline
  }

  textarea.focus()
  textarea.setSelectionRange(charPosition, charPosition + (lines[line - 1]?.length || 0))

  // Scroll to make the line visible
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20
  const scrollTop = (line - 1) * lineHeight - textarea.clientHeight / 2
  textarea.scrollTop = Math.max(0, scrollTop)
}
