import { useMemo } from 'react'
import { CardAnalysis } from './useGraphLayout'

export interface BranchDepthData {
  /** Current depth of the selected node (0-indexed from root) */
  currentDepth: number
  /** Maximum depth reachable in the current branch from the selected node */
  maxDepthInBranch: number
  /** Whether the current node is a terminal node (dead end) */
  isTerminal: boolean
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
 * useBranchDepth - Hook to calculate branch depth progression data
 *
 * Computes the current node's depth and the maximum depth reachable
 * in the current branch for progress visualization.
 *
 * @param currentCardId The currently selected card ID
 * @param firstCardId The root/first card ID of the story
 * @param analysis Card analysis containing depth and children maps
 * @returns BranchDepthData with current depth, max depth, and terminal status
 */
export function useBranchDepth(
  currentCardId: string | null,
  firstCardId: string | null,
  analysis: CardAnalysis
): BranchDepthData {
  return useMemo(() => {
    const defaultData: BranchDepthData = {
      currentDepth: 0,
      maxDepthInBranch: 0,
      isTerminal: false,
    }

    if (!currentCardId || !firstCardId) {
      return defaultData
    }

    const currentDepth = analysis.depth.get(currentCardId) ?? 0
    const isTerminal = analysis.deadEndCards.has(currentCardId)

    // Calculate max depth from the root (entire story depth)
    // This gives a consistent progress reference
    const maxDepthFromRoot = getMaxDepthFromNode(
      firstCardId,
      analysis.depth,
      analysis.childrenMap
    )

    return {
      currentDepth,
      maxDepthInBranch: maxDepthFromRoot,
      isTerminal,
    }
  }, [currentCardId, firstCardId, analysis])
}
