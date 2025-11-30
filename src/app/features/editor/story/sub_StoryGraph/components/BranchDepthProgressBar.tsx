'use client'

import { useMemo, useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BranchDepthProgressBarProps {
  /** Current depth of the selected node (0-indexed from root) */
  currentDepth: number
  /** Maximum depth in the current branch (for progress calculation) */
  maxDepth: number
  /** Whether the current node is a terminal node (dead end) */
  isTerminal: boolean
  /** Optional className for customization */
  className?: string
}

/**
 * BranchDepthProgressBar - A slim progress bar showing narrative depth progression
 *
 * Displays the user's current position in the story branch with:
 * - Dynamic progress bar that grows as users go deeper
 * - Small position marker icon at current node
 * - Celebratory flash animation when reaching terminal nodes
 */
export function BranchDepthProgressBar({
  currentDepth,
  maxDepth,
  isTerminal,
  className,
}: BranchDepthProgressBarProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [prevIsTerminal, setPrevIsTerminal] = useState(false)

  // Calculate progress percentage
  const progress = useMemo(() => {
    if (maxDepth === 0) return 100
    return Math.min(100, ((currentDepth + 1) / (maxDepth + 1)) * 100)
  }, [currentDepth, maxDepth])

  // Trigger celebration flash when reaching a terminal node
  useEffect(() => {
    if (isTerminal && !prevIsTerminal) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 600)
      return () => clearTimeout(timer)
    }
    setPrevIsTerminal(isTerminal)
  }, [isTerminal, prevIsTerminal])

  return (
    <div
      className={cn(
        'relative w-full h-6 bg-card/80 backdrop-blur-sm border border-border rounded-lg overflow-hidden shadow-sm',
        className
      )}
      data-testid="branch-depth-progress-bar"
      role="progressbar"
      aria-valuenow={currentDepth + 1}
      aria-valuemin={1}
      aria-valuemax={maxDepth + 1}
      aria-label={`Story depth: level ${currentDepth + 1} of ${maxDepth + 1}${isTerminal ? ' (ending)' : ''}`}
    >
      {/* Background track with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-muted/30 to-muted/10" />

      {/* Progress fill */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 transition-all duration-300 ease-out',
          'bg-gradient-to-r from-primary/60 via-primary/50 to-primary/40',
          showCelebration && 'animate-celebration-flash'
        )}
        style={{ width: `${progress}%` }}
        data-testid="branch-depth-progress-fill"
      />

      {/* Celebration flash overlay */}
      {showCelebration && (
        <div
          className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-orange-400/40 to-pink-400/30 animate-flash-fade"
          data-testid="branch-depth-celebration"
        />
      )}

      {/* Position marker at current progress */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out z-10"
        style={{ left: `${progress}%` }}
        data-testid="branch-depth-marker"
      >
        <div className={cn(
          'flex items-center justify-center w-4 h-4 rounded-full',
          'bg-primary text-primary-foreground shadow-md',
          isTerminal && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-background'
        )}>
          <MapPin className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Depth label */}
      <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
        <span className="text-[10px] font-medium text-muted-foreground/70">
          Depth
        </span>
        <span className={cn(
          'text-[10px] font-semibold',
          isTerminal ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground/70'
        )}>
          {currentDepth + 1} / {maxDepth + 1}
          {isTerminal && ' ✦'}
        </span>
      </div>
    </div>
  )
}
