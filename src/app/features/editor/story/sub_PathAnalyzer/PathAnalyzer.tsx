'use client'

import { useState } from 'react'
import { Activity, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useEditor } from '@/contexts/EditorContext'
import { cn } from '@/lib/utils'
import { usePathAnalyzer } from './lib/usePathAnalyzer'
import {
  SimulationControls,
  AnalyticsSummary,
  PathPopularityChart,
  CardMetricsTable,
  ExportButton,
  StructurePreview,
} from './components'

interface PathAnalyzerProps {
  className?: string
  onCardClick?: (cardId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function PathAnalyzer({
  className,
  onCardClick,
  isCollapsed = false,
  onToggleCollapse,
}: PathAnalyzerProps) {
  const { storyStack, storyCards, choices } = useEditor()
  const [showSettings, setShowSettings] = useState(false)

  const {
    state,
    config,
    structureAnalysis,
    setConfig,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    exportReport,
  } = usePathAnalyzer({
    storyStack,
    cards: storyCards,
    choices,
  })

  const report = exportReport()
  const hasResults = !!state.analytics

  // Handle card navigation
  const handleCardClick = (cardId: string) => {
    if (onCardClick) {
      onCardClick(cardId)
    }
  }

  // Collapsed header view
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className={cn(
          'flex items-center gap-2 w-full p-3 bg-card border border-border rounded-lg',
          'hover:bg-muted/50 transition-colors',
          className
        )}
        data-testid="path-analyzer-collapsed"
      >
        <Activity className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Path Analyzer</span>
        {hasResults && (
          <span className="ml-auto text-xs text-muted-foreground">
            {state.analytics?.completedPaths}/{state.analytics?.totalPaths} paths
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg overflow-hidden',
        className
      )}
      data-testid="path-analyzer-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Path Analyzer
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasResults && <ExportButton report={report} />}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 hover:bg-muted rounded transition-colors"
              data-testid="path-analyzer-collapse-btn"
            >
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {/* Structure Preview - Always visible */}
        {structureAnalysis && (
          <StructurePreview structure={structureAnalysis} />
        )}

        {/* Simulation Controls */}
        <SimulationControls
          state={state}
          config={config}
          onStart={startSimulation}
          onPause={pauseSimulation}
          onResume={resumeSimulation}
          onReset={resetSimulation}
          onConfigChange={setConfig}
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
          disabled={!storyStack || storyCards.length === 0}
        />

        {/* Results Section */}
        {state.analytics && (
          <>
            <div className="border-t border-border pt-4">
              <AnalyticsSummary
                analytics={state.analytics}
                totalCards={storyCards.length}
              />
            </div>

            <div className="border-t border-border pt-4">
              <PathPopularityChart analytics={state.analytics} />
            </div>

            <div className="border-t border-border pt-4">
              <CardMetricsTable
                analytics={state.analytics}
                onCardClick={handleCardClick}
              />
            </div>
          </>
        )}

        {/* Empty state when no simulation has run */}
        {!state.analytics && !state.isRunning && (
          <div className="text-center py-6">
            <Activity className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Run a simulation to analyze story paths
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              The analyzer will simulate readers navigating through your story
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
