'use client'

import { cn } from '@/lib/utils'
import { MAX_PROMPT_LENGTH } from '@/lib/promptComposer'

interface PromptContentProps {
  prompt: string
  isExpanded: boolean
}

/**
 * Displays the prompt text with expand/collapse functionality
 * Height is dynamic based on content when expanded
 */
export function PromptContent({ prompt, isExpanded }: PromptContentProps) {
  const isPromptTooLong = prompt.length > MAX_PROMPT_LENGTH

  return (
    <>
      {/* Prompt Text */}
      <div
        id="prompt-text-container"
        className={cn(
          'text-xs text-foreground leading-relaxed transition-all duration-300',
          isExpanded ? 'max-h-none' : 'max-h-20 overflow-hidden'
        )}
        aria-labelledby="prompt-preview-label"
      >
        <p className={cn(!isExpanded && 'line-clamp-4')}>{prompt}</p>
      </div>

      {/* Prompt Stats */}
      <div
        className="flex items-center gap-2 text-xs text-muted-foreground"
        aria-live="polite"
        data-testid="prompt-preview-stats"
      >
        <span className={cn(isPromptTooLong && 'text-destructive font-medium')}>
          {prompt.length}/{MAX_PROMPT_LENGTH} characters
        </span>
        <span aria-hidden="true">•</span>
        <span>{prompt.split(/\s+/).length} words</span>
        {isPromptTooLong && (
          <span className="text-destructive" role="alert">
            <span aria-hidden="true">⚠️</span> Too long
          </span>
        )}
      </div>
    </>
  )
}
