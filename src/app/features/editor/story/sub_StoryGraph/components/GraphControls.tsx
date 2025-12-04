'use client'

import { Panel } from 'reactflow'
import { StatsOverview, GraphStats } from './sub_GraphControls'

// Re-export types for compatibility
export type { GraphStats }

// Simplified props - AI Companion is now in the bottom panel (AICompanionBottomPanel)
export interface GraphControlsProps {
  stats: GraphStats
  isHalloween?: boolean
}

/**
 * GraphControls - Compact stats bar for the story graph
 * Positioned at top-center, above the search bar
 *
 * Note: Performance toggle, export/import, and validation controls
 * have been consolidated into the GraphToolsSidebar component
 */
export function GraphControls({ stats, isHalloween = false }: GraphControlsProps) {
  return (
    <Panel position="top-center" className="flex flex-col items-center">
      <StatsOverview stats={stats} isHalloween={isHalloween} />
    </Panel>
  )
}
