import React from 'react'
import { cn } from '@/lib/utils'
import { Type, FileText, ImageIcon, GitBranch, Volume2 } from 'lucide-react'
import {
  TooltipContent,
} from '@/components/ui/tooltip'
import { CompletionItem } from '../NodeContent'

export interface NodeTooltipProps {
  label: string
  statusIcon: React.ReactNode
  statusLabel: string
  isFirst: boolean
  isOrphaned: boolean
  isDeadEnd: boolean
  hasTitle: boolean
  hasContent: boolean
  hasImage: boolean
  hasChoices: boolean
  hasAudio: boolean
  characters: string[]
  depth: number
  choiceCount: number
}

export function NodeTooltip({
  label,
  statusIcon,
  statusLabel,
  isFirst,
  isOrphaned,
  isDeadEnd,
  hasTitle,
  hasContent,
  hasImage,
  hasChoices,
  hasAudio,
  characters,
  depth,
  choiceCount,
}: NodeTooltipProps) {
  return (
    <TooltipContent
      side="right"
      sideOffset={16}
      className="max-w-[280px] p-0 bg-card border-2 border-border shadow-xl rounded-lg overflow-hidden"
    >
      <div className="p-3 space-y-2.5">
        {/* Title with status badge */}
        <div className="flex items-start gap-2">
          {statusIcon && (
            <div className={cn(
              'p-1 rounded',
              isFirst && 'bg-primary/10',
              isOrphaned && 'bg-amber-500/10',
              isDeadEnd && 'bg-red-500/10'
            )}>
              {statusIcon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight">{label}</p>
            {(isFirst || isOrphaned || isDeadEnd) && (
              <p className={cn(
                'text-xs mt-0.5',
                isFirst && 'text-primary',
                isOrphaned && 'text-amber-600',
                isDeadEnd && 'text-red-600'
              )}>
                {statusLabel}
              </p>
            )}
          </div>
        </div>

        {/* Completion grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <CompletionItem done={hasTitle} label="Title" icon={Type} />
          <CompletionItem done={hasContent} label="Content" icon={FileText} />
          <CompletionItem done={hasImage} label="Image" icon={ImageIcon} />
          <CompletionItem done={hasAudio} label="Audio" icon={Volume2} />
          <CompletionItem done={hasChoices} label="Choices" icon={GitBranch} />
        </div>

        {/* Characters if present */}
        {characters && characters.length > 0 && (
          <div className="text-xs pt-1.5 border-t border-border/50">
            <span className="font-medium text-muted-foreground">Characters: </span>
            <span className="text-foreground">{characters.join(', ')}</span>
          </div>
        )}

        {/* Depth and branches info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
          {depth >= 0 && (
            <span>Depth: {depth}</span>
          )}
          {choiceCount > 0 && (
            <span className="flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              {choiceCount} {choiceCount === 1 ? 'choice' : 'choices'}
            </span>
          )}
        </div>
      </div>
    </TooltipContent>
  )
}
