'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { SuggestedCard, getConfidenceLevel, getConfidenceColor } from '@/lib/types/ai-canvas'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SuggestionContent, SuggestionActions } from './sub_SuggestedCardNode'

export interface SuggestedCardNodeData extends SuggestedCard {
  onAccept: (suggestion: SuggestedCard) => void
  onDecline: (suggestionId: string) => void
  onHover: (suggestionId: string | null) => void
}

/**
 * SuggestedCardNode - AI-generated card suggestion with confidence indicator
 *
 * Features:
 * - Confidence color coding (emerald/amber/red)
 * - Accept/decline buttons with micro-animations
 * - Animated border pulse for suggestions
 * - Preview of suggested content
 * - Halloween ghost-float effect
 */
const SuggestedCardNode = memo(({ data }: NodeProps<SuggestedCardNodeData>) => {
  const {
    id,
    title,
    content,
    choiceLabel,
    confidence,
    isAnimatingIn,
    isAnimatingOut,
    isHovered,
    onAccept,
    onDecline,
    onHover,
  } = data

  const confidenceLevel = getConfidenceLevel(confidence)
  const confidenceColorName = getConfidenceColor(confidence)

  // Map color name to Tailwind classes
  const colorClasses = {
    emerald: {
      border: 'border-emerald-500',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600',
      ring: 'ring-emerald-500/30',
      pulse: 'shadow-emerald-500/20',
    },
    amber: {
      border: 'border-amber-500',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600',
      ring: 'ring-amber-500/30',
      pulse: 'shadow-amber-500/20',
    },
    red: {
      border: 'border-red-400',
      bg: 'bg-red-400/10',
      text: 'text-red-500',
      ring: 'ring-red-400/30',
      pulse: 'shadow-red-400/20',
    },
  }

  const colors = colorClasses[confidenceColorName as keyof typeof colorClasses]

  const handleAccept = (e: React.MouseEvent) => {
    e.stopPropagation()
    onAccept(data)
  }

  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDecline(id)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={cn(
          'relative w-[180px] rounded-xl transition-all duration-300',
          // Base styling with dashed border for suggestions
          'border-2 border-dashed',
          colors.border,
          colors.bg,
          // Animation states
          isAnimatingIn && 'animate-suggestion-spawn',
          isAnimatingOut && 'animate-suggestion-dismiss',
          // Hover state
          isHovered && 'scale-105 shadow-xl z-50',
          !isHovered && 'hover:scale-102 hover:shadow-lg',
          // Suggestion pulse animation
          'animate-suggestion-pulse',
          // Halloween ghost-float effect
          'halloween-ghost-float'
        )}
        style={{
          // Custom property for pulse shadow color
          '--suggestion-pulse-color': `var(--${confidenceColorName}-500)`,
        } as React.CSSProperties}
        onMouseEnter={() => onHover(id)}
        onMouseLeave={() => onHover(null)}
        data-testid={`suggested-card-node-${id}`}
      >
        {/* AI Badge */}
        <div className={cn(
          'absolute -top-2.5 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold',
          'flex items-center gap-1',
          colors.bg,
          colors.text,
          colors.border,
          'border'
        )}>
          <Sparkles className="w-3 h-3" />
          AI
        </div>

        {/* Confidence indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold',
                colors.bg,
                colors.text,
                colors.border,
                'border cursor-help'
              )}
              data-testid={`suggestion-confidence-${id}`}
            >
              {Math.round(confidence * 100)}%
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>AI Confidence: {confidenceLevel}</p>
          </TooltipContent>
        </Tooltip>

        {/* Content area */}
        <SuggestionContent
          id={id}
          title={title}
          content={content}
          choiceLabel={choiceLabel}
          imagePrompt={data.imagePrompt}
        />

        {/* Action buttons */}
        <SuggestionActions
          id={id}
          onAccept={handleAccept}
          onDecline={handleDecline}
        />

        {/* Connection handle - target only (from source card) */}
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            '!w-4 !h-4 !border-2 !rounded-full transition-all',
            '!-left-2',
            colors.bg,
            colors.border,
            'hover:!bg-primary hover:!border-primary'
          )}
        />

        {/* Animated wiring indicator */}
        {isAnimatingIn && (
          <div
            className={cn(
              'absolute -left-8 top-1/2 -translate-y-1/2',
              'w-6 h-0.5 animate-wire-connect',
              confidenceColorName === 'emerald' && 'bg-emerald-500',
              confidenceColorName === 'amber' && 'bg-amber-500',
              confidenceColorName === 'red' && 'bg-red-400'
            )}
          />
        )}
      </div>
    </TooltipProvider>
  )
})

SuggestedCardNode.displayName = 'SuggestedCardNode'
export default SuggestedCardNode
