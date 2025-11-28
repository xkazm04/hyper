import { useMemo } from 'react'
import { Choice } from '@/lib/types'

export interface PathAncestryResult {
  /** Set of node IDs on the path from root to current selection */
  pathNodeIds: Set<string>
  /** Set of edge (choice) IDs on the path from root to current selection */
  pathEdgeIds: Set<string>
  /** Ordered array of node IDs from root to current */
  orderedPath: string[]
}

/**
 * Calculates the ancestry path from the root (first card) to the currently selected node.
 * This is used to highlight the narrative lineage in the story graph.
 *
 * Uses BFS backwards from the selected node to find the shortest path to root.
 *
 * @param currentCardId The currently selected card ID
 * @param firstCardId The root/first card ID of the story
 * @param choices All choices in the story (used to build parent map)
 * @returns PathAncestryResult with sets of node and edge IDs on the path
 */
export function usePathAncestry(
  currentCardId: string | null,
  firstCardId: string | null,
  choices: Choice[]
): PathAncestryResult {
  return useMemo(() => {
    const emptyResult: PathAncestryResult = {
      pathNodeIds: new Set(),
      pathEdgeIds: new Set(),
      orderedPath: [],
    }

    // If no selection or no root, return empty
    if (!currentCardId || !firstCardId) {
      return emptyResult
    }

    // If the current card IS the root, just return it
    if (currentCardId === firstCardId) {
      return {
        pathNodeIds: new Set([firstCardId]),
        pathEdgeIds: new Set(),
        orderedPath: [firstCardId],
      }
    }

    // Build parent map: childId -> { parentId, choiceId }
    // A child can have multiple parents in a graph, but we'll find the shortest path
    const parentMap = new Map<string, { parentId: string; choiceId: string }[]>()

    for (const choice of choices) {
      if (choice.targetCardId) {
        const parents = parentMap.get(choice.targetCardId) || []
        parents.push({ parentId: choice.storyCardId, choiceId: choice.id })
        parentMap.set(choice.targetCardId, parents)
      }
    }

    // BFS from currentCardId backwards to find path to firstCardId
    const queue: { nodeId: string; path: string[]; edgePath: string[] }[] = [
      { nodeId: currentCardId, path: [currentCardId], edgePath: [] }
    ]
    const visited = new Set<string>([currentCardId])

    while (queue.length > 0) {
      const { nodeId, path, edgePath } = queue.shift()!

      // Check if we reached the root
      if (nodeId === firstCardId) {
        // Reverse path since we traversed backwards
        const orderedPath = path.reverse()
        const reversedEdgePath = edgePath.reverse()

        return {
          pathNodeIds: new Set(orderedPath),
          pathEdgeIds: new Set(reversedEdgePath),
          orderedPath,
        }
      }

      // Get parents of current node
      const parents = parentMap.get(nodeId) || []

      for (const { parentId, choiceId } of parents) {
        if (!visited.has(parentId)) {
          visited.add(parentId)
          queue.push({
            nodeId: parentId,
            path: [...path, parentId],
            edgePath: [...edgePath, choiceId],
          })
        }
      }
    }

    // No path found (orphaned node or disconnected graph)
    // Still include the current node in the path
    return {
      pathNodeIds: new Set([currentCardId]),
      pathEdgeIds: new Set(),
      orderedPath: [currentCardId],
    }
  }, [currentCardId, firstCardId, choices])
}
