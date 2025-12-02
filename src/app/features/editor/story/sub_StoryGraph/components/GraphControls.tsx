'use client'

import { Panel } from 'reactflow'
import { StatsOverview, GraphStats } from './sub_GraphControls'

// Re-export types for compatibility
export type { GraphStats }

// Simplified props - AI Companion is now in the bottom panel (AICompanionBottomPanel)
export interface GraphControlsProps {
  stats: GraphStats
}

/**
 * GraphControls - The control panel for the story graph
 * Contains stats overview only
 *
 * Note: Performance toggle, export/import, and validation controls
 * have been consolidated into the GraphToolsSidebar component
 */
export function GraphControls({ stats }: GraphControlsProps) {
  return (
    <Panel position="top-right" className="flex flex-col gap-3 items-end max-w-[280px]">
      <StatsOverview stats={stats} />
    </Panel>
  )
}
