'use client'

import { useCallback } from 'react'
import { NavigationMap } from './useKeyboardNavigation'

export interface UseShortcutsProps {
  currentCardId: string | null
  navigationMap: NavigationMap
  firstCardId: string | null
  focusableNodes: string[]
}

/**
 * Hook for keyboard shortcuts in the story graph
 * Handles Home, End, PageUp, PageDown
 */
export function useShortcuts({
  currentCardId,
  navigationMap,
  firstCardId,
  focusableNodes,
}: UseShortcutsProps) {
  const { parents, children, depthToNodes, nodeToDepth } = navigationMap

  // Jump to start (Home key)
  const jumpToStart = useCallback(() => {
    return firstCardId
  }, [firstCardId])

  // Jump to end (End key)
  const jumpToEnd = useCallback(() => {
    return focusableNodes.length > 0 ? focusableNodes[focusableNodes.length - 1] : null
  }, [focusableNodes])

  // Jump to parent level (PageUp)
  const jumpToParentLevel = useCallback(() => {
    if (!currentCardId) return null
    const currentDepth = nodeToDepth.get(currentCardId) ?? -1
    if (currentDepth > 0) {
      const prevDepthNodes = depthToNodes.get(currentDepth - 1) || []
      if (prevDepthNodes.length > 0) {
        const parentNodes = parents.get(currentCardId) || []
        return parentNodes[0] || prevDepthNodes[0]
      }
    }
    return null
  }, [currentCardId, nodeToDepth, depthToNodes, parents])

  // Jump to child level (PageDown)
  const jumpToChildLevel = useCallback(() => {
    if (!currentCardId) return null
    const currentDepth = nodeToDepth.get(currentCardId) ?? -1
    const nextDepthNodes = depthToNodes.get(currentDepth + 1) || []
    if (nextDepthNodes.length > 0) {
      const childNodes = children.get(currentCardId) || []
      return childNodes[0] || nextDepthNodes[0]
    }
    return null
  }, [currentCardId, nodeToDepth, depthToNodes, children])

  // Handle shortcut key press
  const handleShortcutKey = useCallback((key: string): string | null => {
    switch (key) {
      case 'Home':
        return jumpToStart()
      case 'End':
        return jumpToEnd()
      case 'PageUp':
        return jumpToParentLevel()
      case 'PageDown':
        return jumpToChildLevel()
      default:
        return null
    }
  }, [jumpToStart, jumpToEnd, jumpToParentLevel, jumpToChildLevel])

  return {
    handleShortcutKey,
    jumpToStart,
    jumpToEnd,
    jumpToParentLevel,
    jumpToChildLevel,
  }
}
