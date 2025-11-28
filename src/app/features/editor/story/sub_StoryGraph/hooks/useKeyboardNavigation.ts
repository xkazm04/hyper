'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Node } from 'reactflow'
import { StoryNodeData } from '../components/StoryNode'
import { Choice } from '@/lib/types'
import { useArrowNavigation } from './useArrowNavigation'
import { useShortcuts } from './useShortcuts'

export interface NavigationMap {
  parents: Map<string, string[]>
  children: Map<string, string[]>
  siblings: Map<string, string[]>
  depthToNodes: Map<number, string[]>
  nodeToDepth: Map<string, number>
}

interface UseKeyboardNavigationProps {
  nodes: Node<StoryNodeData>[]
  choices: Choice[]
  currentCardId: string | null
  setCurrentCardId: (id: string) => void
  firstCardId: string | null
}

/**
 * Build navigation maps for keyboard traversal of the story graph
 */
function buildNavigationMap(
  nodes: Node<StoryNodeData>[],
  choices: Choice[],
  firstCardId: string | null
): NavigationMap {
  const parents = new Map<string, string[]>()
  const children = new Map<string, string[]>()
  const nodeToDepth = new Map<string, number>()
  const depthToNodes = new Map<number, string[]>()
  const siblings = new Map<string, string[]>()

  // Initialize empty arrays for all nodes
  nodes.forEach(node => {
    parents.set(node.id, [])
    children.set(node.id, [])
    nodeToDepth.set(node.id, node.data.depth)
  })

  // Build parent/child relationships from choices
  choices.forEach(choice => {
    if (choice.targetCardId) {
      const sourceChildren = children.get(choice.storyCardId) || []
      if (!sourceChildren.includes(choice.targetCardId)) {
        sourceChildren.push(choice.targetCardId)
        children.set(choice.storyCardId, sourceChildren)
      }

      const targetParents = parents.get(choice.targetCardId) || []
      if (!targetParents.includes(choice.storyCardId)) {
        targetParents.push(choice.storyCardId)
        parents.set(choice.targetCardId, targetParents)
      }
    }
  })

  // Group nodes by depth
  nodes.forEach(node => {
    const depth = node.data.depth
    const nodesAtDepth = depthToNodes.get(depth) || []
    nodesAtDepth.push(node.id)
    depthToNodes.set(depth, nodesAtDepth)
  })

  // Sort nodes at each depth by y position for consistent vertical ordering
  const nodePositions = new Map(nodes.map(n => [n.id, n.position]))
  depthToNodes.forEach((nodeIds, depth) => {
    nodeIds.sort((a, b) => {
      const posA = nodePositions.get(a)
      const posB = nodePositions.get(b)
      return (posA?.y ?? 0) - (posB?.y ?? 0)
    })
    depthToNodes.set(depth, nodeIds)

    // Build sibling relationships
    nodeIds.forEach(nodeId => {
      siblings.set(nodeId, nodeIds.filter(id => id !== nodeId))
    })
  })

  return { parents, children, siblings, depthToNodes, nodeToDepth }
}

/**
 * Get the node element by ID for focusing
 */
function getNodeElement(nodeId: string): HTMLElement | null {
  return document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null
}

/**
 * Hook for keyboard navigation in the story graph
 * Composes useArrowNavigation and useShortcuts
 */
export function useKeyboardNavigation({
  nodes,
  choices,
  currentCardId,
  setCurrentCardId,
  firstCardId,
}: UseKeyboardNavigationProps) {
  const navMapRef = useRef<NavigationMap | null>(null)

  // Build navigation map when data changes
  const navigationMap = useMemo(() => {
    const map = buildNavigationMap(nodes, choices, firstCardId)
    navMapRef.current = map
    return map
  }, [nodes, choices, firstCardId])

  // Get ordered list of focusable nodes for tab order
  const focusableNodes = useMemo(() => {
    const ordered: string[] = []
    const depths = Array.from(navigationMap.depthToNodes.keys()).sort((a, b) => a - b)

    depths.forEach(depth => {
      const nodesAtDepth = navigationMap.depthToNodes.get(depth) || []
      ordered.push(...nodesAtDepth)
    })

    return ordered
  }, [navigationMap])

  // Navigate to a node
  const navigateToNode = useCallback((nodeId: string) => {
    if (!nodeId) return

    setCurrentCardId(nodeId)

    requestAnimationFrame(() => {
      const element = getNodeElement(nodeId)
      if (element) {
        element.focus()
      }
    })
  }, [setCurrentCardId])

  // Arrow navigation
  const { handleArrowKey } = useArrowNavigation({
    currentCardId,
    navigationMap,
    navigateToNode,
  })

  // Shortcuts
  const { handleShortcutKey } = useShortcuts({
    currentCardId,
    navigationMap,
    firstCardId,
    focusableNodes,
  })

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!currentCardId || !navMapRef.current) return

    const target = event.target as HTMLElement
    const isNodeFocused = target.hasAttribute('data-node-id')
    if (!isNodeFocused) return

    let nextNodeId: string | null = null

    // Try arrow navigation first
    nextNodeId = handleArrowKey(event.key)

    // Then try shortcuts
    if (!nextNodeId) {
      nextNodeId = handleShortcutKey(event.key)
    }

    // Handle Enter/Space for activation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      return
    }

    if (nextNodeId) {
      event.preventDefault()
      navigateToNode(nextNodeId)
    }
  }, [currentCardId, handleArrowKey, handleShortcutKey, navigateToNode])

  // Add global keyboard listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    focusableNodes,
    navigateToNode,
    navigationMap,
  }
}

/**
 * Get the status description for a node for aria-label
 */
export function getNodeStatusLabel(data: StoryNodeData): string {
  const parts: string[] = []

  if (data.isFirst) {
    parts.push('Start')
  }
  if (data.isOrphaned) {
    parts.push('Orphaned')
  }
  if (data.isDeadEnd) {
    parts.push('Dead end')
  }
  if (data.isIncomplete) {
    parts.push('Incomplete')
  }

  const completionItems = [data.hasTitle, data.hasContent, data.hasImage, data.hasChoices]
  const completionPercent = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100
  )

  parts.push(`${completionPercent}% complete`)

  if (data.choiceCount > 0) {
    parts.push(`${data.choiceCount} ${data.choiceCount === 1 ? 'choice' : 'choices'}`)
  }

  if (data.depth >= 0) {
    parts.push(`Level ${data.depth}`)
  }

  return parts.join(', ')
}

/**
 * Build full aria-label for a story node
 */
export function buildNodeAriaLabel(data: StoryNodeData): string {
  const statusLabel = getNodeStatusLabel(data)
  return `${data.label}. ${statusLabel}`
}
