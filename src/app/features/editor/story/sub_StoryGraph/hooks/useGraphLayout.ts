import dagre from 'dagre'
import { StoryCard } from '@/lib/types'
import { Choice } from '@/lib/types'

// Optimized node dimensions for large graphs (140px width nodes)
export const NODE_WIDTH = 160
export const NODE_HEIGHT = 95

// Spacing optimized for decision trees with up to 3 branches
export const RANK_SEPARATION = 250
export const NODE_SEPARATION = 60
export const EDGE_SEPARATION = 25

// Edge styling constants for visual hierarchy
export const EDGE_COLORS = {
  branch1: { hue: 220, sat: 60, light: 50 },
  branch2: { hue: 160, sat: 50, light: 45 },
  branch3: { hue: 280, sat: 50, light: 55 },
  single: { hue: 210, sat: 30, light: 55 },
}

export interface CardAnalysis {
  orphanedCards: Set<string>
  deadEndCards: Set<string>
  incompleteCards: Set<string>
  choiceCount: Map<string, number>
  depth: Map<string, number>
  childrenMap: Map<string, string[]>
}

export interface NodePosition {
  x: number
  y: number
}

export interface LayoutResult {
  nodePositions: Map<string, NodePosition>
}

/**
 * Creates a hierarchical layout optimized for decision trees with up to 3 branches
 *
 * Layout strategy for 100+ nodes:
 * - Left-to-right flow (chronological reading)
 * - Depth-based ranking to ensure proper tree structure
 * - Vertical fan-out for branches at angles that remain readable
 * - Increased spacing at deeper levels to prevent overlap
 */
export function createHierarchicalLayout(
  storyCards: StoryCard[],
  choices: Choice[],
  analysis: CardAnalysis
): { nodePositions: Map<string, { x: number; y: number }> } {
  const g = new dagre.graphlib.Graph()

  // Configure for left-to-right decision tree layout
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

  // Add all nodes with depth-aware sizing
  storyCards.forEach(card => {
    const depth = analysis.depth.get(card.id) ?? 999
    g.setNode(card.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      rank: depth,
    })
  })

  // Group edges by source for branch ordering
  const edgesBySource = new Map<string, Choice[]>()
  choices
    .filter(choice => choice.targetCardId && storyCards.find(c => c.id === choice.targetCardId))
    .forEach(choice => {
      const existing = edgesBySource.get(choice.storyCardId) || []
      existing.push(choice)
      edgesBySource.set(choice.storyCardId, existing)
    })

  // Add edges sorted by orderIndex for consistent vertical ordering
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

      g.setEdge(sourceId, choice.targetCardId, {
        weight,
        minlen: 1,
        labelpos: 'c',
      })
    })
  })

  // Calculate layout
  dagre.layout(g)

  // Extract positions
  const nodePositions = new Map<string, { x: number; y: number }>()
  storyCards.forEach(card => {
    const nodeWithPosition = g.node(card.id)
    if (nodeWithPosition) {
      nodePositions.set(card.id, {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      })
    }
  })

  return { nodePositions }
}

/**
 * Get edge color based on branch index for visual distinction
 */
export function getEdgeColor(branchIndex: number, totalBranches: number): string {
  if (totalBranches === 1) {
    const { hue, sat, light } = EDGE_COLORS.single
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }

  const colors = [EDGE_COLORS.branch1, EDGE_COLORS.branch2, EDGE_COLORS.branch3]
  const color = colors[Math.min(branchIndex, colors.length - 1)]
  return `hsl(${color.hue}, ${color.sat}%, ${color.light}%)`
}

/**
 * Creates an incremental layout for a subset of nodes (subtree)
 * Re-uses existing positions for nodes not in the affected set
 *
 * @param storyCards All story cards
 * @param choices All choices
 * @param analysis Card analysis with depth info
 * @param existingPositions Previous positions to preserve for unchanged nodes
 * @param nodesNeedingLayout Set of node IDs that need new positions (empty = full layout)
 * @returns New positions for all nodes
 */
export function createIncrementalLayout(
  storyCards: StoryCard[],
  choices: Choice[],
  analysis: CardAnalysis,
  existingPositions: Map<string, NodePosition>,
  nodesNeedingLayout: Set<string>
): LayoutResult {
  // If nodesNeedingLayout is empty or covers most nodes, do full layout
  const needsFullLayout =
    nodesNeedingLayout.size === 0 ||
    nodesNeedingLayout.size >= storyCards.length * 0.7

  if (needsFullLayout) {
    return createHierarchicalLayout(storyCards, choices, analysis)
  }

  // Identify subtree root(s) for incremental layout
  // We need to find the highest ancestor in nodesNeedingLayout that is connected
  const subtreeCards = storyCards.filter(c => nodesNeedingLayout.has(c.id))
  const subtreeChoices = choices.filter(c =>
    nodesNeedingLayout.has(c.storyCardId) ||
    (c.targetCardId && nodesNeedingLayout.has(c.targetCardId))
  )

  // If subtree is too small (1-2 nodes), we can calculate positions relative to parent
  if (subtreeCards.length <= 2 && existingPositions.size > 0) {
    return calculateRelativePositions(
      subtreeCards,
      choices,
      analysis,
      existingPositions,
      nodesNeedingLayout
    )
  }

  // Run dagre only on the affected subtree
  const subtreePositions = calculateSubtreeLayout(
    subtreeCards,
    subtreeChoices,
    analysis,
    existingPositions,
    nodesNeedingLayout
  )

  // Merge with existing positions
  const mergedPositions = new Map<string, NodePosition>(existingPositions)
  subtreePositions.forEach((pos, id) => {
    mergedPositions.set(id, pos)
  })

  return { nodePositions: mergedPositions }
}

/**
 * Calculate positions for small node additions relative to their parent
 */
function calculateRelativePositions(
  subtreeCards: StoryCard[],
  allChoices: Choice[],
  analysis: CardAnalysis,
  existingPositions: Map<string, NodePosition>,
  nodesNeedingLayout: Set<string>
): LayoutResult {
  const newPositions = new Map<string, NodePosition>(existingPositions)

  for (const card of subtreeCards) {
    if (!nodesNeedingLayout.has(card.id)) continue

    // Find parent node (node that has a choice pointing to this card)
    const parentChoice = allChoices.find(c => c.targetCardId === card.id)
    const parentId = parentChoice?.storyCardId

    if (parentId && existingPositions.has(parentId)) {
      const parentPos = existingPositions.get(parentId)!

      // Get sibling count and this node's index among siblings
      const siblings = allChoices
        .filter(c => c.storyCardId === parentId && c.targetCardId)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

      const siblingIndex = siblings.findIndex(c => c.targetCardId === card.id)
      const siblingCount = siblings.length

      // Calculate vertical offset based on sibling position
      const totalHeight = (siblingCount - 1) * (NODE_HEIGHT + NODE_SEPARATION)
      const startY = parentPos.y - totalHeight / 2
      const yOffset = siblingIndex * (NODE_HEIGHT + NODE_SEPARATION)

      newPositions.set(card.id, {
        x: parentPos.x + RANK_SEPARATION + NODE_WIDTH,
        y: startY + yOffset,
      })
    } else {
      // No parent found, use depth-based positioning
      const depth = analysis.depth.get(card.id) ?? 0
      newPositions.set(card.id, {
        x: 80 + depth * (RANK_SEPARATION + NODE_WIDTH),
        y: 80,
      })
    }
  }

  return { nodePositions: newPositions }
}

/**
 * Run dagre layout only on the affected subtree
 */
function calculateSubtreeLayout(
  subtreeCards: StoryCard[],
  subtreeChoices: Choice[],
  analysis: CardAnalysis,
  existingPositions: Map<string, NodePosition>,
  nodesNeedingLayout: Set<string>
): Map<string, NodePosition> {
  const g = new dagre.graphlib.Graph()

  g.setGraph({
    rankdir: 'LR',
    align: 'UL',
    ranksep: RANK_SEPARATION,
    nodesep: NODE_SEPARATION,
    edgesep: EDGE_SEPARATION,
    marginx: 0,
    marginy: 0,
    ranker: 'tight-tree',
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Find anchor point: the minimum depth node in the subtree
  let anchorNodeId: string | null = null
  let minDepth = Infinity

  subtreeCards.forEach(card => {
    const depth = analysis.depth.get(card.id) ?? 999
    g.setNode(card.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      rank: depth,
    })

    if (depth < minDepth) {
      minDepth = depth
      anchorNodeId = card.id
    }
  })

  // Build edge map for subtree
  const edgesBySource = new Map<string, Choice[]>()
  subtreeChoices
    .filter(choice => choice.targetCardId && subtreeCards.find(c => c.id === choice.targetCardId))
    .forEach(choice => {
      const existing = edgesBySource.get(choice.storyCardId) || []
      existing.push(choice)
      edgesBySource.set(choice.storyCardId, existing)
    })

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

      if (g.hasNode(choice.targetCardId)) {
        g.setEdge(sourceId, choice.targetCardId, {
          weight,
          minlen: 1,
          labelpos: 'c',
        })
      }
    })
  })

  // Run layout
  dagre.layout(g)

  // Extract positions and apply offset to align with existing graph
  const subtreePositions = new Map<string, NodePosition>()
  let offsetX = 0
  let offsetY = 0

  // Calculate offset from anchor node's expected position vs dagre position
  if (anchorNodeId) {
    const dagreAnchor = g.node(anchorNodeId)
    const anchorDepth = analysis.depth.get(anchorNodeId) ?? 0

    // Find existing anchor position or calculate expected position
    if (existingPositions.has(anchorNodeId) && !nodesNeedingLayout.has(anchorNodeId)) {
      // Anchor exists and doesn't need relayout - align to it
      const existingAnchor = existingPositions.get(anchorNodeId)!
      if (dagreAnchor) {
        offsetX = existingAnchor.x - (dagreAnchor.x - NODE_WIDTH / 2)
        offsetY = existingAnchor.y - (dagreAnchor.y - NODE_HEIGHT / 2)
      }
    } else {
      // Calculate based on depth
      if (dagreAnchor) {
        offsetX = 80 + anchorDepth * (RANK_SEPARATION + NODE_WIDTH) - (dagreAnchor.x - NODE_WIDTH / 2)
        // Find parent's Y position for vertical alignment
        const parentChoice = subtreeChoices.find(c => c.targetCardId === anchorNodeId)
        if (parentChoice && existingPositions.has(parentChoice.storyCardId)) {
          const parentPos = existingPositions.get(parentChoice.storyCardId)!
          offsetY = parentPos.y - (dagreAnchor.y - NODE_HEIGHT / 2)
        }
      }
    }
  }

  // Apply positions with offset
  subtreeCards.forEach(card => {
    const nodeWithPosition = g.node(card.id)
    if (nodeWithPosition) {
      subtreePositions.set(card.id, {
        x: nodeWithPosition.x - NODE_WIDTH / 2 + offsetX,
        y: nodeWithPosition.y - NODE_HEIGHT / 2 + offsetY,
      })
    }
  })

  return subtreePositions
}
