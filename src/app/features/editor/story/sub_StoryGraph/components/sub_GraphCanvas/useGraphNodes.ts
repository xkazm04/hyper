'use client'

import { useEffect, useCallback, useRef, useMemo } from 'react'
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow'
import { StoryNodeData } from '../StoryNode'
import { SuggestedCardNodeData } from '../../../sub_InfiniteCanvas/components/SuggestedCardNode'
import { SuggestedCard } from '@/lib/types/ai-canvas'

interface UseGraphNodesProps {
  initialNodes: Node<StoryNodeData>[]
  initialEdges: Edge[]
  suggestions: SuggestedCard[]
  hoveredSuggestionId: string | null
  acceptSuggestion: (suggestion: SuggestedCard) => void
  declineSuggestion: (id: string) => void
  setHoveredSuggestionId: (id: string | null) => void
  pathNodeIds?: Set<string>
  pathEdgeIds?: Set<string>
  onOrphanAttachClick?: (nodeId: string) => void
  /** Node IDs to highlight from search results */
  highlightedNodeIds?: Set<string>
}

/**
 * Creates a hash for a node to detect meaningful changes.
 * Only includes properties that affect rendering, excluding transient state.
 */
function hashNode(node: Node<StoryNodeData>): string {
  const d = node.data
  return `${node.id}|${node.position.x.toFixed(0)}|${node.position.y.toFixed(0)}|${d.label}|${d.isFirst}|${d.isOrphaned}|${d.isDeadEnd}|${d.isIncomplete}|${d.isSelected}|${d.hasImage}|${d.hasContent}|${d.hasTitle}|${d.choiceCount}|${d.depth}|${d.isCollapsed}|${d.hiddenDescendantCount}|${d.nodeWidth ?? 140}|${d.nodeHeight ?? 100}`
}

/**
 * Creates a hash for an edge to detect meaningful changes.
 */
function hashEdge(edge: Edge): string {
  return `${edge.id}|${edge.source}|${edge.target}|${edge.zIndex ?? 0}|${edge.style?.strokeWidth ?? 0}|${edge.label ?? ''}`
}

/**
 * Computes minimal node updates by diffing current nodes against new nodes.
 * Returns only the nodes that need to be updated, added, or removed.
 */
function computeNodeDiff(
  currentNodes: Node<StoryNodeData | SuggestedCardNodeData>[],
  newNodes: Node<StoryNodeData | SuggestedCardNodeData>[]
): {
  toAdd: Node<StoryNodeData | SuggestedCardNodeData>[]
  toUpdate: Node<StoryNodeData | SuggestedCardNodeData>[]
  toRemove: string[]
  unchanged: Node<StoryNodeData | SuggestedCardNodeData>[]
} {
  const currentMap = new Map(currentNodes.map(n => [n.id, n]))
  const newMap = new Map(newNodes.map(n => [n.id, n]))

  const toAdd: Node<StoryNodeData | SuggestedCardNodeData>[] = []
  const toUpdate: Node<StoryNodeData | SuggestedCardNodeData>[] = []
  const toRemove: string[] = []
  const unchanged: Node<StoryNodeData | SuggestedCardNodeData>[] = []

  // Find nodes to add or update
  for (const newNode of newNodes) {
    const currentNode = currentMap.get(newNode.id)
    if (!currentNode) {
      toAdd.push(newNode)
    } else if (newNode.type === 'storyNode' && currentNode.type === 'storyNode') {
      const currentHash = hashNode(currentNode as Node<StoryNodeData>)
      const newHash = hashNode(newNode as Node<StoryNodeData>)
      if (currentHash !== newHash) {
        toUpdate.push(newNode)
      } else {
        // Preserve user-dragged position if unchanged
        unchanged.push({
          ...newNode,
          position: currentNode.position,
        })
      }
    } else {
      // Suggested nodes always get updated (they have callbacks that change)
      toUpdate.push(newNode)
    }
  }

  // Find nodes to remove
  for (const currentNode of currentNodes) {
    if (!newMap.has(currentNode.id)) {
      toRemove.push(currentNode.id)
    }
  }

  return { toAdd, toUpdate, toRemove, unchanged }
}

/**
 * Computes minimal edge updates by diffing current edges against new edges.
 */
function computeEdgeDiff(
  currentEdges: Edge[],
  newEdges: Edge[]
): {
  toAdd: Edge[]
  toUpdate: Edge[]
  toRemove: string[]
  unchanged: Edge[]
} {
  const currentMap = new Map(currentEdges.map(e => [e.id, e]))
  const newMap = new Map(newEdges.map(e => [e.id, e]))

  const toAdd: Edge[] = []
  const toUpdate: Edge[] = []
  const toRemove: string[] = []
  const unchanged: Edge[] = []

  // Find edges to add or update
  for (const newEdge of newEdges) {
    const currentEdge = currentMap.get(newEdge.id)
    if (!currentEdge) {
      toAdd.push(newEdge)
    } else {
      const currentHash = hashEdge(currentEdge)
      const newHash = hashEdge(newEdge)
      if (currentHash !== newHash) {
        toUpdate.push(newEdge)
      } else {
        unchanged.push(currentEdge) // Keep current edge reference
      }
    }
  }

  // Find edges to remove
  for (const currentEdge of currentEdges) {
    if (!newMap.has(currentEdge.id)) {
      toRemove.push(currentEdge.id)
    }
  }

  return { toAdd, toUpdate, toRemove, unchanged }
}

export function useGraphNodes({
  initialNodes, initialEdges, suggestions, hoveredSuggestionId,
  acceptSuggestion, declineSuggestion, setHoveredSuggestionId,
  pathNodeIds = new Set(),
  pathEdgeIds = new Set(),
  onOrphanAttachClick,
  highlightedNodeIds = new Set(),
}: UseGraphNodesProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<StoryNodeData | SuggestedCardNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Track previous node IDs for efficient diffing
  const prevNodeIdsRef = useRef<Set<string>>(new Set())
  const prevEdgeIdsRef = useRef<Set<string>>(new Set())
  const isInitializedRef = useRef(false)

  // Memoize suggestion nodes to prevent unnecessary recalculations
  const suggestionNodes = useMemo((): Node<SuggestedCardNodeData>[] => {
    return suggestions.map((suggestion, index) => {
      const sourceNode = initialNodes.find(n => n.id === suggestion.sourceCardId)
      const baseX = sourceNode?.position.x ?? 400
      const baseY = sourceNode?.position.y ?? 200

      return {
        id: suggestion.id,
        type: 'suggestedNode',
        position: { x: baseX + 300, y: baseY + (index - 1) * 150 },
        data: {
          ...suggestion,
          isHovered: suggestion.id === hoveredSuggestionId,
          onAccept: acceptSuggestion,
          onDecline: declineSuggestion,
          onHover: setHoveredSuggestionId,
        },
      }
    })
  }, [suggestions, hoveredSuggestionId, acceptSuggestion, declineSuggestion, setHoveredSuggestionId, initialNodes])

  // Memoize story nodes with path data and search highlight
  const storyNodesWithPath = useMemo((): Node<StoryNodeData>[] => {
    return initialNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isOnPath: pathNodeIds.has(node.id),
        onOrphanAttach: onOrphanAttachClick,
        isSearchHighlighted: highlightedNodeIds.has(node.id),
      },
    }))
  }, [initialNodes, pathNodeIds, onOrphanAttachClick, highlightedNodeIds])

  useEffect(() => {
    const allNewNodes = [...storyNodesWithPath, ...suggestionNodes]
    const newNodeIds = new Set(allNewNodes.map(n => n.id))

    // First render: set all nodes directly
    if (!isInitializedRef.current) {
      setNodes(allNewNodes)
      prevNodeIdsRef.current = newNodeIds
      isInitializedRef.current = true
      return
    }

    // Apply update using setNodes callback - diff is computed inside to avoid dependency on nodes
    setNodes(currentNodes => {
      // Compute minimal diff inside callback to avoid stale closure
      const { toAdd, toUpdate, toRemove, unchanged } = computeNodeDiff(currentNodes, allNewNodes)

      // Skip update if nothing changed - return same reference
      if (toAdd.length === 0 && toUpdate.length === 0 && toRemove.length === 0) {
        return currentNodes
      }

      // Create a map of current nodes for quick lookup
      const nodeMap = new Map(currentNodes.map(n => [n.id, n]))

      // Remove nodes
      for (const id of toRemove) {
        nodeMap.delete(id)
      }

      // Add new nodes
      for (const node of toAdd) {
        nodeMap.set(node.id, node)
      }

      // Update existing nodes (preserve position if unchanged)
      for (const node of toUpdate) {
        const existing = nodeMap.get(node.id)
        if (existing) {
          // Check if position changed significantly
          const positionChanged =
            Math.abs(existing.position.x - node.position.x) > 1 ||
            Math.abs(existing.position.y - node.position.y) > 1
          nodeMap.set(node.id, {
            ...node,
            // Preserve existing position if layout didn't change it
            position: positionChanged ? node.position : existing.position,
          })
        } else {
          nodeMap.set(node.id, node)
        }
      }

      return Array.from(nodeMap.values())
    })

    prevNodeIdsRef.current = newNodeIds
  }, [storyNodesWithPath, suggestionNodes, setNodes])

  // Memoize suggestion edges
  const suggestionEdges = useMemo((): Edge[] => {
    return suggestions.map(suggestion => ({
      id: `suggestion-edge-${suggestion.id}`,
      source: suggestion.sourceCardId,
      target: suggestion.id,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: suggestion.confidence >= 0.8 ? 'hsl(142, 71%, 45%)' : suggestion.confidence >= 0.5 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)',
        strokeWidth: 2,
        strokeDasharray: '5,5',
        opacity: suggestion.isAnimatingOut ? 0 : 0.7,
      },
      labelStyle: { fill: 'hsl(var(--muted-foreground))', fontWeight: 500, fontSize: '10px' },
      label: suggestion.choiceLabel,
      labelBgStyle: { fill: 'hsl(var(--card))', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }))
  }, [suggestions])

  // Memoize story edges with path glow styling
  const storyEdgesWithPath = useMemo((): Edge[] => {
    return initialEdges.map(edge => {
      const isOnPath = pathEdgeIds.has(edge.id)
      if (isOnPath) {
        return {
          ...edge,
          className: 'path-edge-glow',
          style: {
            ...edge.style,
            strokeWidth: (edge.style?.strokeWidth as number || 2) + 1,
            filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))',
          },
          zIndex: 100, // Bring path edges to front
        }
      }
      return edge
    })
  }, [initialEdges, pathEdgeIds])

  useEffect(() => {
    const allNewEdges = [...storyEdgesWithPath, ...suggestionEdges]
    const newEdgeIds = new Set(allNewEdges.map(e => e.id))

    // Apply update using setEdges callback - diff is computed inside to avoid dependency on edges
    setEdges(currentEdges => {
      // Compute minimal diff inside callback to avoid stale closure
      const { toAdd, toUpdate, toRemove } = computeEdgeDiff(currentEdges, allNewEdges)

      // Skip update if nothing changed - return same reference
      if (toAdd.length === 0 && toUpdate.length === 0 && toRemove.length === 0) {
        return currentEdges
      }

      const edgeMap = new Map(currentEdges.map(e => [e.id, e]))

      // Remove edges
      for (const id of toRemove) {
        edgeMap.delete(id)
      }

      // Add new edges
      for (const edge of toAdd) {
        edgeMap.set(edge.id, edge)
      }

      // Update existing edges
      for (const edge of toUpdate) {
        edgeMap.set(edge.id, edge)
      }

      return Array.from(edgeMap.values())
    })

    prevEdgeIdsRef.current = newEdgeIds
  }, [storyEdgesWithPath, suggestionEdges, setEdges])

  const nodeColor = useCallback((node: Node<StoryNodeData | SuggestedCardNodeData>, isHalloween: boolean) => {
    if (node.type === 'suggestedNode') return 'hsl(270, 70%, 60%)'
    const data = node.data as StoryNodeData
    if (isHalloween) {
      if (data.isFirst) return 'hsl(25, 95%, 53%)'
      if (data.isOrphaned) return 'hsl(45, 93%, 47%)'
      if (data.isDeadEnd) return 'hsl(0, 84%, 60%)'
      if (data.isIncomplete) return 'hsl(270, 50%, 40%)'
      return 'hsl(25, 85%, 50%)'
    }
    if (data.isFirst) return 'hsl(var(--primary))'
    if (data.isOrphaned) return 'hsl(45, 93%, 47%)'
    if (data.isDeadEnd) return 'hsl(0, 84%, 60%)'
    if (data.isIncomplete) return 'hsl(var(--muted-foreground))'
    return 'hsl(142, 71%, 45%)'
  }, [])

  return { nodes, edges, onNodesChange, onEdgesChange, nodeColor }
}
