'use client'

import { memo, useState, useCallback } from 'react'
import { Panel } from 'reactflow'
import { Link2, ArrowRight, Sparkles, X, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { ParentSuggestion } from '../hooks/useOrphanAttachment'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface OrphanAttachmentHelperProps {
  orphanCardId: string
  orphanCardTitle: string
  suggestions: ParentSuggestion[]
  onAttach: (parentCardId: string, orphanCardId: string) => Promise<void>
  onClose: () => void
  isVisible: boolean
}

/**
 * OrphanAttachmentHelper - Panel showing suggested parent nodes for orphaned cards
 *
 * Features:
 * - Shows ranked list of potential parent nodes
 * - One-click attachment to create linking choice
 * - Visual similarity indicators
 * - Animated entry/exit
 */
export const OrphanAttachmentHelper = memo(function OrphanAttachmentHelper({
  orphanCardId,
  orphanCardTitle,
  suggestions,
  onAttach,
  onClose,
  isVisible,
}: OrphanAttachmentHelperProps) {
  const { theme } = useTheme()
  const isHalloween = theme === 'halloween'
  const [attachingTo, setAttachingTo] = useState<string | null>(null)
  const [attachedTo, setAttachedTo] = useState<string | null>(null)

  const handleAttach = useCallback(async (parentCardId: string) => {
    setAttachingTo(parentCardId)
    try {
      await onAttach(parentCardId, orphanCardId)
      setAttachedTo(parentCardId)
      // Auto-close after successful attachment
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch {
      // Error handling - reset state
      setAttachingTo(null)
    }
  }, [onAttach, orphanCardId, onClose])

  if (!isVisible || suggestions.length === 0) {
    return null
  }

  return (
    <Panel position="top-center" className="mt-4">
      <div
        className={cn(
          'w-72 rounded-lg border-2 shadow-xl',
          'animate-in fade-in slide-in-from-top-2 duration-200',
          isHalloween
            ? 'bg-purple-950/95 border-orange-500/50 shadow-orange-500/20'
            : 'bg-card/95 border-primary/30 shadow-lg'
        )}
        data-testid="orphan-attachment-helper"
      >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-3 py-2 border-b',
        isHalloween ? 'border-purple-500/30' : 'border-border/50'
      )}>
        <div className="flex items-center gap-2">
          <Link2 className={cn(
            'w-4 h-4',
            isHalloween ? 'text-orange-400' : 'text-primary'
          )} />
          <span className={cn(
            'text-sm font-semibold',
            isHalloween ? 'text-orange-300' : 'text-foreground'
          )}>
            Connect Orphan
          </span>
        </div>
        <button
          onClick={onClose}
          className={cn(
            'p-1 rounded-full hover:bg-muted transition-colors',
            isHalloween ? 'hover:bg-purple-800' : ''
          )}
          data-testid="orphan-helper-close-btn"
          aria-label="Close attachment helper"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Orphan card info */}
      <div className={cn(
        'px-3 py-2 border-b text-xs',
        isHalloween ? 'border-purple-500/20 bg-purple-900/30' : 'border-border/30 bg-muted/30'
      )}>
        <span className="text-muted-foreground">Orphan: </span>
        <span className={cn(
          'font-medium',
          isHalloween ? 'text-amber-300' : 'text-amber-600'
        )}>
          {orphanCardTitle}
        </span>
      </div>

      {/* Suggestions list */}
      <div className="max-h-64 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 mb-1">
          <span className={cn(
            'text-xs font-medium flex items-center gap-1',
            isHalloween ? 'text-purple-300' : 'text-muted-foreground'
          )}>
            <Sparkles className="w-3 h-3" />
            Suggested parents
          </span>
        </div>

        {suggestions.map((suggestion, index) => {
          const isAttaching = attachingTo === suggestion.cardId
          const isAttached = attachedTo === suggestion.cardId

          return (
            <TooltipProvider key={suggestion.cardId} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleAttach(suggestion.cardId)}
                    disabled={isAttaching || attachedTo !== null}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all',
                      'group hover:scale-[1.02]',
                      isAttached && suggestion.cardId === attachedTo
                        ? isHalloween
                          ? 'bg-green-900/50 border border-green-500/50'
                          : 'bg-emerald-500/10 border border-emerald-500/30'
                        : isHalloween
                          ? 'bg-purple-900/50 hover:bg-purple-800/60 border border-transparent hover:border-orange-500/30'
                          : 'bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-primary/20',
                      (isAttaching || attachedTo !== null) && 'opacity-70 cursor-not-allowed'
                    )}
                    data-testid={`attach-to-${suggestion.cardId}-btn`}
                  >
                    {/* Rank indicator */}
                    <div className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0',
                      index === 0
                        ? isHalloween ? 'bg-orange-500 text-white' : 'bg-primary text-primary-foreground'
                        : isHalloween ? 'bg-purple-700 text-purple-200' : 'bg-muted text-muted-foreground'
                    )}>
                      {index + 1}
                    </div>

                    {/* Card title and reasons */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isHalloween ? 'text-purple-100' : 'text-foreground'
                      )}>
                        {suggestion.cardTitle}
                      </p>
                      <p className={cn(
                        'text-[10px] truncate',
                        isHalloween ? 'text-purple-400' : 'text-muted-foreground'
                      )}>
                        {suggestion.reasons.slice(0, 2).join(' • ')}
                      </p>
                    </div>

                    {/* Action indicator */}
                    <div className="shrink-0">
                      {isAttached ? (
                        <CheckCircle2 className={cn(
                          'w-4 h-4',
                          isHalloween ? 'text-green-400' : 'text-emerald-500'
                        )} />
                      ) : isAttaching ? (
                        <Loader2 className={cn(
                          'w-4 h-4 animate-spin',
                          isHalloween ? 'text-orange-400' : 'text-primary'
                        )} />
                      ) : (
                        <ArrowRight className={cn(
                          'w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity',
                          isHalloween ? 'text-orange-400' : 'text-primary'
                        )} />
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p className="font-medium mb-1">Why this card?</p>
                  <ul className="text-xs space-y-0.5">
                    {suggestion.reasons.map((reason, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span className="text-primary">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Score: {suggestion.score} | Depth: {suggestion.distance >= 0 ? suggestion.distance : 'N/A'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>

        {/* Footer hint */}
        <div className={cn(
          'px-3 py-2 border-t text-[10px] text-center',
          isHalloween ? 'border-purple-500/20 text-purple-400' : 'border-border/30 text-muted-foreground'
        )}>
          Click to create a choice linking to this orphan
        </div>
      </div>
    </Panel>
  )
})

OrphanAttachmentHelper.displayName = 'OrphanAttachmentHelper'
