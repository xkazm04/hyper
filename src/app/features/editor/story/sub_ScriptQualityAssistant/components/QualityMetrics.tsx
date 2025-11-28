'use client'

/**
 * QualityMetrics Component
 * 
 * Displays syntax errors and runtime issues with expandable sections.
 */

import { AlertCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'

interface SyntaxError {
  line: number | null
  message: string
  severity: 'error' | 'warning'
}

interface RuntimeIssue {
  description: string
  suggestion: string
  severity: 'error' | 'warning'
}

interface QualityMetricsProps {
  syntaxErrors: SyntaxError[]
  runtimeIssues: RuntimeIssue[]
  expandedSections: Set<string>
  onToggleSection: (section: string) => void
}

export function QualityMetrics({
  syntaxErrors,
  runtimeIssues,
  expandedSections,
  onToggleSection,
}: QualityMetricsProps) {
  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error'
      ? <AlertCircle className="w-4 h-4 text-destructive" />
      : <AlertTriangle className="w-4 h-4 text-yellow-500" />
  }

  return (
    <>
      {/* Syntax Errors */}
      {syntaxErrors && syntaxErrors.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('errors')}
            className="w-full flex items-center justify-between p-3 bg-destructive/10 hover:bg-destructive/20 transition-colors"
            data-testid="script-analysis-errors-toggle"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="font-medium text-sm">
                Syntax Errors ({syntaxErrors.length})
              </span>
            </div>
            {expandedSections.has('errors') ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.has('errors') && (
            <div className="p-3 space-y-2">
              {syntaxErrors.map((error, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  data-testid={`syntax-error-${i}`}
                >
                  {getSeverityIcon(error.severity)}
                  <div>
                    {error.line && (
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        Line {error.line}:
                      </span>
                    )}
                    <span>{error.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Runtime Issues */}
      {runtimeIssues && runtimeIssues.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('runtime')}
            className="w-full flex items-center justify-between p-3 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
            data-testid="script-analysis-runtime-toggle"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="font-medium text-sm">
                Runtime Issues ({runtimeIssues.length})
              </span>
            </div>
            {expandedSections.has('runtime') ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          {expandedSections.has('runtime') && (
            <div className="p-3 space-y-3">
              {runtimeIssues.map((issue, i) => (
                <div
                  key={i}
                  className="text-sm space-y-1"
                  data-testid={`runtime-issue-${i}`}
                >
                  <div className="flex items-start gap-2">
                    {getSeverityIcon(issue.severity)}
                    <span>{issue.description}</span>
                  </div>
                  {issue.suggestion && (
                    <p className="text-muted-foreground ml-6">
                      Suggestion: {issue.suggestion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
