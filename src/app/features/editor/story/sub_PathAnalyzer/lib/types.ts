// Path Analyzer Types
// Types for story simulation, path tracking, and analytics

import type { StoryCard, Choice } from '@/lib/types'

/**
 * A single step in a story path simulation
 */
export interface PathStep {
  cardId: string
  cardTitle: string
  choiceLabel: string | null // null for entry card
  choiceId: string | null
  timestamp: number // ms since simulation start
  timeSpent: number // ms on this card
}

/**
 * A complete path through the story
 */
export interface SimulatedPath {
  id: string
  steps: PathStep[]
  isComplete: boolean // reached an ending (no choices)
  totalTime: number // ms
  choiceCount: number
  startedAt: number
  completedAt: number | null
}

/**
 * Aggregated analytics for a single card
 */
export interface CardAnalytics {
  cardId: string
  cardTitle: string
  visitCount: number
  averageTimeSpent: number // ms
  entryRate: number // % of paths that visit this card
  exitRate: number // % of paths that exit here (dead end)
  choiceDistribution: Map<string, number> // choiceId -> times selected
}

/**
 * Aggregated analytics for the entire story
 */
export interface StoryAnalytics {
  totalPaths: number
  completedPaths: number
  completionRate: number // 0-1
  averagePathLength: number // number of cards
  averageCompletionTime: number // ms
  mostVisitedCards: CardAnalytics[]
  leastVisitedCards: CardAnalytics[]
  deadEndCards: string[] // card IDs with no choices
  orphanedCards: string[] // cards not reachable from first card
  pathPopularity: Map<string, number> // serialized path signature -> count
  cardAnalytics: Map<string, CardAnalytics>
}

/**
 * Configuration for simulation runs
 */
export interface SimulationConfig {
  pathCount: number // number of paths to simulate
  minTimePerCard: number // ms - minimum simulated reading time
  maxTimePerCard: number // ms - maximum simulated reading time
  randomSeed?: number // for reproducible results
  weightByContent?: boolean // longer content = longer time
}

/**
 * Current state of the simulation
 */
export interface SimulationState {
  isRunning: boolean
  isPaused: boolean
  progress: number // 0-100
  currentPath: number
  totalPaths: number
  paths: SimulatedPath[]
  analytics: StoryAnalytics | null
  error: string | null
}

/**
 * Export format for analytics report
 */
export interface AnalyticsReport {
  generatedAt: string
  storyName: string
  storyId: string
  config: SimulationConfig
  summary: {
    totalPathsSimulated: number
    completionRate: string
    averagePathLength: number
    averageCompletionTime: string
    totalCards: number
    reachableCards: number
    deadEndCards: number
    orphanedCards: number
  }
  topPaths: Array<{
    rank: number
    pathSignature: string
    frequency: number
    percentage: string
  }>
  cardMetrics: Array<{
    cardTitle: string
    cardId: string
    visits: number
    visitRate: string
    averageTime: string
    isDeadEnd: boolean
    topChoice: string | null
  }>
}

/**
 * Default simulation configuration
 */
export const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  pathCount: 100,
  minTimePerCard: 3000, // 3 seconds
  maxTimePerCard: 15000, // 15 seconds
  weightByContent: true,
}

/**
 * Helper to format milliseconds as human-readable time
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

/**
 * Generate a unique path signature from steps
 */
export function getPathSignature(steps: PathStep[]): string {
  return steps.map(s => s.cardId.slice(0, 8)).join(' > ')
}
