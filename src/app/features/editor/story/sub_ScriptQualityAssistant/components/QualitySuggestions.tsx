'use client'

/**
 * QualitySuggestions Component
 * 
 * Displays refactoring suggestions, formatted code, and commented code sections.
 */

import { Button } from '@/components/ui/button'
import { Code, Wand2, MessageSquare, ChevronDown, ChevronUp, Copy } from 'lucide-react'

interface RefactoringSuggestion {
  description: string
  codeExample?: string
}

interface QualitySuggestionsProps {
  refactoringSuggestions: RefactoringSuggestion[]
  formattedCode: string
  commentedCode: string
  expandedSections: Set<string>
  onToggleSection: (section: string) => void
  onApplyFormatted: () => void
  onApplyCommented: () => void
  onCopy: (text: string) => void
}

export function QualitySuggestions({
  refactoringSuggestions,
  formattedCode,
  commentedCode,
  expandedSections,
  onToggleSection,
  onApplyFormatted,
  onApplyCommented,
  onCopy,
}: QualitySuggestionsProps) {
  return (
    <>
      {/* Refactoring Suggestions */}
      {refactoringSuggestions && refactoringSuggestions.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('suggestions')}
            className="w-full flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/20 transition-colors"
            data-testid="script-analysis-suggestions-toggle"
          >
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">
                Refactoring Suggestions ({refactoringSuggestions.length})
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
              {refactoringSuggestions.map((suggestion, i) => (
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
      {formattedCode && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('formatted')}
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
                {formattedCode}
              </pre>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onApplyFormatted}
                  data-testid="apply-formatted-code-btn"
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(formattedCode)}
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
      {commentedCode && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => onToggleSection('commented')}
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
                {commentedCode}
              </pre>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onApplyCommented}
                  data-testid="apply-commented-code-btn"
                >
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopy(commentedCode)}
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
    </>
  )
}
