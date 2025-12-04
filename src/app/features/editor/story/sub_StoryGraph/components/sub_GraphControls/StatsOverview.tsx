'use client'

import { useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { Play, AlertTriangle, AlertCircle, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GraphStats {
  total: number
  visible: number
  hidden: number
  collapsed: number
  orphaned: number
  deadEnds: number
  incomplete: number
  complete: number
  suggestions: number
}

interface StatsOverviewProps {
  stats: GraphStats
  isHalloween?: boolean
}

/**
 * Compact horizontal stats bar for story graph
 * Positioned at top-center, above the search bar
 */
export function StatsOverview({ stats, isHalloween = false }: StatsOverviewProps) {
  const { collapsedNodes, setCollapsedNodes, choices, storyStack } = useEditor()

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set())
  }, [setCollapsedNodes])

  const handleCollapseAll = useCallback(() => {
    const nodesWithChildren = new Set<string>()
    choices.forEach(choice => {
      if (choice.targetCardId) nodesWithChildren.add(choice.storyCardId)
    })
    if (storyStack?.firstCardId && nodesWithChildren.has(storyStack.firstCardId)) {
      setCollapsedNodes(new Set([storyStack.firstCardId]))
    } else {
      setCollapsedNodes(nodesWithChildren)
    }
  }, [choices, storyStack?.firstCardId, setCollapsedNodes])

  const completionPercent = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm backdrop-blur-sm",
      isHalloween
        ? "bg-purple-950/90 border-purple-500/30"
        : "bg-card/95 border-border"
    )}>
      {/* Scene count */}
      <div className="flex items-center gap-1.5">
        <Play className={cn("w-3 h-3", isHalloween ? "text-orange-400" : "text-primary")} />
        <span className="text-xs font-medium text-foreground">
          {stats.visible}/{stats.total}
        </span>
      </div>

      <div className="w-px h-4 bg-border/50" />

      {/* Completion bar */}
      <div className="flex items-center gap-1.5">
        <div className={cn(
          "w-16 h-1.5 rounded-full overflow-hidden",
          isHalloween ? "bg-purple-900/50" : "bg-muted"
        )}>
          <div
            className={cn(
              "h-full transition-all duration-500",
              isHalloween ? "bg-orange-500" : "bg-emerald-500"
            )}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground w-7">
          {completionPercent}%
        </span>
      </div>

      {/* Alerts - only show if issues exist */}
      {(stats.orphaned > 0 || stats.deadEnds > 0) && (
        <>
          <div className="w-px h-4 bg-border/50" />
          <div className="flex items-center gap-2">
            {stats.orphaned > 0 && (
              <div className="flex items-center gap-0.5" title={`${stats.orphaned} orphaned`}>
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-medium text-amber-500">{stats.orphaned}</span>
              </div>
            )}
            {stats.deadEnds > 0 && (
              <div className="flex items-center gap-0.5" title={`${stats.deadEnds} dead ends`}>
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-[10px] font-medium text-red-500">{stats.deadEnds}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Hidden nodes indicator */}
      {stats.hidden > 0 && (
        <>
          <div className="w-px h-4 bg-border/50" />
          <span className="text-[10px] text-muted-foreground">
            {stats.hidden} hidden
          </span>
        </>
      )}

      {/* Expand/Collapse controls */}
      {stats.total > 1 && (
        <>
          <div className="w-px h-4 bg-border/50" />
          <div className="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              disabled={stats.collapsed === 0}
              className={cn(
                "p-1 rounded transition-colors",
                "hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              title="Expand all"
              aria-label="Expand all collapsed branches"
            >
              <Maximize2 className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={handleCollapseAll}
              disabled={stats.collapsed > 0 && stats.hidden > 0}
              className={cn(
                "p-1 rounded transition-colors",
                "hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              title="Collapse all"
              aria-label="Collapse all branches"
            >
              <Minimize2 className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
