'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ChevronRight,
  ImageIcon,
  FileText,
} from 'lucide-react'

interface SuggestionContentProps {
  id: string
  title: string
  content: string
  choiceLabel: string
  imagePrompt?: string | null
}

/**
 * SuggestionContent - Content area for AI-generated card suggestions
 * 
 * Features:
 * - Choice label showing how to reach this card
 * - Title with line clamping
 * - Expandable content preview
 * - Content indicators (word count, image ready)
 */
export function SuggestionContent({
  id,
  title,
  content,
  choiceLabel,
  imagePrompt,
}: SuggestionContentProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="p-3 pt-4">
      {/* Choice label - how you get here */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
        <ChevronRight className="w-3 h-3" />
        <span className="font-medium truncate">{choiceLabel}</span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-2">
        {title}
      </h4>

      {/* Content preview - expandable */}
      <div
        className={cn(
          'text-xs text-muted-foreground cursor-pointer transition-all',
          isExpanded ? 'line-clamp-none' : 'line-clamp-3'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid={`suggestion-content-toggle-${id}`}
      >
        {content.substring(0, 200)}
        {content.length > 200 && !isExpanded && '...'}
      </div>

      {/* Content indicators */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <FileText className="w-3 h-3" />
          <span>{content.split(' ').length} words</span>
        </div>
        {imagePrompt && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <ImageIcon className="w-3 h-3" />
            <span>Image ready</span>
          </div>
        )}
      </div>
    </div>
  )
}
