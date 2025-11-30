'use client'

import { Panel } from 'reactflow'
import { StatsCard } from './StatsCard'
import { AICompanion } from '../../../sub_AICompanion'

interface CanvasStats {
  total: number
  orphaned: number
  deadEnds: number
  incomplete: number
  complete: number
  suggestions: number
}

interface CanvasControlsProps {
  stats: CanvasStats
}

/**
 * CanvasControls - Stats panel and AI controls for the infinite canvas
 * Now uses the unified AICompanion component
 */
export function CanvasControls({ stats }: CanvasControlsProps) {
  return (
    <Panel position="top-right" className="flex flex-col gap-3 items-end max-w-[300px]">
      <StatsCard stats={stats} />
      <AICompanion className="w-[280px]" defaultExpanded={false} />
    </Panel>
  )
}
