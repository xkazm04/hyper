'use client'

import { TrendingUp, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryAnalytics } from '../lib/types'

interface PathPopularityChartProps {
  analytics: StoryAnalytics
  maxPaths?: number
  className?: string
}

export function PathPopularityChart({
  analytics,
  maxPaths = 5,
  className,
}: PathPopularityChartProps) {
  // Sort paths by popularity
  const sortedPaths = Array.from(analytics.pathPopularity.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxPaths)

  if (sortedPaths.length === 0) {
    return null
  }

  const maxCount = sortedPaths[0]?.[1] || 1

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-foreground uppercase tracking-wide">
          Most Popular Paths
        </span>
      </div>

      <div className="space-y-2">
        {sortedPaths.map(([signature, count], index) => {
          const percentage = (count / analytics.totalPaths) * 100
          const barWidth = (count / maxCount) * 100

          // Parse signature to show card names
          const pathNodes = signature.split(' > ')

          return (
            <div
              key={signature}
              className="group"
              data-testid={`path-popularity-item-${index}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground overflow-hidden">
                  <span className="font-mono text-foreground shrink-0">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-0.5 overflow-hidden">
                    {pathNodes.slice(0, 4).map((node, i) => (
                      <span key={i} className="flex items-center shrink-0">
                        {i > 0 && (
                          <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                        )}
                        <span
                          className="font-mono truncate max-w-[60px]"
                          title={node}
                        >
                          {node}
                        </span>
                      </span>
                    ))}
                    {pathNodes.length > 4 && (
                      <span className="text-muted-foreground/50">
                        +{pathNodes.length - 4}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground shrink-0 ml-2">
                  {count}x ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    index === 0
                      ? 'bg-primary'
                      : index === 1
                      ? 'bg-primary/80'
                      : index === 2
                      ? 'bg-primary/60'
                      : 'bg-primary/40'
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {analytics.pathPopularity.size > maxPaths && (
        <p className="text-xs text-muted-foreground text-center">
          +{analytics.pathPopularity.size - maxPaths} more unique paths
        </p>
      )}
    </div>
  )
}
