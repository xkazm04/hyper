'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Node, useReactFlow } from 'reactflow'
import { StoryNodeData } from '../components/StoryNode'
import { Choice } from '@/lib/types'

/**
 * Navigation map for keyboard traversal of the story graph
 */
export interface NavigationMap {
  parents: Map<string, string[]>
  children: Map<string, string[]>
  siblings: Map<string, string[]>
  depthToNodes: Map<number, string[]>
  nodeToDepth: Map<string, number>
}

/**
 * Configuration options for the navigation hook
 */
export interface UseStoryGraphNavigationOptions {
  /** Whether to enable global keyboard listeners */
  enableKeyboardListeners?: boolean
  /** Custom handler for Enter/Space activation */
  onNodeActivate?: (nodeId: string) => void
  /** Whether to center viewport on navigation */
  centerOnNavigation?: boolean
}

interface UseStoryGraphNavigationProps {
  nodes: Node<StoryNodeData>[]
  choices: Choice[]
  currentCardId: string | null
  setCurrentCardId: (id: string) => void
  firstCardId: string | null
  options?: UseStoryGraphNavigationOptions
}

/**
 * Result type for navigation operations
 */
export interface NavigationResult {
  nodeId: string | null
  direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'pageup' | 'pagedown' | null
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
 * Unified hook for story graph navigation
 *
 * Consolidates keyboard navigation, arrow navigation, and shortcuts into a single API.
 * Uses React Flow's built-in hooks for viewport operations.
 *
 * Features:
 * - Arrow key navigation (up/down for siblings, left/right for parent/child)
 * - Shortcut keys (Home/End for first/last, PageUp/PageDown for level jumps)
 * - Focus management for accessibility
 * - Optional viewport centering on navigation
 *
 * @example
 * ```tsx
 * const { navigateToNode, navigationMap, focusableNodes } = useStoryGraphNavigation({
 *   nodes,
 *   choices,
 *   currentCardId,
 *   setCurrentCardId,
 *   firstCardId,
 *   options: { centerOnNavigation: true }
 * })
 * ```
 */
export function useStoryGraphNavigation({
  nodes,
  choices,
  currentCardId,
  setCurrentCardId,
  firstCardId,
  options = {},
}: UseStoryGraphNavigationProps) {
  const {
    enableKeyboardListeners = true,
    onNodeActivate,
    centerOnNavigation = false,
  } = options

  const navMapRef = useRef<NavigationMap | null>(null)

  // Try to get React Flow instance for viewport operations
  let reactFlowInstance: ReturnType<typeof useReactFlow> | null = null
  try {
    reactFlowInstance = useReactFlow()
  } catch {
    // Not inside ReactFlow provider, viewport centering won't work
  }

  // Build navigation map when data changes
  const navigationMap = useMemo(() => {
    const map = buildNavigationMap(nodes, choices, firstCardId)
    navMapRef.current = map
    return map
  }, [nodes, choices, firstCardId])

  const { parents, children, depthToNodes, nodeToDepth } = navigationMap

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

  // =====================
  // Arrow Navigation
  // =====================

  /** Navigate right to first child */
  const navigateRight = useCallback((): string | null => {
    if (!currentCardId) return null
    const childNodes = children.get(currentCardId) || []
    return childNodes.length > 0 ? childNodes[0] : null
  }, [currentCardId, children])

  /** Navigate left to first parent */
  const navigateLeft = useCallback((): string | null => {
    if (!currentCardId) return null
    const parentNodes = parents.get(currentCardId) || []
    return parentNodes.length > 0 ? parentNodes[0] : null
  }, [currentCardId, parents])

  /** Navigate up to previous sibling */
  const navigateUp = useCallback((): string | null => {
    if (!currentCardId) return null
    const currentDepth = nodeToDepth.get(currentCardId) ?? -1
    const nodesAtDepth = depthToNodes.get(currentDepth) || []
    const currentIndex = nodesAtDepth.indexOf(currentCardId)
    return currentIndex > 0 ? nodesAtDepth[currentIndex - 1] : null
  }, [currentCardId, nodeToDepth, depthToNodes])

  /** Navigate down to next sibling */
  const navigateDown = useCallback((): string | null => {
    if (!currentCardId) return null
    const currentDepth = nodeToDepth.get(currentCardId) ?? -1
    const nodesAtDepth = depthToNodes.get(currentDepth) || []
    const currentIndex = nodesAtDepth.indexOf(currentCardId)
    return currentIndex < nodesAtDepth.length - 1 ? nodesAtDepth[currentIndex + 1] : null
  }, [currentCardId, nodeToDepth, depthToNodes])

  // =====================
  // Shortcut Navigation
  // =====================

  /** Jump to start (Home key) */
  const jumpToStart = useCallback((): string | null => {
    return firstCardId
  }, [firstCardId])

  /** Jump to end (End key) */
  const jumpToEnd = useCallback((): string | null => {
    return focusableNodes.length > 0 ? focusableNodes[focusableNodes.length - 1] : null
  }, [focusableNodes])

  /** Jump to parent level (PageUp) */
  const jumpToParentLevel = useCallback((): string | null => {
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

  /** Jump to child level (PageDown) */
  const jumpToChildLevel = useCallback((): string | null => {
    if (!currentCardId) return null
    const currentDepth = nodeToDepth.get(currentCardId) ?? -1
    const nextDepthNodes = depthToNodes.get(currentDepth + 1) || []
    if (nextDepthNodes.length > 0) {
      const childNodes = children.get(currentCardId) || []
      return childNodes[0] || nextDepthNodes[0]
    }
    return null
  }, [currentCardId, nodeToDepth, depthToNodes, children])

  // =====================
  // Core Navigation
  // =====================

  /** Navigate to a specific node with focus and optional viewport centering */
  const navigateToNode = useCallback((nodeId: string) => {
    if (!nodeId) return

    setCurrentCardId(nodeId)

    // Center viewport if enabled and React Flow is available
    if (centerOnNavigation && reactFlowInstance) {
      const node = nodes.find(n => n.id === nodeId)
      if (node) {
        reactFlowInstance.setCenter(
          node.position.x + (node.data.nodeWidth || 140) / 2,
          node.position.y + (node.data.nodeHeight || 100) / 2,
          { duration: 300, zoom: reactFlowInstance.getZoom() }
        )
      }
    }

    requestAnimationFrame(() => {
      const element = getNodeElement(nodeId)
      if (element) {
        element.focus()
      }
    })
  }, [setCurrentCardId, centerOnNavigation, reactFlowInstance, nodes])

  /**
   * Handle a key and return the navigation result
   * This is the unified key handler for all navigation
   */
  const handleNavigationKey = useCallback((key: string): NavigationResult => {
    let nodeId: string | null = null
    let direction: NavigationResult['direction'] = null

    switch (key) {
      case 'ArrowRight':
        nodeId = navigateRight()
        direction = 'right'
        break
      case 'ArrowLeft':
        nodeId = navigateLeft()
        direction = 'left'
        break
      case 'ArrowUp':
        nodeId = navigateUp()
        direction = 'up'
        break
      case 'ArrowDown':
        nodeId = navigateDown()
        direction = 'down'
        break
      case 'Home':
        nodeId = jumpToStart()
        direction = 'home'
        break
      case 'End':
        nodeId = jumpToEnd()
        direction = 'end'
        break
      case 'PageUp':
        nodeId = jumpToParentLevel()
        direction = 'pageup'
        break
      case 'PageDown':
        nodeId = jumpToChildLevel()
        direction = 'pagedown'
        break
      default:
        break
    }

    return { nodeId, direction }
  }, [
    navigateRight,
    navigateLeft,
    navigateUp,
    navigateDown,
    jumpToStart,
    jumpToEnd,
    jumpToParentLevel,
    jumpToChildLevel,
  ])

  // =====================
  // Keyboard Event Handler
  // =====================

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!currentCardId || !navMapRef.current) return

    const target = event.target as HTMLElement
    const isNodeFocused = target.hasAttribute('data-node-id')
    if (!isNodeFocused) return

    // Handle Enter/Space for activation
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (onNodeActivate) {
        onNodeActivate(currentCardId)
      }
      return
    }

    const result = handleNavigationKey(event.key)

    if (result.nodeId) {
      event.preventDefault()
      navigateToNode(result.nodeId)
    }
  }, [currentCardId, handleNavigationKey, navigateToNode, onNodeActivate])

  // Add global keyboard listener if enabled
  useEffect(() => {
    if (!enableKeyboardListeners) return

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enableKeyboardListeners])

  // =====================
  // Edge Selection State
  // =====================

  /** Get the edge ID for a parent-child relationship */
  const getEdgeId = useCallback((parentId: string, childId: string): string | null => {
    const choice = choices.find(
      c => c.storyCardId === parentId && c.targetCardId === childId
    )
    return choice ? `edge-${choice.id}` : null
  }, [choices])

  /** Get all edges connected to a node */
  const getConnectedEdges = useCallback((nodeId: string): string[] => {
    const edgeIds: string[] = []

    // Outgoing edges (this node is parent)
    const childNodes = children.get(nodeId) || []
    childNodes.forEach(childId => {
      const edgeId = getEdgeId(nodeId, childId)
      if (edgeId) edgeIds.push(edgeId)
    })

    // Incoming edges (this node is child)
    const parentNodes = parents.get(nodeId) || []
    parentNodes.forEach(parentId => {
      const edgeId = getEdgeId(parentId, nodeId)
      if (edgeId) edgeIds.push(edgeId)
    })

    return edgeIds
  }, [children, parents, getEdgeId])

  return {
    // Core navigation
    navigateToNode,
    handleNavigationKey,

    // Navigation map and structure
    navigationMap,
    focusableNodes,

    // Directional navigation functions
    navigateUp,
    navigateDown,
    navigateLeft,
    navigateRight,

    // Shortcut navigation functions
    jumpToStart,
    jumpToEnd,
    jumpToParentLevel,
    jumpToChildLevel,

    // Edge utilities
    getEdgeId,
    getConnectedEdges,
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
