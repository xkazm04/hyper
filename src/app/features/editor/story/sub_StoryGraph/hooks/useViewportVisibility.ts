'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useReactFlow, useViewport, Viewport, XYPosition, Node } from 'reactflow'

export interface ViewportBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface VisibilityState {
  /** Set of node IDs currently visible in the viewport */
  visibleNodeIds: Set<string>
  /** Whether viewport tracking is active */
  isTracking: boolean
  /** Current viewport bounds in graph coordinates */
  viewportBounds: ViewportBounds | null
}

interface UseViewportVisibilityOptions {
  /** Node dimensions for visibility calculations (default: 140x100) */
  nodeDimensions?: { width: number; height: number }
  /** Padding around viewport to preload nodes just outside view (default: 200) */
  viewportPadding?: number
  /** Enable/disable visibility tracking (default: true) */
  enabled?: boolean
}

/**
 * Hook to track which nodes are visible in the current viewport.
 * Uses viewport bounds to determine visibility without IntersectionObserver.
 *
 * React Flow handles its own virtualization internally, but this hook
 * provides visibility state for lazy loading node content (images, etc.)
 */
export function useViewportVisibility(
  nodes: Node[],
  options: UseViewportVisibilityOptions = {}
): VisibilityState {
  const {
    nodeDimensions = { width: 140, height: 100 },
    viewportPadding = 200,
    enabled = true,
  } = options

  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set())
  const [viewportBounds, setViewportBounds] = useState<ViewportBounds | null>(null)
  const [isTracking, setIsTracking] = useState(false)

  const reactFlowInstance = useReactFlow()
  const viewport = useViewport()
  const rafRef = useRef<number | null>(null)
  const lastViewportRef = useRef<Viewport | null>(null)

  /**
   * Calculate viewport bounds in graph coordinates
   */
  const calculateViewportBounds = useCallback((): ViewportBounds | null => {
    if (!reactFlowInstance) return null

    try {
      // Get the container dimensions
      const container = document.querySelector('.react-flow')
      if (!container) return null

      const rect = container.getBoundingClientRect()
      const { x: panX, y: panY, zoom } = viewport

      // Convert screen coordinates to graph coordinates
      // Screen position = (graph position * zoom) + pan
      // Graph position = (screen position - pan) / zoom
      const minX = (0 - panX) / zoom - viewportPadding
      const minY = (0 - panY) / zoom - viewportPadding
      const maxX = (rect.width - panX) / zoom + viewportPadding
      const maxY = (rect.height - panY) / zoom + viewportPadding

      return { minX, maxX, minY, maxY }
    } catch {
      return null
    }
  }, [reactFlowInstance, viewport, viewportPadding])

  /**
   * Check if a node intersects with the viewport bounds
   */
  const isNodeVisible = useCallback(
    (node: Node, bounds: ViewportBounds): boolean => {
      const nodeWidth = (node.data?.nodeWidth ?? nodeDimensions.width) as number
      const nodeHeight = (node.data?.nodeHeight ?? nodeDimensions.height) as number

      const nodeLeft = node.position.x
      const nodeRight = node.position.x + nodeWidth
      const nodeTop = node.position.y
      const nodeBottom = node.position.y + nodeHeight

      // Check for intersection
      return !(
        nodeRight < bounds.minX ||
        nodeLeft > bounds.maxX ||
        nodeBottom < bounds.minY ||
        nodeTop > bounds.maxY
      )
    },
    [nodeDimensions]
  )

  /**
   * Update visible nodes based on current viewport
   */
  const updateVisibility = useCallback(() => {
    if (!enabled) {
      setVisibleNodeIds(new Set(nodes.map(n => n.id)))
      return
    }

    const bounds = calculateViewportBounds()
    if (!bounds) return

    setViewportBounds(bounds)

    const visible = new Set<string>()
    for (const node of nodes) {
      if (isNodeVisible(node, bounds)) {
        visible.add(node.id)
      }
    }

    setVisibleNodeIds(prev => {
      // Only update if the set has changed
      if (prev.size !== visible.size) return visible
      for (const id of visible) {
        if (!prev.has(id)) return visible
      }
      return prev
    })
  }, [nodes, enabled, calculateViewportBounds, isNodeVisible])

  // Track viewport changes with throttling
  useEffect(() => {
    if (!enabled) {
      setIsTracking(false)
      setVisibleNodeIds(new Set(nodes.map(n => n.id)))
      return
    }

    setIsTracking(true)

    // Check if viewport has changed significantly
    const hasViewportChanged = () => {
      const last = lastViewportRef.current
      if (!last) return true

      const threshold = 0.01
      return (
        Math.abs(last.x - viewport.x) > threshold ||
        Math.abs(last.y - viewport.y) > threshold ||
        Math.abs(last.zoom - viewport.zoom) > threshold * 10
      )
    }

    if (hasViewportChanged()) {
      lastViewportRef.current = { ...viewport }

      // Cancel any pending update
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }

      // Schedule update on next frame for 60fps throttling
      rafRef.current = requestAnimationFrame(() => {
        updateVisibility()
        rafRef.current = null
      })
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [viewport, nodes, enabled, updateVisibility])

  // Initial visibility calculation
  useEffect(() => {
    updateVisibility()
  }, [updateVisibility])

  return {
    visibleNodeIds,
    isTracking,
    viewportBounds,
  }
}

/**
 * Hook to check if a specific node is currently visible in the viewport.
 * Lighter-weight alternative when you only need to check a single node.
 */
export function useNodeVisibility(
  nodeId: string,
  visibilityState: VisibilityState
): boolean {
  return visibilityState.visibleNodeIds.has(nodeId)
}
