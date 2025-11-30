import dagre from 'dagre'
import { StoryCard } from '@/lib/types'
import { Choice } from '@/lib/types'
import { NodeDimensions, BASE_NODE_WIDTH, NODE_HEADER_HEIGHT, MIN_TITLE_HEIGHT, NODE_FOOTER_HEIGHT, NODE_PADDING_Y } from '../lib/nodeDimensions'

// Default node dimensions (used when dynamic dimensions not available)
export const NODE_WIDTH = BASE_NODE_WIDTH
export const NODE_HEIGHT = NODE_HEADER_HEIGHT + MIN_TITLE_HEIGHT + NODE_FOOTER_HEIGHT + NODE_PADDING_Y

// Legacy constants for backward compatibility
export const DEFAULT_NODE_WIDTH = 160
export const DEFAULT_NODE_HEIGHT = 95

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
 * - Dynamic node sizing based on title length
 */
export function createHierarchicalLayout(
  storyCards: StoryCard[],
  choices: Choice[],
  analysis: CardAnalysis,
  nodeDimensions?: Map<string, NodeDimensions>
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

  // Add all nodes with depth-aware and dynamic sizing
  storyCards.forEach(card => {
    const depth = analysis.depth.get(card.id) ?? 999
    // Use dynamic dimensions if available, otherwise fallback to defaults
    const dimensions = nodeDimensions?.get(card.id)
    const nodeWidth = dimensions?.width ?? NODE_WIDTH
    const nodeHeight = dimensions?.height ?? NODE_HEIGHT
    g.setNode(card.id, {
      width: nodeWidth,
      height: nodeHeight,
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

  // Extract positions (use dynamic dimensions for offset calculation)
  const nodePositions = new Map<string, { x: number; y: number }>()
  storyCards.forEach(card => {
    const nodeWithPosition = g.node(card.id)
    if (nodeWithPosition) {
      // Use actual node dimensions for proper centering
      const dimensions = nodeDimensions?.get(card.id)
      const nodeWidth = dimensions?.width ?? NODE_WIDTH
      const nodeHeight = dimensions?.height ?? NODE_HEIGHT
      nodePositions.set(card.id, {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
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
 * Finds the roots of affected subtrees (nodes that need layout but whose parents don't)
 */
function findSubtreeRoots(
  nodesNeedingLayout: Set<string>,
  analysis: CardAnalysis,
  choices: Choice[]
): Set<string> {
  const roots = new Set<string>()
  const parentMap = new Map<string, string>()

  // Build parent map
  for (const choice of choices) {
    if (choice.targetCardId) {
      // If a child already has a parent, keep the one with lower depth
      const existingParent = parentMap.get(choice.targetCardId)
      if (!existingParent) {
        parentMap.set(choice.targetCardId, choice.storyCardId)
      } else {
        const existingDepth = analysis.depth.get(existingParent) ?? Infinity
        const newDepth = analysis.depth.get(choice.storyCardId) ?? Infinity
        if (newDepth < existingDepth) {
          parentMap.set(choice.targetCardId, choice.storyCardId)
        }
      }
    }
  }

  // Find roots: nodes in nodesNeedingLayout whose parent is NOT in nodesNeedingLayout
  for (const nodeId of nodesNeedingLayout) {
    const parent = parentMap.get(nodeId)
    if (!parent || !nodesNeedingLayout.has(parent)) {
      roots.add(nodeId)
    }
  }

  return roots
}

/**
 * Gets all descendants of a node
 */
function getDescendants(nodeId: string, childrenMap: Map<string, string[]>, visited = new Set<string>()): Set<string> {
  const descendants = new Set<string>()
  if (visited.has(nodeId)) return descendants
  visited.add(nodeId)

  const children = childrenMap.get(nodeId) || []
  for (const child of children) {
    descendants.add(child)
    const childDescendants = getDescendants(child, childrenMap, visited)
    childDescendants.forEach(d => descendants.add(d))
  }

  return descendants
}

/**
 * Determines optimal layout offset to align subtree with existing graph
 */
function calculateSubtreeOffset(
  subtreeRootId: string,
  dagrePosition: NodePosition,
  existingPositions: Map<string, NodePosition>,
  analysis: CardAnalysis,
  choices: Choice[]
): { offsetX: number; offsetY: number } {
  // Find parent of subtree root
  let parentId: string | null = null
  for (const choice of choices) {
    if (choice.targetCardId === subtreeRootId) {
      parentId = choice.storyCardId
      break
    }
  }

  if (parentId && existingPositions.has(parentId)) {
    const parentPos = existingPositions.get(parentId)!

    // Get all siblings (other targets from the same parent)
    const siblings = choices
      .filter(c => c.storyCardId === parentId && c.targetCardId)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

    const siblingIndex = siblings.findIndex(c => c.targetCardId === subtreeRootId)
    const siblingCount = siblings.length

    // Calculate expected Y position based on sibling distribution
    const totalHeight = (siblingCount - 1) * (NODE_HEIGHT + NODE_SEPARATION)
    const startY = parentPos.y - totalHeight / 2
    const expectedY = startY + siblingIndex * (NODE_HEIGHT + NODE_SEPARATION)

    // Calculate expected X position (one rank to the right of parent)
    const expectedX = parentPos.x + RANK_SEPARATION + NODE_WIDTH

    return {
      offsetX: expectedX - dagrePosition.x,
      offsetY: expectedY - dagrePosition.y,
    }
  }

  // No parent found, use depth-based positioning
  const depth = analysis.depth.get(subtreeRootId) ?? 0
  const expectedX = 80 + depth * (RANK_SEPARATION + NODE_WIDTH)

  return {
    offsetX: expectedX - dagrePosition.x,
    offsetY: 80 - dagrePosition.y,
  }
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
 * @param nodeDimensions Optional map of node dimensions for dynamic sizing
 * @returns New positions for all nodes
 */
export function createIncrementalLayout(
  storyCards: StoryCard[],
  choices: Choice[],
  analysis: CardAnalysis,
  existingPositions: Map<string, NodePosition>,
  nodesNeedingLayout: Set<string>,
  nodeDimensions?: Map<string, NodeDimensions>
): LayoutResult {
  // If nodesNeedingLayout is empty or covers most nodes, do full layout
  const needsFullLayout =
    nodesNeedingLayout.size === 0 ||
    nodesNeedingLayout.size >= storyCards.length * 0.7

  if (needsFullLayout) {
    return createHierarchicalLayout(storyCards, choices, analysis, nodeDimensions)
  }

  // Find the roots of affected subtrees
  const subtreeRoots = findSubtreeRoots(nodesNeedingLayout, analysis, choices)

  // If only 1-2 nodes need layout, use fast relative positioning
  if (nodesNeedingLayout.size <= 2 && existingPositions.size > 0) {
    const subtreeCards = storyCards.filter(c => nodesNeedingLayout.has(c.id))
    return calculateRelativePositions(
      subtreeCards,
      choices,
      analysis,
      existingPositions,
      nodesNeedingLayout,
      nodeDimensions
    )
  }

  // Start with existing positions
  const mergedPositions = new Map<string, NodePosition>(existingPositions)

  // Process each subtree root independently
  for (const rootId of subtreeRoots) {
    // Get all nodes in this subtree
    const subtreeNodeIds = new Set([rootId])
    const descendants = getDescendants(rootId, analysis.childrenMap)
    descendants.forEach(d => {
      if (nodesNeedingLayout.has(d)) {
        subtreeNodeIds.add(d)
      }
    })

    const subtreeCards = storyCards.filter(c => subtreeNodeIds.has(c.id))
    const subtreeChoices = choices.filter(c =>
      subtreeNodeIds.has(c.storyCardId) ||
      (c.targetCardId && subtreeNodeIds.has(c.targetCardId))
    )

    // Run dagre only on this subtree
    const subtreePositions = calculateSubtreeLayout(
      subtreeCards,
      subtreeChoices,
      analysis,
      existingPositions,
      subtreeNodeIds,
      nodeDimensions
    )

    // Merge subtree positions
    subtreePositions.forEach((pos, id) => {
      mergedPositions.set(id, pos)
    })
  }

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
  nodesNeedingLayout: Set<string>,
  nodeDimensions?: Map<string, NodeDimensions>
): LayoutResult {
  const newPositions = new Map<string, NodePosition>(existingPositions)

  for (const card of subtreeCards) {
    if (!nodesNeedingLayout.has(card.id)) continue

    // Get dynamic dimensions for this card
    const dimensions = nodeDimensions?.get(card.id)
    const nodeWidth = dimensions?.width ?? NODE_WIDTH
    const nodeHeight = dimensions?.height ?? NODE_HEIGHT

    // Find parent node (node that has a choice pointing to this card)
    const parentChoice = allChoices.find(c => c.targetCardId === card.id)
    const parentId = parentChoice?.storyCardId

    if (parentId && existingPositions.has(parentId)) {
      const parentPos = existingPositions.get(parentId)!
      // Get parent dimensions for proper offset
      const parentDimensions = nodeDimensions?.get(parentId)
      const parentWidth = parentDimensions?.width ?? NODE_WIDTH

      // Get sibling count and this node's index among siblings
      const siblings = allChoices
        .filter(c => c.storyCardId === parentId && c.targetCardId)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))

      const siblingIndex = siblings.findIndex(c => c.targetCardId === card.id)
      const siblingCount = siblings.length

      // Calculate vertical offset based on sibling position
      const totalHeight = (siblingCount - 1) * (nodeHeight + NODE_SEPARATION)
      const startY = parentPos.y - totalHeight / 2
      const yOffset = siblingIndex * (nodeHeight + NODE_SEPARATION)

      newPositions.set(card.id, {
        x: parentPos.x + RANK_SEPARATION + parentWidth,
        y: startY + yOffset,
      })
    } else {
      // No parent found, use depth-based positioning
      const depth = analysis.depth.get(card.id) ?? 0
      newPositions.set(card.id, {
        x: 80 + depth * (RANK_SEPARATION + nodeWidth),
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
  nodesNeedingLayout: Set<string>,
  nodeDimensions?: Map<string, NodeDimensions>
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
    // Use dynamic dimensions if available
    const dimensions = nodeDimensions?.get(card.id)
    const nodeWidth = dimensions?.width ?? NODE_WIDTH
    const nodeHeight = dimensions?.height ?? NODE_HEIGHT
    g.setNode(card.id, {
      width: nodeWidth,
      height: nodeHeight,
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
    // Get anchor node dimensions
    const anchorDimensions = nodeDimensions?.get(anchorNodeId)
    const anchorWidth = anchorDimensions?.width ?? NODE_WIDTH
    const anchorHeight = anchorDimensions?.height ?? NODE_HEIGHT

    // Find existing anchor position or calculate expected position
    if (existingPositions.has(anchorNodeId) && !nodesNeedingLayout.has(anchorNodeId)) {
      // Anchor exists and doesn't need relayout - align to it
      const existingAnchor = existingPositions.get(anchorNodeId)!
      if (dagreAnchor) {
        offsetX = existingAnchor.x - (dagreAnchor.x - anchorWidth / 2)
        offsetY = existingAnchor.y - (dagreAnchor.y - anchorHeight / 2)
      }
    } else {
      // Calculate based on depth
      if (dagreAnchor) {
        offsetX = 80 + anchorDepth * (RANK_SEPARATION + anchorWidth) - (dagreAnchor.x - anchorWidth / 2)
        // Find parent's Y position for vertical alignment
        const parentChoice = subtreeChoices.find(c => c.targetCardId === anchorNodeId)
        if (parentChoice && existingPositions.has(parentChoice.storyCardId)) {
          const parentPos = existingPositions.get(parentChoice.storyCardId)!
          offsetY = parentPos.y - (dagreAnchor.y - anchorHeight / 2)
        }
      }
    }
  }

  // Apply positions with offset (use dynamic dimensions for proper centering)
  subtreeCards.forEach(card => {
    const nodeWithPosition = g.node(card.id)
    if (nodeWithPosition) {
      const dimensions = nodeDimensions?.get(card.id)
      const nodeWidth = dimensions?.width ?? NODE_WIDTH
      const nodeHeight = dimensions?.height ?? NODE_HEIGHT
      subtreePositions.set(card.id, {
        x: nodeWithPosition.x - nodeWidth / 2 + offsetX,
        y: nodeWithPosition.y - nodeHeight / 2 + offsetY,
      })
    }
  })

  return subtreePositions
}
