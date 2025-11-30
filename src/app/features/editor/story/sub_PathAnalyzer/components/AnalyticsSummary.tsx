'use client'

import {
  BarChart3,
  Clock,
  GitBranch,
  Target,
  AlertTriangle,
  CheckCircle2,
  Route,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StoryAnalytics } from '../lib/types'
import { formatDuration } from '../lib/types'

interface AnalyticsSummaryProps {
  analytics: StoryAnalytics
  totalCards: number
  className?: string
}

interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

function MetricCard({
  icon,
  label,
  value,
  subValue,
  variant = 'default',
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 p-2.5 rounded-lg border',
        variant === 'success' && 'bg-green-500/5 border-green-500/20',
        variant === 'warning' && 'bg-yellow-500/5 border-yellow-500/20',
        variant === 'danger' && 'bg-red-500/5 border-red-500/20',
        variant === 'default' && 'bg-muted/30 border-border'
      )}
    >
      <div
        className={cn(
          'p-1.5 rounded-md',
          variant === 'success' && 'bg-green-500/10 text-green-600',
          variant === 'warning' && 'bg-yellow-500/10 text-yellow-600',
          variant === 'danger' && 'bg-red-500/10 text-red-600',
          variant === 'default' && 'bg-muted text-muted-foreground'
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div
          className={cn(
            'text-sm font-semibold',
            variant === 'success' && 'text-green-600',
            variant === 'warning' && 'text-yellow-600',
            variant === 'danger' && 'text-red-600',
            variant === 'default' && 'text-foreground'
          )}
        >
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-muted-foreground">{subValue}</div>
        )}
      </div>
    </div>
  )
}

export function AnalyticsSummary({
  analytics,
  totalCards,
  className,
}: AnalyticsSummaryProps) {
  const reachableCards = totalCards - analytics.orphanedCards.length
  const completionPercent = Math.round(analytics.completionRate * 100)

  // Determine variant based on completion rate
  const completionVariant =
    completionPercent >= 70
      ? 'success'
      : completionPercent >= 40
      ? 'warning'
      : 'danger'

  return (
    <div className={cn('space-y-3', className)}>
      <div className="text-xs font-medium text-foreground uppercase tracking-wide">
        Simulation Results
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          icon={<Route className="w-3.5 h-3.5" />}
          label="Paths Simulated"
          value={analytics.totalPaths}
          subValue={`${analytics.completedPaths} completed`}
        />

        <MetricCard
          icon={<Target className="w-3.5 h-3.5" />}
          label="Completion Rate"
          value={`${completionPercent}%`}
          variant={completionVariant}
        />

        <MetricCard
          icon={<GitBranch className="w-3.5 h-3.5" />}
          label="Avg Path Length"
          value={`${analytics.averagePathLength.toFixed(1)} cards`}
        />

        <MetricCard
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Avg Completion Time"
          value={formatDuration(analytics.averageCompletionTime)}
        />

        <MetricCard
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Reachable Cards"
          value={`${reachableCards}/${totalCards}`}
          variant={reachableCards === totalCards ? 'success' : 'warning'}
        />

        <MetricCard
          icon={
            analytics.deadEndCards.length > 0 ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )
          }
          label="Story Endings"
          value={analytics.deadEndCards.length}
          variant={analytics.deadEndCards.length > 0 ? 'success' : 'warning'}
          subValue={
            analytics.deadEndCards.length === 0
              ? 'Add endings!'
              : 'Dead-end cards'
          }
        />
      </div>

      {/* Warnings */}
      {analytics.orphanedCards.length > 0 && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-xs text-yellow-700">
            {analytics.orphanedCards.length} card(s) are not reachable from the
            starting card. Consider connecting them or removing them.
          </p>
        </div>
      )}
    </div>
  )
}
