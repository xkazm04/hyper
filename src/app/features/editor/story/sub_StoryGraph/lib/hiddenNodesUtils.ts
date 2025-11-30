/**
 * Utility functions for computing hidden nodes in the story graph.
 * Extracted for reuse by the Zustand store.
 */

import { getAllDescendants } from '../hooks/useGraphOperations'

/**
 * Computes the set of all hidden nodes based on collapsed nodes.
 * A node is hidden if any of its ancestors is collapsed.
 */
export function computeHiddenNodes(
  collapsedNodes: Set<string>,
  childrenMap: Map<string, string[]>
): Set<string> {
  const hidden = new Set<string>()

  collapsedNodes.forEach(collapsedId => {
    const descendants = getAllDescendants(collapsedId, childrenMap)
    descendants.forEach(id => hidden.add(id))
  })

  return hidden
}

/**
 * Computes the count of hidden descendants for each collapsed node.
 * Used to display the count badge on collapsed nodes.
 */
export function computeHiddenDescendantCounts(
  collapsedNodes: Set<string>,
  childrenMap: Map<string, string[]>
): Map<string, number> {
  const counts = new Map<string, number>()

  collapsedNodes.forEach(collapsedId => {
    const descendants = getAllDescendants(collapsedId, childrenMap)
    counts.set(collapsedId, descendants.size)
  })

  return counts
}
