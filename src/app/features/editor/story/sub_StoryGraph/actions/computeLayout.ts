'use server'

import dagre from 'dagre'
import {
  getCachedLayout,
  setCachedLayout,
  createLayoutStructureHash,
  invalidateLayoutCache,
} from '../lib/layoutCache'

// Layout configuration constants (mirrored from useGraphLayout.ts)
const RANK_SEPARATION = 250
const NODE_SEPARATION = 60
const EDGE_SEPARATION = 25

// Node dimension constants (mirrored from nodeDimensions.ts)
const BASE_NODE_WIDTH = 140
const MIN_NODE_WIDTH = 120
const MAX_NODE_WIDTH = 220
const NODE_PADDING_X = 16
const NODE_PADDING_Y = 8
const NODE_HEADER_HEIGHT = 28
const NODE_FOOTER_HEIGHT = 32
const TITLE_LINE_HEIGHT = 16
const MIN_TITLE_HEIGHT = 32
const MAX_TITLE_LINES = 3
const AVG_CHAR_WIDTH = 6.8

/**
 * Input types for the server action
 */
export interface LayoutCard {
  id: string
  title: string
}

export interface LayoutChoice {
  id: string
  storyCardId: string
  targetCardId: string | null
  orderIndex: number
}

export interface ComputeLayoutInput {
  stackId: string
  cards: LayoutCard[]
  choices: LayoutChoice[]
  firstCardId: string | null
  collapsedNodes: string[]
}

export interface ComputeLayoutResult {
  positions: Record<string, { x: number; y: number }>
  cached: boolean
  structureHash: string
}

/**
 * Estimates text width for node sizing
 */
function estimateTextWidth(text: string, fontSize: number = 12): number {
  const scaledCharWidth = AVG_CHAR_WIDTH * (fontSize / 12)
  return text.length * scaledCharWidth
}

/**
 * Calculates title lines at given width
 */
function calculateTitleLines(title: string, availableWidth: number): number {
  if (!title || title.trim().length === 0) return 1
  const textWidth = estimateTextWidth(title)
  const lines = Math.ceil(textWidth / availableWidth)
  return Math.min(lines, MAX_TITLE_LINES)
}

/**
 * Computes node dimensions based on title
 */
function computeNodeDimensions(title: string): { width: number; height: number } {
  const cleanTitle = title?.trim() || 'Untitled'
  const titleLength = cleanTitle.length
  const textWidth = estimateTextWidth(cleanTitle)

  let nodeWidth: number

  if (titleLength <= 12) {
    nodeWidth = MIN_NODE_WIDTH
  } else if (titleLength <= 25) {
    const targetLineWidth = textWidth / 2
    nodeWidth = Math.min(
      Math.max(targetLineWidth + NODE_PADDING_X, MIN_NODE_WIDTH),
      MAX_NODE_WIDTH
    )
  } else {
    const targetLineWidth = textWidth / 2.5
    nodeWidth = Math.min(
      Math.max(targetLineWidth + NODE_PADDING_X, BASE_NODE_WIDTH),
      MAX_NODE_WIDTH
    )
  }

  nodeWidth = Math.round(nodeWidth / 10) * 10

  const availableTextWidth = nodeWidth - NODE_PADDING_X
  const titleLines = calculateTitleLines(cleanTitle, availableTextWidth)
  const titleHeight = Math.max(titleLines * TITLE_LINE_HEIGHT, MIN_TITLE_HEIGHT)
  const nodeHeight = NODE_HEADER_HEIGHT + titleHeight + NODE_FOOTER_HEIGHT + NODE_PADDING_Y

  return { width: nodeWidth, height: nodeHeight }
}

/**
 * Analyzes cards to compute depth and children map
 */
function analyzeCardStructure(
  cards: LayoutCard[],
  choices: LayoutChoice[],
  firstCardId: string | null
): {
  depth: Map<string, number>
  childrenMap: Map<string, string[]>
} {
  const depth = new Map<string, number>()
  const childrenMap = new Map<string, string[]>()

  // Build children map
  for (const choice of choices) {
    if (choice.targetCardId) {
      const existing = childrenMap.get(choice.storyCardId) || []
      if (!existing.includes(choice.targetCardId)) {
        childrenMap.set(choice.storyCardId, [...existing, choice.targetCardId])
      }
    }
  }

  // Calculate depth from first card using BFS
  if (firstCardId) {
    const queue: Array<{ id: string; level: number }> = [{ id: firstCardId, level: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      depth.set(id, level)

      const children = childrenMap.get(id) || []
      for (const childId of children) {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 })
        }
      }
    }
  }

  return { depth, childrenMap }
}

/**
 * Computes hidden nodes from collapsed state
 */
function computeHiddenNodes(
  collapsedNodes: Set<string>,
  childrenMap: Map<string, string[]>
): Set<string> {
  const hidden = new Set<string>()

  function addDescendants(nodeId: string, visited: Set<string>) {
    const children = childrenMap.get(nodeId) || []
    for (const childId of children) {
      if (visited.has(childId)) continue
      visited.add(childId)
      hidden.add(childId)
      addDescendants(childId, visited)
    }
  }

  for (const collapsedId of collapsedNodes) {
    addDescendants(collapsedId, new Set())
  }

  return hidden
}

/**
 * Server action to compute dagre layout for a story graph
 *
 * This action:
 * 1. Checks cache for existing valid layout
 * 2. If cache miss, computes full dagre layout
 * 3. Caches the result with TTL
 * 4. Returns positions keyed by card ID
 */
export async function computeGraphLayout(
  input: ComputeLayoutInput
): Promise<ComputeLayoutResult> {
  const { stackId, cards, choices, firstCardId, collapsedNodes } = input

  // Build structure hash for cache validation
  const cardTitles: Record<string, string> = {}
  for (const card of cards) {
    cardTitles[card.id] = card.title
  }

  const choiceConnections = choices.map(c => ({
    sourceId: c.storyCardId,
    targetId: c.targetCardId,
    orderIndex: c.orderIndex,
  }))

  const structureHash = createLayoutStructureHash(
    cards.map(c => c.id),
    cardTitles,
    choiceConnections,
    firstCardId,
    collapsedNodes
  )

  // Check cache first
  const cachedPositions = getCachedLayout(stackId, structureHash)
  if (cachedPositions) {
    return {
      positions: cachedPositions,
      cached: true,
      structureHash,
    }
  }

  // Analyze card structure
  const { depth, childrenMap } = analyzeCardStructure(cards, choices, firstCardId)

  // Compute hidden nodes from collapsed state
  const collapsedSet = new Set(collapsedNodes)
  const hiddenNodes = computeHiddenNodes(collapsedSet, childrenMap)

  // Filter visible cards and choices
  const visibleCards = cards.filter(c => !hiddenNodes.has(c.id))
  const visibleChoices = choices.filter(
    c => !hiddenNodes.has(c.storyCardId) && (!c.targetCardId || !hiddenNodes.has(c.targetCardId))
  )

  // Compute node dimensions
  const nodeDimensions = new Map<string, { width: number; height: number }>()
  for (const card of visibleCards) {
    nodeDimensions.set(card.id, computeNodeDimensions(card.title))
  }

  // Create dagre graph
  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: 'LR',
    align: 'UL',
    ranksep: RANK_SEPARATION,
    nodesep: NODE_SEPARATION,
    edgesep: EDGE_SEPARATION,
    marginx: 80,
    marginy: 80,
    ranker: 'tight-tree',
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add nodes with depth-aware sizing
  for (const card of visibleCards) {
    const cardDepth = depth.get(card.id) ?? 999
    const dimensions = nodeDimensions.get(card.id) || { width: BASE_NODE_WIDTH, height: 95 }
    g.setNode(card.id, {
      width: dimensions.width,
      height: dimensions.height,
      rank: cardDepth,
    })
  }

  // Group edges by source for branch ordering
  const edgesBySource = new Map<string, LayoutChoice[]>()
  for (const choice of visibleChoices) {
    if (choice.targetCardId && visibleCards.find(c => c.id === choice.targetCardId)) {
      const existing = edgesBySource.get(choice.storyCardId) || []
      existing.push(choice)
      edgesBySource.set(choice.storyCardId, existing)
    }
  }

  // Add edges with weight-based routing
  edgesBySource.forEach((choiceList, sourceId) => {
    const sortedChoices = choiceList.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    const branchCount = sortedChoices.length

    sortedChoices.forEach((choice, index) => {
      let weight = 1
      if (branchCount > 1) {
        weight = branchCount === 2
          ? (index === 0 ? 1.5 : 0.5)
          : (index === 0 ? 2 : index === branchCount - 1 ? 0.5 : 1)
      }

      if (choice.targetCardId) {
        g.setEdge(sourceId, choice.targetCardId, {
          weight,
          minlen: 1,
          labelpos: 'c',
        })
      }
    })
  })

  // Run dagre layout
  dagre.layout(g)

  // Extract positions with proper centering offset
  const positions: Record<string, { x: number; y: number }> = {}
  for (const card of visibleCards) {
    const nodeWithPosition = g.node(card.id)
    if (nodeWithPosition) {
      const dimensions = nodeDimensions.get(card.id) || { width: BASE_NODE_WIDTH, height: 95 }
      positions[card.id] = {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      }
    }
  }

  // Cache the result
  setCachedLayout(stackId, positions, structureHash)

  return {
    positions,
    cached: false,
    structureHash,
  }
}

/**
 * Server action to invalidate layout cache for a stack
 */
export async function invalidateStackLayoutCache(stackId: string): Promise<void> {
  invalidateLayoutCache(stackId)
}
