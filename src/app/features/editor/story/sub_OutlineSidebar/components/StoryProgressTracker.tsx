'use client'

/**
 * StoryProgressTracker Component
 *
 * A slim vertical progress bar that visualizes story completion.
 * Colors from red (0%) to yellow (50%) to green (100%).
 * Updates in real-time as the user completes cards.
 */

import { useEditor } from '@/contexts/EditorContext'
import { useStoryProgress } from '../hooks/useStoryProgress'
import { cn } from '@/lib/utils'

interface StoryProgressTrackerProps {
  className?: string
}

export function StoryProgressTracker({ className }: StoryProgressTrackerProps) {
  const { storyCards, choices } = useEditor()
  const progress = useStoryProgress({ storyCards, choices })

  // Don't render if there are no cards
  if (progress.totalCards === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 py-3 px-2',
        className
      )}
      data-testid="story-progress-tracker"
    >
      {/* Progress bar container */}
      <div
        className="relative w-2 flex-1 min-h-[100px] bg-muted/30 rounded-full overflow-hidden border border-border/50"
        role="progressbar"
        aria-valuenow={progress.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Story ${progress.percentage}% complete`}
        data-testid="story-progress-bar"
      >
        {/* Progress fill - grows from bottom to top */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-500 ease-out"
          style={{
            height: `${progress.percentage}%`,
            backgroundColor: progress.color,
            boxShadow: progress.percentage > 0
              ? `0 0 8px ${progress.color}, 0 0 4px ${progress.color}`
              : 'none'
          }}
          data-testid="story-progress-fill"
        />
      </div>

      {/* Percentage label */}
      <div
        className="text-[10px] font-bold tabular-nums leading-none"
        style={{ color: progress.color }}
        data-testid="story-progress-percentage"
      >
        {progress.percentage}%
      </div>

      {/* Tooltip-style details on hover */}
      <div className="group relative">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold cursor-help transition-colors"
          style={{
            backgroundColor: `${progress.color}20`,
            color: progress.color
          }}
          data-testid="story-progress-info-btn"
        >
          i
        </div>

        {/* Hover tooltip */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="bg-popover border-2 border-border rounded-md shadow-theme-sm p-2 min-w-[140px] text-xs">
            <div className="font-bold mb-1.5 text-foreground">Story Progress</div>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-medium text-foreground">
                  {progress.completedCards}/{progress.totalCards}
                </span>
              </div>
              <div className="flex justify-between">
                <span>With content:</span>
                <span className="font-medium text-foreground">
                  {progress.cardsWithContent}
                </span>
              </div>
              <div className="flex justify-between">
                <span>With images:</span>
                <span className="font-medium text-foreground">
                  {progress.cardsWithImages}
                </span>
              </div>
              <div className="flex justify-between">
                <span>With choices:</span>
                <span className="font-medium text-foreground">
                  {progress.cardsWithChoices}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
