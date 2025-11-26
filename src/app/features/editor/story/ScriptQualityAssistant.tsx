'use client'

import { useState } from 'react'
import {
  Code,
  Wand2,
  MessageSquare,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/context/ToastContext'

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

interface RefactoringSuggestion {
  description: string
  codeExample?: string
}

interface ScriptAnalysis {
  hasErrors: boolean
  syntaxErrors: SyntaxError[]
  runtimeIssues: RuntimeIssue[]
  refactoringSuggestions: RefactoringSuggestion[]
  formattedCode: string
  commentedCode: string
  summary: string
}

interface ScriptQualityAssistantProps {
  script: string
  onScriptUpdate: (script: string) => void
  disabled?: boolean
}

export default function ScriptQualityAssistant({
  script,
  onScriptUpdate,
  disabled = false
}: ScriptQualityAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']))
  const { success, error: showError } = useToast()

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  const analyzeScript = async (action: 'analyze' | 'format' | 'comment' = 'analyze') => {
    if (!script.trim()) {
      showError('Please enter some script content to analyze')
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/ai/analyze-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, action })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to analyze script')
      }

      const data = await response.json()
      setAnalysis(data.analysis)

      // Expand all sections with content
      const sectionsToExpand = new Set(['summary'])
      if (data.analysis.syntaxErrors?.length > 0) sectionsToExpand.add('errors')
      if (data.analysis.runtimeIssues?.length > 0) sectionsToExpand.add('runtime')
      if (data.analysis.refactoringSuggestions?.length > 0) sectionsToExpand.add('suggestions')
      setExpandedSections(sectionsToExpand)

      success('Script analyzed successfully')
    } catch (error) {
      console.error('Error analyzing script:', error)
      showError(error instanceof Error ? error.message : 'Failed to analyze script')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const applyFormattedCode = () => {
    if (analysis?.formattedCode) {
      onScriptUpdate(analysis.formattedCode)
      success('Formatted code applied')
    }
  }

  const applyCommentedCode = () => {
    if (analysis?.commentedCode) {
      onScriptUpdate(analysis.commentedCode)
      success('Commented code applied')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      success('Copied to clipboard')
    } catch {
      showError('Failed to copy to clipboard')
    }
  }

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error'
      ? <AlertCircle className="w-4 h-4 text-destructive" />
      : <AlertTriangle className="w-4 h-4 text-yellow-500" />
  }

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => analyzeScript('analyze')}
          disabled={disabled || isAnalyzing || !script.trim()}
          data-testid="script-analyze-btn"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Code className="w-4 h-4 mr-2" />
          )}
          Analyze
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => analyzeScript('format')}
          disabled={disabled || isAnalyzing || !script.trim()}
          data-testid="script-format-btn"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Format
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => analyzeScript('comment')}
          disabled={disabled || isAnalyzing || !script.trim()}
          data-testid="script-comment-btn"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Comments
        </Button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-3" data-testid="script-analysis-results">
          {/* Summary */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('summary')}
              className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
              data-testid="script-analysis-summary-toggle"
            >
              <div className="flex items-center gap-2">
                {analysis.hasErrors ? (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                <span className="font-medium text-sm">Summary</span>
              </div>
              {expandedSections.has('summary') ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {expandedSections.has('summary') && (
              <div className="p-3 text-sm text-muted-foreground">
                {analysis.summary}
              </div>
            )}
          </div>

          {/* Syntax Errors */}
          {analysis.syntaxErrors && analysis.syntaxErrors.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('errors')}
                className="w-full flex items-center justify-between p-3 bg-destructive/10 hover:bg-destructive/20 transition-colors"
                data-testid="script-analysis-errors-toggle"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="font-medium text-sm">
                    Syntax Errors ({analysis.syntaxErrors.length})
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
                  {analysis.syntaxErrors.map((error, i) => (
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
          {analysis.runtimeIssues && analysis.runtimeIssues.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('runtime')}
                className="w-full flex items-center justify-between p-3 bg-yellow-500/10 hover:bg-yellow-500/20 transition-colors"
                data-testid="script-analysis-runtime-toggle"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-sm">
                    Runtime Issues ({analysis.runtimeIssues.length})
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
                  {analysis.runtimeIssues.map((issue, i) => (
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

          {/* Refactoring Suggestions */}
          {analysis.refactoringSuggestions && analysis.refactoringSuggestions.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('suggestions')}
                className="w-full flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/20 transition-colors"
                data-testid="script-analysis-suggestions-toggle"
              >
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    Refactoring Suggestions ({analysis.refactoringSuggestions.length})
                  </span>
                </div>
                {expandedSections.has('suggestions') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.has('suggestions') && (
                <div className="p-3 space-y-3">
                  {analysis.refactoringSuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="text-sm space-y-2"
                      data-testid={`refactoring-suggestion-${i}`}
                    >
                      <p>{suggestion.description}</p>
                      {suggestion.codeExample && (
                        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto font-mono">
                          {suggestion.codeExample}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Formatted Code */}
          {analysis.formattedCode && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('formatted')}
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                data-testid="script-analysis-formatted-toggle"
              >
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  <span className="font-medium text-sm">Formatted Code</span>
                </div>
                {expandedSections.has('formatted') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.has('formatted') && (
                <div className="p-3 space-y-2">
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono max-h-48">
                    {analysis.formattedCode}
                  </pre>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={applyFormattedCode}
                      data-testid="apply-formatted-code-btn"
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(analysis.formattedCode)}
                      data-testid="copy-formatted-code-btn"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Commented Code */}
          {analysis.commentedCode && (
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('commented')}
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
                data-testid="script-analysis-commented-toggle"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium text-sm">Code with Comments</span>
                </div>
                {expandedSections.has('commented') ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSections.has('commented') && (
                <div className="p-3 space-y-2">
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto font-mono max-h-48">
                    {analysis.commentedCode}
                  </pre>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={applyCommentedCode}
                      data-testid="apply-commented-code-btn"
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(analysis.commentedCode)}
                      data-testid="copy-commented-code-btn"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
