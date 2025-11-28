import { useMemo } from 'react'
import { getAllDescendants } from './useGraphOperations'
import { CardAnalysis } from './useGraphLayout'

/**
 * Hook for managing hidden nodes based on collapsed state
 */
export function useHiddenNodes(
  collapsedNodes: Set<string>,
  childrenMap: Map<string, string[]>
) {
  // Calculate hidden nodes (descendants of collapsed nodes)
  const hiddenNodes = useMemo(() => {
    const hidden = new Set<string>()
    collapsedNodes.forEach(collapsedId => {
      const descendants = getAllDescendants(collapsedId, childrenMap)
      descendants.forEach(d => hidden.add(d))
    })
    return hidden
  }, [collapsedNodes, childrenMap])

  // Count hidden descendants for each collapsed node
  const hiddenDescendantCount = useMemo(() => {
    const counts = new Map<string, number>()
    collapsedNodes.forEach(collapsedId => {
      const descendants = getAllDescendants(collapsedId, childrenMap)
      counts.set(collapsedId, descendants.size)
    })
    return counts
  }, [collapsedNodes, childrenMap])

  return { hiddenNodes, hiddenDescendantCount }
}
