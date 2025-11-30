'use client'

import { useState, useCallback, useRef } from 'react'
import type { StoryStack, StoryCard, Choice } from '@/lib/types'
import type {
  SimulationConfig,
  SimulationState,
  StoryAnalytics,
  SimulatedPath,
  AnalyticsReport,
} from './types'
import { DEFAULT_SIMULATION_CONFIG, formatDuration, getPathSignature } from './types'
import { runSimulation, analyzeStoryStructure } from './simulationEngine'

export interface UsePathAnalyzerOptions {
  storyStack: StoryStack | null
  cards: StoryCard[]
  choices: Choice[]
}

export interface UsePathAnalyzerReturn {
  // State
  state: SimulationState
  config: SimulationConfig
  structureAnalysis: {
    totalCards: number
    reachableCards: number
    deadEndCards: number
    orphanedCards: number
    maxDepth: number
    branchingFactor: number
  } | null

  // Actions
  setConfig: (config: Partial<SimulationConfig>) => void
  startSimulation: () => Promise<void>
  pauseSimulation: () => void
  resumeSimulation: () => void
  resetSimulation: () => void

  // Export
  exportReport: () => AnalyticsReport | null
}

const initialState: SimulationState = {
  isRunning: false,
  isPaused: false,
  progress: 0,
  currentPath: 0,
  totalPaths: 0,
  paths: [],
  analytics: null,
  error: null,
}

export function usePathAnalyzer({
  storyStack,
  cards,
  choices,
}: UsePathAnalyzerOptions): UsePathAnalyzerReturn {
  const [state, setState] = useState<SimulationState>(initialState)
  const [config, setConfigState] = useState<SimulationConfig>(DEFAULT_SIMULATION_CONFIG)
  const abortRef = useRef(false)

  // Get structure analysis (computed synchronously)
  const structureAnalysis = storyStack && cards.length > 0
    ? analyzeStoryStructure(storyStack, cards, choices)
    : null

  // Update config
  const setConfig = useCallback((updates: Partial<SimulationConfig>) => {
    setConfigState(prev => ({ ...prev, ...updates }))
  }, [])

  // Start simulation
  const startSimulation = useCallback(async () => {
    if (!storyStack || cards.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No story to simulate. Add cards to get started.',
      }))
      return
    }

    if (!storyStack.firstCardId) {
      setState(prev => ({
        ...prev,
        error: 'No first card set. Please set an entry point for your story.',
      }))
      return
    }

    abortRef.current = false

    setState({
      isRunning: true,
      isPaused: false,
      progress: 0,
      currentPath: 0,
      totalPaths: config.pathCount,
      paths: [],
      analytics: null,
      error: null,
    })

    try {
      const result = await runSimulation(
        storyStack,
        cards,
        choices,
        config,
        (progress, currentPath) => {
          if (abortRef.current) return
          setState(prev => ({
            ...prev,
            progress,
            currentPath,
          }))
        }
      )

      if (abortRef.current) return

      setState(prev => ({
        ...prev,
        isRunning: false,
        progress: 100,
        currentPath: config.pathCount,
        paths: result.paths,
        analytics: result.analytics,
      }))
    } catch (error) {
      if (abortRef.current) return

      setState(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Simulation failed',
      }))
    }
  }, [storyStack, cards, choices, config])

  // Pause simulation (currently just aborts - could be enhanced)
  const pauseSimulation = useCallback(() => {
    abortRef.current = true
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true,
    }))
  }, [])

  // Resume simulation (re-runs from start for now)
  const resumeSimulation = useCallback(() => {
    startSimulation()
  }, [startSimulation])

  // Reset simulation
  const resetSimulation = useCallback(() => {
    abortRef.current = true
    setState(initialState)
  }, [])

  // Export analytics report
  const exportReport = useCallback((): AnalyticsReport | null => {
    if (!state.analytics || !storyStack) return null

    const { analytics } = state

    // Get top 10 paths
    const sortedPaths = Array.from(analytics.pathPopularity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    const topPaths = sortedPaths.map(([signature, count], index) => ({
      rank: index + 1,
      pathSignature: signature,
      frequency: count,
      percentage: `${((count / analytics.totalPaths) * 100).toFixed(1)}%`,
    }))

    // Get card metrics
    const cardMetrics = Array.from(analytics.cardAnalytics.values())
      .filter(c => c.visitCount > 0)
      .sort((a, b) => b.visitCount - a.visitCount)
      .map(card => {
        // Find the most popular choice for this card
        let topChoice: string | null = null
        let topChoiceCount = 0

        card.choiceDistribution.forEach((count, choiceId) => {
          if (count > topChoiceCount) {
            topChoiceCount = count
            const choice = choices.find(c => c.id === choiceId)
            topChoice = choice?.label || null
          }
        })

        return {
          cardTitle: card.cardTitle,
          cardId: card.cardId,
          visits: card.visitCount,
          visitRate: `${(card.entryRate * 100).toFixed(1)}%`,
          averageTime: formatDuration(card.averageTimeSpent),
          isDeadEnd: analytics.deadEndCards.includes(card.cardId),
          topChoice,
        }
      })

    return {
      generatedAt: new Date().toISOString(),
      storyName: storyStack.name,
      storyId: storyStack.id,
      config,
      summary: {
        totalPathsSimulated: analytics.totalPaths,
        completionRate: `${(analytics.completionRate * 100).toFixed(1)}%`,
        averagePathLength: Math.round(analytics.averagePathLength * 10) / 10,
        averageCompletionTime: formatDuration(analytics.averageCompletionTime),
        totalCards: cards.length,
        reachableCards: cards.length - analytics.orphanedCards.length,
        deadEndCards: analytics.deadEndCards.length,
        orphanedCards: analytics.orphanedCards.length,
      },
      topPaths,
      cardMetrics,
    }
  }, [state.analytics, storyStack, cards, choices, config])

  return {
    state,
    config,
    structureAnalysis,
    setConfig,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    exportReport,
  }
}
