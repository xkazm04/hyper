'use client'

import { Panel } from 'reactflow'
import { AIStoryAssistant } from './AIStoryAssistant'
import { StatsOverview, AICoCreatorPanel, GraphStats, AISuggestionsState } from './sub_GraphControls'

export type { GraphStats, AISuggestionsState }

export interface GraphControlsProps {
  stats: GraphStats
  aiState: AISuggestionsState
  currentCardId: string | null
  storyCardsLength: number
}

/**
 * GraphControls - The control panel for the story graph
 * Contains stats overview, collapse/expand controls, legend, and AI assistant
 */
export function GraphControls({ stats, aiState, currentCardId, storyCardsLength }: GraphControlsProps) {
  return (
    <Panel position="top-right" className="flex flex-col gap-3 items-end max-w-[280px]">
      <StatsOverview stats={stats} />
      <AIStoryAssistant />
      <AICoCreatorPanel aiState={aiState} currentCardId={currentCardId} storyCardsLength={storyCardsLength} />
    </Panel>
  )
}
