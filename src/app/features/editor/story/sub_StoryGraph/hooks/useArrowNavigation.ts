'use client'

import { useCallback } from 'react'
import { NavigationMap } from './useKeyboardNavigation'

export interface UseArrowNavigationProps {
  currentCardId: string | null
  navigationMap: NavigationMap
  navigateToNode: (nodeId: string) => void
}

/**
 * Hook for arrow key navigation in the story graph
 * Handles ArrowUp, ArrowDown, ArrowLeft, ArrowRight
 */
export function useArrowNavigation({
  currentCardId,
  navigationMap,
  navigateToNode,
}: UseArrowNavigationProps) {
  const { parents, children, depthToNodes, nodeToDepth } = navigationMap

  // Navigate right (to first child)
  const navigateRight = useCallback(() => {
    if (!currentCardId) return null
    const childNodes = children.get(currentCardId) || []
    return childNodes.length > 0 ? childNodes[0] : null
  }, [currentCardId, children])

  // Navigate left (to first parent)
  const navigateLeft = useCallback(() => {
    if (!currentCardId) return null
    const parentNodes = parents.get(currentCardId) || []
    return parentNodes.length > 0 ? parentNodes[0] : null
  }, [currentCardId, parents])

  // Navigate up (to previous sibling)
  const navigateUp = useCallback(() => {
    if (!currentCardId) return null
    const currentDepth = nodeToDepth.get(currentCardId) ?? -1
    const nodesAtDepth = depthToNodes.get(currentDepth) || []
    const currentIndex = nodesAtDepth.indexOf(currentCardId)
    return currentIndex > 0 ? nodesAtDepth[currentIndex - 1] : null
  }, [currentCardId, nodeToDepth, depthToNodes])

  // Navigate down (to next sibling)
  const navigateDown = useCallback(() => {
    if (!currentCardId) return null
    const currentDepth = nodeToDepth.get(currentCardId) ?? -1
    const nodesAtDepth = depthToNodes.get(currentDepth) || []
    const currentIndex = nodesAtDepth.indexOf(currentCardId)
    return currentIndex < nodesAtDepth.length - 1 ? nodesAtDepth[currentIndex + 1] : null
  }, [currentCardId, nodeToDepth, depthToNodes])

  // Handle arrow key press
  const handleArrowKey = useCallback((key: string): string | null => {
    switch (key) {
      case 'ArrowRight':
        return navigateRight()
      case 'ArrowLeft':
        return navigateLeft()
      case 'ArrowUp':
        return navigateUp()
      case 'ArrowDown':
        return navigateDown()
      default:
        return null
    }
  }, [navigateRight, navigateLeft, navigateUp, navigateDown])

  return {
    handleArrowKey,
    navigateRight,
    navigateLeft,
    navigateUp,
    navigateDown,
  }
}
