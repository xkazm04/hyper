'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useReactFlow, Node } from 'reactflow'
import { StoryNodeData } from '../components/StoryNode'

export interface NodePreviewState {
  nodeId: string | null
  nodePosition: { x: number; y: number } | null
  isHovering: boolean
}

export interface UseNodePreviewOptions {
  /** Delay before showing preview on hover (ms) */
  hoverDelay?: number
  /** Delay before hiding preview when mouse leaves (ms) */
  hideDelay?: number
}

/**
 * useNodePreview - Manages hover/selection state for node preview panel
 *
 * Features:
 * - Tracks hovered node ID and screen position
 * - Debounced show/hide to prevent flickering
 * - Converts React Flow node coordinates to screen coordinates
 * - Supports both hover and click-to-pin behaviors
 */
export function useNodePreview(options: UseNodePreviewOptions = {}) {
  const { hoverDelay = 300, hideDelay = 150 } = options

  const [previewState, setPreviewState] = useState<NodePreviewState>({
    nodeId: null,
    nodePosition: null,
    isHovering: false,
  })
  const [isPinned, setIsPinned] = useState(false)

  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastHoveredNodeRef = useRef<string | null>(null)

  // Get React Flow instance for coordinate conversion
  const reactFlowInstance = useReactFlow()

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // Convert flow coordinates to screen coordinates
  const getScreenPosition = useCallback((node: Node<StoryNodeData>) => {
    if (!reactFlowInstance) return null

    // Get the viewport transformation
    const viewport = reactFlowInstance.getViewport()

    // Transform node position to screen coordinates
    const screenX = node.position.x * viewport.zoom + viewport.x
    const screenY = node.position.y * viewport.zoom + viewport.y

    return { x: screenX, y: screenY }
  }, [reactFlowInstance])

  // Show preview for a node
  const showPreview = useCallback((node: Node<StoryNodeData>) => {
    clearTimeouts()
    lastHoveredNodeRef.current = node.id

    showTimeoutRef.current = setTimeout(() => {
      const position = getScreenPosition(node)
      setPreviewState({
        nodeId: node.id,
        nodePosition: position,
        isHovering: true,
      })
    }, hoverDelay)
  }, [clearTimeouts, getScreenPosition, hoverDelay])

  // Hide preview (with optional delay)
  const hidePreview = useCallback((immediate = false) => {
    clearTimeouts()

    if (isPinned) return // Don't hide if pinned

    if (immediate) {
      setPreviewState({
        nodeId: null,
        nodePosition: null,
        isHovering: false,
      })
      lastHoveredNodeRef.current = null
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setPreviewState({
          nodeId: null,
          nodePosition: null,
          isHovering: false,
        })
        lastHoveredNodeRef.current = null
      }, hideDelay)
    }
  }, [clearTimeouts, hideDelay, isPinned])

  // Pin the preview (keep it visible until explicitly closed)
  const pinPreview = useCallback(() => {
    setIsPinned(true)
    clearTimeouts()
  }, [clearTimeouts])

  // Close preview (clears both hover and pinned state)
  const closePreview = useCallback(() => {
    setIsPinned(false)
    clearTimeouts()
    setPreviewState({
      nodeId: null,
      nodePosition: null,
      isHovering: false,
    })
    lastHoveredNodeRef.current = null
  }, [clearTimeouts])

  // Handle node mouse enter
  const onNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node<StoryNodeData>) => {
    // Don't show preview on hover if already pinned to same node
    if (isPinned && previewState.nodeId === node.id) return

    // If pinned to different node, update to new node
    if (isPinned) {
      const position = getScreenPosition(node)
      setPreviewState({
        nodeId: node.id,
        nodePosition: position,
        isHovering: true,
      })
      return
    }

    showPreview(node)
  }, [isPinned, previewState.nodeId, getScreenPosition, showPreview])

  // Handle node mouse leave
  const onNodeMouseLeave = useCallback(() => {
    if (!isPinned) {
      hidePreview()
    }
  }, [isPinned, hidePreview])

  // Handle preview panel mouse enter (cancel hide)
  const onPreviewMouseEnter = useCallback(() => {
    clearTimeouts()
  }, [clearTimeouts])

  // Handle preview panel mouse leave
  const onPreviewMouseLeave = useCallback(() => {
    if (!isPinned) {
      hidePreview()
    }
  }, [isPinned, hidePreview])

  // Update position when viewport changes (zoom/pan)
  const updatePosition = useCallback(() => {
    if (!previewState.nodeId || !reactFlowInstance) return

    const node = reactFlowInstance.getNode(previewState.nodeId)
    if (!node) return

    const position = getScreenPosition(node as Node<StoryNodeData>)
    if (position) {
      setPreviewState(prev => ({
        ...prev,
        nodePosition: position,
      }))
    }
  }, [previewState.nodeId, reactFlowInstance, getScreenPosition])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts()
    }
  }, [clearTimeouts])

  return {
    previewState,
    isPinned,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onPreviewMouseEnter,
    onPreviewMouseLeave,
    showPreview,
    hidePreview,
    pinPreview,
    closePreview,
    updatePosition,
  }
}
