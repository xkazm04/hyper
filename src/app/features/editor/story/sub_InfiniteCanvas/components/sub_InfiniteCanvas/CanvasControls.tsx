'use client'

import { Panel } from 'reactflow'
import { SuggestedCard } from '@/lib/types/ai-canvas'
import { StatsCard } from './StatsCard'
import { AISuggestionsPanel } from './AISuggestionsPanel'

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
  suggestions: SuggestedCard[]
  isGenerating: boolean
  error: string | null
  currentCardId: string | null
  storyCardsLength: number
  onGenerateSuggestions: (sourceCardId?: string) => void
  onDismissAllSuggestions: () => void
}

/**
 * CanvasControls - Stats panel and AI controls for the infinite canvas
 */
export function CanvasControls({
  stats, suggestions, isGenerating, error, currentCardId, storyCardsLength,
  onGenerateSuggestions, onDismissAllSuggestions,
}: CanvasControlsProps) {
  return (
    <Panel position="top-right" className="flex flex-col gap-3 items-end max-w-[300px]">
      <StatsCard stats={stats} />
      <AISuggestionsPanel
        suggestions={suggestions}
        isGenerating={isGenerating}
        error={error}
        currentCardId={currentCardId}
        storyCardsLength={storyCardsLength}
        onGenerateSuggestions={onGenerateSuggestions}
        onDismissAllSuggestions={onDismissAllSuggestions}
      />
    </Panel>
  )
}
