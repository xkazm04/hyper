'use client'

import { useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { LegendItem } from '../GraphLegend'
import { Play, AlertTriangle, AlertCircle, MapPin, Circle, Minimize2, Maximize2 } from 'lucide-react'

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
}

export function StatsOverview({ stats }: StatsOverviewProps) {
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

  return (
    <div className="bg-card/95 border-2 border-border rounded-lg p-3 shadow-lg backdrop-blur-sm w-full">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Story Map</h3>
        <span className="ml-auto text-xs text-muted-foreground font-medium">{stats.visible}/{stats.total} scenes</span>
      </div>

      {stats.total > 1 && (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <button onClick={handleExpandAll} disabled={stats.collapsed === 0} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50 disabled:cursor-not-allowed" data-testid="expand-all-btn" aria-label="Expand all collapsed branches">
            <Maximize2 className="w-3 h-3" />Expand All
          </button>
          <button onClick={handleCollapseAll} disabled={stats.collapsed > 0 && stats.hidden > 0} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition-colors bg-muted hover:bg-muted/80 text-foreground disabled:opacity-50 disabled:cursor-not-allowed" data-testid="collapse-all-btn" aria-label="Collapse all branches">
            <Minimize2 className="w-3 h-3" />Collapse
          </button>
        </div>
      )}

      {stats.hidden > 0 && (
        <div className="mb-3 p-2 rounded-md bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{stats.hidden}</span> scene{stats.hidden !== 1 ? 's' : ''} hidden in {stats.collapsed} collapsed branch{stats.collapsed !== 1 ? 'es' : ''}</p>
        </div>
      )}

      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Completion</span>
          <span className="font-semibold text-foreground">{stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.complete / stats.total) * 100 : 0}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <LegendItem icon={<Play className="w-3 h-3" />} label="Start" color="bg-primary" borderColor="border-primary" />
        <LegendItem icon={<Circle className="w-3 h-3" />} label="Scene" color="bg-card" borderColor="border-border" />
        <LegendItem icon={<AlertTriangle className="w-3 h-3" />} label={`Orphaned (${stats.orphaned})`} color="bg-amber-500/20" borderColor="border-amber-500" alert={stats.orphaned > 0} />
        <LegendItem icon={<AlertCircle className="w-3 h-3" />} label={`Dead End (${stats.deadEnds})`} color="bg-red-500/20" borderColor="border-red-500" alert={stats.deadEnds > 0} />
      </div>
    </div>
  )
}
