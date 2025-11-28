'use client'

/**
 * ScriptQualityAssistant Component
 * 
 * AI-powered script analysis tool that provides syntax checking,
 * formatting, and refactoring suggestions.
 */

import { useState } from 'react'
import { Code, Wand2, MessageSquare, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/context/ToastContext'
import { QualityScore, QualityMetrics, QualitySuggestions } from './components'

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
      if (next.has(section)) next.delete(section)
      else next.add(section)
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
          <QualityScore
            hasErrors={analysis.hasErrors}
            summary={analysis.summary}
            isExpanded={expandedSections.has('summary')}
            onToggle={() => toggleSection('summary')}
          />

          <QualityMetrics
            syntaxErrors={analysis.syntaxErrors}
            runtimeIssues={analysis.runtimeIssues}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
          />

          <QualitySuggestions
            refactoringSuggestions={analysis.refactoringSuggestions}
            formattedCode={analysis.formattedCode}
            commentedCode={analysis.commentedCode}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onApplyFormatted={applyFormattedCode}
            onApplyCommented={applyCommentedCode}
            onCopy={copyToClipboard}
          />
        </div>
      )}
    </div>
  )
}
