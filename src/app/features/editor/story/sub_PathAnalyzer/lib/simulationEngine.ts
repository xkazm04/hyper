// Story Simulation Engine
// Executes story paths and collects analytics data

import type { StoryStack, StoryCard, Choice } from '@/lib/types'
import type {
  SimulationConfig,
  SimulatedPath,
  PathStep,
  StoryAnalytics,
  CardAnalytics,
  DEFAULT_SIMULATION_CONFIG,
} from './types'
import { getPathSignature } from './types'

/**
 * Simple seeded random number generator for reproducible simulations
 */
class SeededRandom {
  private seed: number

  constructor(seed: number) {
    this.seed = seed
  }

  next(): number {
    // Simple LCG algorithm
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff
    return this.seed / 0x7fffffff
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined
    return array[this.nextInt(0, array.length - 1)]
  }
}

/**
 * Build a graph structure for efficient navigation
 */
interface StoryGraph {
  cards: Map<string, StoryCard>
  choicesByCard: Map<string, Choice[]>
  firstCardId: string | null
  reachableCards: Set<string>
  deadEndCards: Set<string>
  orphanedCards: Set<string>
}

function buildStoryGraph(
  storyStack: StoryStack,
  cards: StoryCard[],
  choices: Choice[]
): StoryGraph {
  const cardsMap = new Map<string, StoryCard>()
  const choicesByCard = new Map<string, Choice[]>()

  // Index cards and choices
  for (const card of cards) {
    cardsMap.set(card.id, card)
    choicesByCard.set(card.id, [])
  }

  for (const choice of choices) {
    const cardChoices = choicesByCard.get(choice.storyCardId) || []
    cardChoices.push(choice)
    choicesByCard.set(choice.storyCardId, cardChoices)
  }

  // Sort choices by order index
  for (const [cardId, cardChoices] of choicesByCard) {
    cardChoices.sort((a, b) => a.orderIndex - b.orderIndex)
  }

  // Find reachable cards via BFS
  const reachableCards = new Set<string>()
  if (storyStack.firstCardId && cardsMap.has(storyStack.firstCardId)) {
    const queue = [storyStack.firstCardId]
    while (queue.length > 0) {
      const cardId = queue.shift()!
      if (reachableCards.has(cardId)) continue
      reachableCards.add(cardId)

      const cardChoices = choicesByCard.get(cardId) || []
      for (const choice of cardChoices) {
        if (cardsMap.has(choice.targetCardId) && !reachableCards.has(choice.targetCardId)) {
          queue.push(choice.targetCardId)
        }
      }
    }
  }

  // Find dead ends (cards with no choices)
  const deadEndCards = new Set<string>()
  for (const card of cards) {
    const cardChoices = choicesByCard.get(card.id) || []
    if (cardChoices.length === 0) {
      deadEndCards.add(card.id)
    }
  }

  // Find orphaned cards (not reachable from first card)
  const orphanedCards = new Set<string>()
  for (const card of cards) {
    if (!reachableCards.has(card.id)) {
      orphanedCards.add(card.id)
    }
  }

  return {
    cards: cardsMap,
    choicesByCard,
    firstCardId: storyStack.firstCardId,
    reachableCards,
    deadEndCards,
    orphanedCards,
  }
}

/**
 * Calculate simulated time spent on a card
 */
function calculateTimeOnCard(
  card: StoryCard,
  config: SimulationConfig,
  random: SeededRandom
): number {
  let baseTime = random.nextInt(config.minTimePerCard, config.maxTimePerCard)

  if (config.weightByContent) {
    // Longer content = proportionally longer time
    const contentLength = (card.content || '').length + (card.title || '').length
    const multiplier = 1 + Math.min(contentLength / 500, 1) // Up to 2x for 500+ chars
    baseTime = Math.floor(baseTime * multiplier)
  }

  return baseTime
}

/**
 * Simulate a single path through the story
 */
function simulateSinglePath(
  graph: StoryGraph,
  config: SimulationConfig,
  random: SeededRandom,
  pathId: string
): SimulatedPath | null {
  if (!graph.firstCardId || !graph.cards.has(graph.firstCardId)) {
    return null
  }

  const steps: PathStep[] = []
  let currentCardId: string = graph.firstCardId
  let totalTime = 0
  const startedAt = Date.now()

  // Track pending choice info for the next step
  let pendingChoiceLabel: string | null = null
  let pendingChoiceId: string | null = null

  // Prevent infinite loops - max 100 steps
  const maxSteps = 100

  while (steps.length < maxSteps) {
    const card = graph.cards.get(currentCardId)
    if (!card) break

    // Detect cycles - if we've visited this card 3 times, stop
    const visitCount = steps.filter(s => s.cardId === currentCardId).length
    if (visitCount >= 3) break

    const timeSpent = calculateTimeOnCard(card, config, random)
    const timestamp = totalTime

    // Add step with the choice that led here (null for first card)
    steps.push({
      cardId: card.id,
      cardTitle: card.title || 'Untitled',
      choiceLabel: pendingChoiceLabel,
      choiceId: pendingChoiceId,
      timestamp,
      timeSpent,
    })

    totalTime += timeSpent

    // Get choices for this card
    const availableChoices: Choice[] = graph.choicesByCard.get(currentCardId) || []

    if (availableChoices.length === 0) {
      // Dead end - path is complete
      break
    }

    // Randomly select a choice
    const selectedChoice: Choice | undefined = random.pick(availableChoices)
    if (!selectedChoice) break

    // Check if target is valid
    if (!graph.cards.has(selectedChoice.targetCardId)) {
      // Invalid target - stop here
      break
    }

    // Store choice info for the next step
    pendingChoiceLabel = selectedChoice.label
    pendingChoiceId = selectedChoice.id

    // Move to next card
    currentCardId = selectedChoice.targetCardId
  }

  // Determine if path is complete (ended at a dead end)
  const lastCardId = steps.length > 0 ? steps[steps.length - 1].cardId : null
  const isComplete = lastCardId ? graph.deadEndCards.has(lastCardId) : false

  return {
    id: pathId,
    steps,
    isComplete,
    totalTime,
    choiceCount: Math.max(0, steps.length - 1), // First card has no choice
    startedAt,
    completedAt: isComplete ? startedAt + totalTime : null,
  }
}

/**
 * Aggregate analytics from simulated paths
 */
function aggregateAnalytics(
  paths: SimulatedPath[],
  graph: StoryGraph
): StoryAnalytics {
  const cardAnalyticsMap = new Map<string, CardAnalytics>()
  const pathPopularity = new Map<string, number>()

  // Initialize card analytics for all reachable cards
  for (const cardId of graph.reachableCards) {
    const card = graph.cards.get(cardId)
    cardAnalyticsMap.set(cardId, {
      cardId,
      cardTitle: card?.title || 'Untitled',
      visitCount: 0,
      averageTimeSpent: 0,
      entryRate: 0,
      exitRate: 0,
      choiceDistribution: new Map(),
    })
  }

  // Process each path
  let totalCompletionTime = 0
  let totalPathLength = 0
  const completedPaths = paths.filter(p => p.isComplete)

  for (const path of paths) {
    // Track path popularity
    const signature = getPathSignature(path.steps)
    pathPopularity.set(signature, (pathPopularity.get(signature) || 0) + 1)

    totalPathLength += path.steps.length

    if (path.isComplete) {
      totalCompletionTime += path.totalTime
    }

    // Process each step
    for (let i = 0; i < path.steps.length; i++) {
      const step = path.steps[i]
      const analytics = cardAnalyticsMap.get(step.cardId)

      if (analytics) {
        analytics.visitCount++
        analytics.averageTimeSpent += step.timeSpent

        // Track choice distribution (for the choice leading TO this card)
        if (step.choiceId) {
          analytics.choiceDistribution.set(
            step.choiceId,
            (analytics.choiceDistribution.get(step.choiceId) || 0) + 1
          )
        }

        // Track if this is where the path ended
        if (i === path.steps.length - 1 && !path.isComplete) {
          // Path ended here but not at a dead end (cycle or error)
        }
      }
    }
  }

  // Calculate averages
  for (const analytics of cardAnalyticsMap.values()) {
    if (analytics.visitCount > 0) {
      analytics.averageTimeSpent = analytics.averageTimeSpent / analytics.visitCount
      analytics.entryRate = analytics.visitCount / paths.length
    }

    // Calculate exit rate for dead ends
    if (graph.deadEndCards.has(analytics.cardId)) {
      analytics.exitRate = analytics.visitCount / paths.length
    }
  }

  // Sort cards by visit count
  const sortedCards = Array.from(cardAnalyticsMap.values())
    .filter(c => c.visitCount > 0)
    .sort((a, b) => b.visitCount - a.visitCount)

  const mostVisited = sortedCards.slice(0, 5)
  const leastVisited = sortedCards.slice(-5).reverse()

  return {
    totalPaths: paths.length,
    completedPaths: completedPaths.length,
    completionRate: paths.length > 0 ? completedPaths.length / paths.length : 0,
    averagePathLength: paths.length > 0 ? totalPathLength / paths.length : 0,
    averageCompletionTime: completedPaths.length > 0
      ? totalCompletionTime / completedPaths.length
      : 0,
    mostVisitedCards: mostVisited,
    leastVisitedCards: leastVisited,
    deadEndCards: Array.from(graph.deadEndCards),
    orphanedCards: Array.from(graph.orphanedCards),
    pathPopularity,
    cardAnalytics: cardAnalyticsMap,
  }
}

export interface SimulationResult {
  paths: SimulatedPath[]
  analytics: StoryAnalytics
  graph: StoryGraph
}

/**
 * Run full story simulation
 */
export async function runSimulation(
  storyStack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  config: SimulationConfig,
  onProgress?: (progress: number, currentPath: number) => void
): Promise<SimulationResult> {
  const graph = buildStoryGraph(storyStack, cards, choices)
  const random = new SeededRandom(config.randomSeed || Date.now())
  const paths: SimulatedPath[] = []

  for (let i = 0; i < config.pathCount; i++) {
    const path = simulateSinglePath(graph, config, random, `path-${i}`)
    if (path) {
      paths.push(path)
    }

    // Report progress
    if (onProgress) {
      const progress = Math.round(((i + 1) / config.pathCount) * 100)
      onProgress(progress, i + 1)
    }

    // Yield to allow UI updates (every 10 paths)
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }

  const analytics = aggregateAnalytics(paths, graph)

  return { paths, analytics, graph }
}

/**
 * Get a quick preview of the story structure without full simulation
 */
export function analyzeStoryStructure(
  storyStack: StoryStack,
  cards: StoryCard[],
  choices: Choice[]
): {
  totalCards: number
  reachableCards: number
  deadEndCards: number
  orphanedCards: number
  maxDepth: number
  branchingFactor: number
} {
  const graph = buildStoryGraph(storyStack, cards, choices)

  // Calculate max depth via BFS
  let maxDepth = 0
  if (graph.firstCardId) {
    const depths = new Map<string, number>()
    const queue: Array<{ cardId: string; depth: number }> = [
      { cardId: graph.firstCardId, depth: 0 }
    ]

    while (queue.length > 0) {
      const { cardId, depth } = queue.shift()!
      if (depths.has(cardId)) continue
      depths.set(cardId, depth)
      maxDepth = Math.max(maxDepth, depth)

      const cardChoices = graph.choicesByCard.get(cardId) || []
      for (const choice of cardChoices) {
        if (!depths.has(choice.targetCardId)) {
          queue.push({ cardId: choice.targetCardId, depth: depth + 1 })
        }
      }
    }
  }

  // Calculate average branching factor
  let totalChoices = 0
  let cardsWithChoices = 0
  for (const cardId of graph.reachableCards) {
    const cardChoices = graph.choicesByCard.get(cardId) || []
    if (cardChoices.length > 0) {
      totalChoices += cardChoices.length
      cardsWithChoices++
    }
  }

  const branchingFactor = cardsWithChoices > 0
    ? totalChoices / cardsWithChoices
    : 0

  return {
    totalCards: cards.length,
    reachableCards: graph.reachableCards.size,
    deadEndCards: graph.deadEndCards.size,
    orphanedCards: graph.orphanedCards.size,
    maxDepth,
    branchingFactor,
  }
}
