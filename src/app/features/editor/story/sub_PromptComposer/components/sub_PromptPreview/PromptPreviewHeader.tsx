'use client'

import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PromptPreviewHeaderProps {
  copied: boolean
  isExpanded: boolean
  loading: boolean
  onCopy: () => void
  onToggleExpanded: () => void
}

/**
 * Header section of PromptPreview with copy and expand controls
 */
export function PromptPreviewHeader({
  copied,
  isExpanded,
  loading,
  onCopy,
  onToggleExpanded,
}: PromptPreviewHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <span
        id="prompt-preview-label"
        className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
      >
        Generated Prompt
      </span>
      <div className="flex items-center gap-1" role="group" aria-label="Prompt actions">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleExpanded}
          className="h-6 text-xs"
          disabled={loading}
          aria-expanded={isExpanded}
          aria-controls="prompt-text-container"
          data-testid="prompt-preview-expand-btn"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" aria-hidden="true" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" aria-hidden="true" />
              Expand
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCopy}
          className="h-6 text-xs"
          disabled={loading}
          aria-label={copied ? 'Prompt copied to clipboard' : 'Copy prompt to clipboard'}
          data-testid="prompt-preview-copy-btn"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" aria-hidden="true" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
