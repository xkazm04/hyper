'use client'

import { Panel } from 'reactflow'
import { StatsOverview, GraphStats } from './sub_GraphControls'
import { PerformanceToggle } from './sub_GraphControls/PerformanceToggle'

// Re-export types for compatibility
export type { GraphStats }

// Simplified props - AI Companion is now in the bottom panel (AICompanionBottomPanel)
export interface GraphControlsProps {
  stats: GraphStats
}

/**
 * GraphControls - The control panel for the story graph
 * Contains stats overview and performance toggle
 *
 * Note: AI Companion has been moved to the bottom panel (AICompanionBottomPanel)
 * which is present for both content and graph views in StoryCardEditor
 */
export function GraphControls({ stats }: GraphControlsProps) {
  return (
    <Panel position="top-right" className="flex flex-col gap-3 items-end max-w-[280px]">
      <StatsOverview stats={stats} />
      <PerformanceToggle />
    </Panel>
  )
}
