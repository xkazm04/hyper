import { useMemo } from 'react'
import { Choice } from '@/lib/types'

export interface PathMilestone {
  /** Node ID at this milestone */
  nodeId: string
  /** Position along the path (0 to 1) */
  position: number
  /** Whether this is the start node */
  isStart: boolean
  /** Whether this is the current node */
  isCurrent: boolean
  /** Whether this is a terminal/ending node */
  isTerminal: boolean
  /** Whether this is a branching point (has multiple choices) */
  isBranchPoint: boolean
  /** Depth in the story tree */
  depth: number
}

export interface PathProgressData {
  /** Progress from 0 to 1 (percentage of path traversed) */
  progress: number
  /** Previous progress value for animation direction detection */
  previousProgress: number
  /** Whether moving forward (deeper into story) */
  isMovingForward: boolean
  /** Current depth in the story */
  currentDepth: number
  /** Maximum depth reachable from root */
  maxDepth: number
  /** Whether the current node is a terminal (ending) */
  isTerminal: boolean
  /** Milestone nodes along the path */
  milestones: PathMilestone[]
  /** The ordered path from root to current node */
  orderedPath: string[]
  /** Total number of nodes in the graph */
  totalNodes: number
}

/**
 * Calculate the maximum depth reachable from a starting node via DFS
 */
function getMaxDepthFromNode(
  nodeId: string,
  depthMap: Map<string, number>,
  childrenMap: Map<string, string[]>,
  visited: Set<string> = new Set()
): number {
  if (visited.has(nodeId)) return depthMap.get(nodeId) ?? 0
  visited.add(nodeId)

  const nodeDepth = depthMap.get(nodeId) ?? 0
  const children = childrenMap.get(nodeId) || []

  if (children.length === 0) {
    return nodeDepth
  }

  let maxChildDepth = nodeDepth
  for (const childId of children) {
    const childMaxDepth = getMaxDepthFromNode(childId, depthMap, childrenMap, visited)
    maxChildDepth = Math.max(maxChildDepth, childMaxDepth)
  }

  return maxChildDepth
}

/**
 * Build parent and children maps from choices
 */
function buildRelationshipMaps(choices: Choice[]): {
  parentMap: Map<string, { parentId: string; choiceId: string }[]>
  childrenMap: Map<string, string[]>
  choiceCountMap: Map<string, number>
} {
  const parentMap = new Map<string, { parentId: string; choiceId: string }[]>()
  const childrenMap = new Map<string, string[]>()
  const choiceCountMap = new Map<string, number>()

  for (const choice of choices) {
    // Track choice count per card
    const count = choiceCountMap.get(choice.storyCardId) ?? 0
    choiceCountMap.set(choice.storyCardId, count + 1)

    if (choice.targetCardId) {
      // Parent map: child -> parents
      const parents = parentMap.get(choice.targetCardId) || []
      parents.push({ parentId: choice.storyCardId, choiceId: choice.id })
      parentMap.set(choice.targetCardId, parents)

      // Children map: parent -> children
      const children = childrenMap.get(choice.storyCardId) || []
      if (!children.includes(choice.targetCardId)) {
        children.push(choice.targetCardId)
      }
      childrenMap.set(choice.storyCardId, children)
    }
  }

  return { parentMap, childrenMap, choiceCountMap }
}

/**
 * Calculate depth of each node from the root using BFS
 */
function calculateDepthMap(firstCardId: string, childrenMap: Map<string, string[]>): Map<string, number> {
  const depthMap = new Map<string, number>()
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: firstCardId, depth: 0 }]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    depthMap.set(nodeId, depth)

    const children = childrenMap.get(nodeId) || []
    for (const childId of children) {
      if (!visited.has(childId)) {
        queue.push({ nodeId: childId, depth: depth + 1 })
      }
    }
  }

  return depthMap
}

/**
 * Find path from root to current node using BFS
 */
function findPathToNode(
  currentCardId: string,
  firstCardId: string,
  parentMap: Map<string, { parentId: string; choiceId: string }[]>
): string[] {
  if (currentCardId === firstCardId) {
    return [firstCardId]
  }

  // BFS from current backwards to root
  const queue: { nodeId: string; path: string[] }[] = [
    { nodeId: currentCardId, path: [currentCardId] }
  ]
  const visited = new Set<string>([currentCardId])

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!

    if (nodeId === firstCardId) {
      return path.reverse()
    }

    const parents = parentMap.get(nodeId) || []
    for (const { parentId } of parents) {
      if (!visited.has(parentId)) {
        visited.add(parentId)
        queue.push({
          nodeId: parentId,
          path: [...path, parentId],
        })
      }
    }
  }

  // No path found (orphaned node)
  return [currentCardId]
}

/**
 * usePathProgress - Hook to calculate animated path progress data
 *
 * Provides progress information for a visual progress bar that:
 * - Expands as the user moves forward through the narrative
 * - Retracts when moving back
 * - Shows milestone icons at key nodes
 * - Glows to indicate progress
 *
 * @param currentCardId The currently selected card ID
 * @param firstCardId The root/first card ID of the story
 * @param choices All choices in the story
 * @param previousCardId The previously selected card (for animation direction)
 * @param nodeIds Set of all node IDs in the graph
 * @returns PathProgressData with progress, milestones, and animation state
 */
export function usePathProgress(
  currentCardId: string | null,
  firstCardId: string | null,
  choices: Choice[],
  previousCardId: string | null,
  nodeIds: Set<string>
): PathProgressData {
  return useMemo(() => {
    const emptyResult: PathProgressData = {
      progress: 0,
      previousProgress: 0,
      isMovingForward: true,
      currentDepth: 0,
      maxDepth: 0,
      isTerminal: false,
      milestones: [],
      orderedPath: [],
      totalNodes: nodeIds.size,
    }

    if (!currentCardId || !firstCardId) {
      return emptyResult
    }

    // Build relationship maps
    const { parentMap, childrenMap, choiceCountMap } = buildRelationshipMaps(choices)

    // Calculate depth map
    const depthMap = calculateDepthMap(firstCardId, childrenMap)

    // Find path to current node
    const orderedPath = findPathToNode(currentCardId, firstCardId, parentMap)

    // Calculate max depth
    const maxDepth = getMaxDepthFromNode(firstCardId, depthMap, childrenMap)

    // Get current depth
    const currentDepth = depthMap.get(currentCardId) ?? 0

    // Calculate progress (0 to 1)
    const progress = maxDepth === 0 ? 1 : currentDepth / maxDepth

    // Calculate previous progress for animation direction
    const previousDepth = previousCardId ? (depthMap.get(previousCardId) ?? 0) : 0
    const previousProgress = maxDepth === 0 ? 1 : previousDepth / maxDepth

    // Determine if moving forward
    const isMovingForward = currentDepth >= previousDepth

    // Check if terminal (no children)
    const children = childrenMap.get(currentCardId) || []
    const isTerminal = children.length === 0

    // Build milestones from the path
    const milestones: PathMilestone[] = orderedPath.map((nodeId, index) => {
      const nodeDepth = depthMap.get(nodeId) ?? 0
      const nodeChildren = childrenMap.get(nodeId) || []
      const nodeChoiceCount = choiceCountMap.get(nodeId) ?? 0

      return {
        nodeId,
        position: maxDepth === 0 ? 1 : nodeDepth / maxDepth,
        isStart: nodeId === firstCardId,
        isCurrent: nodeId === currentCardId,
        isTerminal: nodeChildren.length === 0,
        isBranchPoint: nodeChoiceCount > 1,
        depth: nodeDepth,
      }
    })

    return {
      progress,
      previousProgress,
      isMovingForward,
      currentDepth,
      maxDepth,
      isTerminal,
      milestones,
      orderedPath,
      totalNodes: nodeIds.size,
    }
  }, [currentCardId, firstCardId, choices, previousCardId, nodeIds])
}
