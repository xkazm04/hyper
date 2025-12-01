'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Flag, GitBranch, MapPin, Star, Circle, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PathMilestone } from '../hooks/usePathProgress'

export interface PathProgressBarProps {
  /** Current progress from 0 to 1 */
  progress: number
  /** Previous progress for animation direction */
  previousProgress: number
  /** Whether moving forward in the story */
  isMovingForward: boolean
  /** Whether the current node is a terminal/ending */
  isTerminal: boolean
  /** Milestone nodes along the path */
  milestones: PathMilestone[]
  /** Current depth in the story */
  currentDepth: number
  /** Maximum depth */
  maxDepth: number
  /** Whether the progress bar is visible */
  isVisible: boolean
  /** Callback to toggle visibility */
  onToggleVisibility: () => void
  /** Whether Halloween theme is active */
  isHalloween?: boolean
  /** Optional className */
  className?: string
}

/**
 * Get the appropriate icon for a milestone
 */
function getMilestoneIcon(milestone: PathMilestone, isHalloween: boolean) {
  if (milestone.isStart) {
    return <Flag className="w-2.5 h-2.5" />
  }
  if (milestone.isTerminal) {
    return <Star className="w-2.5 h-2.5" />
  }
  if (milestone.isBranchPoint) {
    return <GitBranch className="w-2.5 h-2.5" />
  }
  if (milestone.isCurrent) {
    return <MapPin className="w-2.5 h-2.5" />
  }
  return <Circle className="w-1.5 h-1.5" />
}

/**
 * PathProgressBar - Animated translucent bar showing narrative progress
 *
 * Features:
 * - Expands as the user moves forward through the narrative
 * - Retracts when moving back
 * - Milestone icons at key nodes (start, branches, endings)
 * - Subtle glow animation to indicate progress
 * - Settings toggle to hide for a cleaner look
 * - Halloween theme support
 */
export function PathProgressBar({
  progress,
  previousProgress,
  isMovingForward,
  isTerminal,
  milestones,
  currentDepth,
  maxDepth,
  isVisible,
  onToggleVisibility,
  isHalloween = false,
  className,
}: PathProgressBarProps) {
  const [animatedProgress, setAnimatedProgress] = useState(progress)
  const [showCelebration, setShowCelebration] = useState(false)
  const [glowIntensity, setGlowIntensity] = useState(0)
  const progressRef = useRef(progress)
  const animationRef = useRef<number | null>(null)

  // Animate progress changes smoothly
  useEffect(() => {
    const startProgress = progressRef.current
    const targetProgress = progress
    const duration = 400 // ms
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const t = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - t, 3)

      const currentProgress = startProgress + (targetProgress - startProgress) * easeOutCubic
      setAnimatedProgress(currentProgress)

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        progressRef.current = targetProgress
      }
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [progress])

  // Pulse glow effect when progress changes
  useEffect(() => {
    if (progress !== previousProgress) {
      setGlowIntensity(1)
      const timer = setTimeout(() => setGlowIntensity(0), 600)
      return () => clearTimeout(timer)
    }
  }, [progress, previousProgress])

  // Celebration effect when reaching terminal
  useEffect(() => {
    if (isTerminal && progress >= 0.95) {
      setShowCelebration(true)
      const timer = setTimeout(() => setShowCelebration(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [isTerminal, progress])

  // Toggle visibility with keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggleVisibility()
    }
  }, [onToggleVisibility])

  // If not visible, show minimal toggle button
  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisibility}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md',
          'bg-card/60 backdrop-blur-sm border border-border/50',
          'text-muted-foreground hover:text-foreground',
          'transition-all duration-200 hover:bg-card/80',
          'shadow-sm',
          className
        )}
        data-testid="path-progress-toggle-show"
        aria-label="Show progress bar"
        title="Show progress bar"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="text-[10px] font-medium">Progress</span>
      </button>
    )
  }

  const progressPercent = animatedProgress * 100

  return (
    <div
      className={cn(
        'relative w-full',
        className
      )}
      data-testid="path-progress-bar-container"
    >
      {/* Main progress bar */}
      <div
        className={cn(
          'relative w-full h-8 rounded-lg overflow-hidden',
          'bg-card/60 backdrop-blur-sm',
          'border border-border/50',
          'shadow-sm',
          isHalloween && 'bg-purple-950/40 border-purple-700/30'
        )}
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Story progress: ${Math.round(progressPercent)}%${isTerminal ? ' (ending reached)' : ''}`}
        data-testid="path-progress-bar"
      >
        {/* Background track */}
        <div className={cn(
          'absolute inset-0',
          'bg-gradient-to-r from-muted/20 to-muted/10',
          isHalloween && 'from-purple-900/20 to-purple-900/10'
        )} />

        {/* Progress fill with animation */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-all duration-100',
            'bg-gradient-to-r',
            isMovingForward
              ? 'from-primary/50 via-primary/40 to-primary/30'
              : 'from-primary/40 via-primary/30 to-primary/20',
            isHalloween && (
              isMovingForward
                ? 'from-purple-600/50 via-purple-500/40 to-purple-400/30'
                : 'from-purple-600/40 via-purple-500/30 to-purple-400/20'
            ),
            showCelebration && 'animate-celebration-flash'
          )}
          style={{ width: `${progressPercent}%` }}
          data-testid="path-progress-fill"
        />

        {/* Glow overlay when progress changes */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 pointer-events-none',
            'bg-gradient-to-r from-primary/30 to-transparent',
            isHalloween && 'from-purple-400/30',
            'transition-opacity duration-600'
          )}
          style={{
            width: `${progressPercent}%`,
            opacity: glowIntensity * 0.6,
          }}
          data-testid="path-progress-glow"
        />

        {/* Shimmer effect on the progress bar */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 overflow-hidden pointer-events-none'
          )}
          style={{ width: `${progressPercent}%` }}
        >
          <div
            className={cn(
              'absolute inset-0 -translate-x-full',
              'bg-gradient-to-r from-transparent via-white/20 to-transparent',
              isHalloween && 'via-purple-300/20',
              'animate-path-shimmer'
            )}
            style={{
              animationDuration: '3s',
              animationIterationCount: 'infinite',
            }}
          />
        </div>

        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center">
          {milestones.map((milestone, index) => {
            const position = milestone.position * 100
            const isReached = animatedProgress >= milestone.position
            const isCurrentMilestone = milestone.isCurrent

            return (
              <div
                key={milestone.nodeId}
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10',
                  'transition-all duration-300'
                )}
                style={{ left: `${position}%` }}
                data-testid={`path-milestone-${index}`}
              >
                <div
                  className={cn(
                    'flex items-center justify-center rounded-full transition-all duration-300',
                    // Size based on type
                    milestone.isStart || milestone.isTerminal || milestone.isBranchPoint
                      ? 'w-5 h-5'
                      : milestone.isCurrent
                        ? 'w-4 h-4'
                        : 'w-2.5 h-2.5',
                    // Colors based on state
                    isReached
                      ? isCurrentMilestone
                        ? cn(
                            'bg-primary text-primary-foreground shadow-md',
                            isHalloween && 'bg-purple-500 text-white',
                            'ring-2 ring-primary/30 ring-offset-1 ring-offset-background',
                            isHalloween && 'ring-purple-400/30'
                          )
                        : milestone.isStart
                          ? cn(
                              'bg-green-500 text-white shadow-sm',
                              isHalloween && 'bg-green-600'
                            )
                          : milestone.isTerminal
                            ? cn(
                                'bg-yellow-500 text-white shadow-sm',
                                isHalloween && 'bg-amber-500'
                              )
                            : milestone.isBranchPoint
                              ? cn(
                                  'bg-blue-500 text-white shadow-sm',
                                  isHalloween && 'bg-indigo-500'
                                )
                              : cn(
                                  'bg-primary/60 text-primary-foreground',
                                  isHalloween && 'bg-purple-400/60'
                                )
                      : cn(
                          'bg-muted/50 text-muted-foreground/50',
                          isHalloween && 'bg-purple-900/50 text-purple-400/50'
                        ),
                    // Pulse animation for current milestone
                    isCurrentMilestone && 'animate-pulse'
                  )}
                  title={
                    milestone.isStart
                      ? 'Start'
                      : milestone.isTerminal
                        ? 'Ending'
                        : milestone.isBranchPoint
                          ? 'Branch point'
                          : milestone.isCurrent
                            ? 'Current position'
                            : `Depth ${milestone.depth}`
                  }
                >
                  {getMilestoneIcon(milestone, isHalloween)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress label */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <span className={cn(
            'text-[10px] font-medium',
            'text-muted-foreground/70',
            isHalloween && 'text-purple-300/70'
          )}>
            {isMovingForward ? 'Progress' : 'Backtrack'}
          </span>
          <span className={cn(
            'text-[10px] font-semibold',
            isTerminal
              ? 'text-yellow-600 dark:text-yellow-400'
              : 'text-foreground/70',
            isHalloween && (isTerminal ? 'text-amber-400' : 'text-purple-200/70')
          )}>
            {currentDepth + 1} / {maxDepth + 1}
            {isTerminal && ' \u2726'}
          </span>
        </div>
      </div>

      {/* Hide button */}
      <button
        onClick={onToggleVisibility}
        className={cn(
          'absolute -right-1 -top-1 p-1 rounded-full',
          'bg-card/80 backdrop-blur-sm border border-border/50',
          'text-muted-foreground hover:text-foreground',
          'transition-all duration-200 hover:bg-card',
          'shadow-sm opacity-0 group-hover:opacity-100',
          isHalloween && 'bg-purple-950/80 border-purple-700/30 hover:bg-purple-900/80'
        )}
        data-testid="path-progress-toggle-hide"
        aria-label="Hide progress bar"
        title="Hide progress bar"
      >
        <EyeOff className="w-3 h-3" />
      </button>
    </div>
  )
}
