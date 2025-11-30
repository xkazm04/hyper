'use client'

import { Panel } from 'reactflow'
import { StatsOverview, GraphStats } from './sub_GraphControls'
import { AICompanion } from '../../sub_AICompanion'

// Re-export types for compatibility
export type { GraphStats }

// Simplified props - AI state is now internal to AICompanion
export interface GraphControlsProps {
  stats: GraphStats
}

/**
 * GraphControls - The control panel for the story graph
 * Contains stats overview and the unified AI Companion
 */
export function GraphControls({ stats }: GraphControlsProps) {
  return (
    <Panel position="top-right" className="flex flex-col gap-3 items-end max-w-[280px]">
      <StatsOverview stats={stats} />
      <AICompanion className="w-[280px]" defaultExpanded={false} />
    </Panel>
  )
}
