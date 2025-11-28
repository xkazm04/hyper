'use client'

import { useEffect, useCallback } from 'react'
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
}

export function useGraphNodes({
  initialNodes, initialEdges, suggestions, hoveredSuggestionId,
  acceptSuggestion, declineSuggestion, setHoveredSuggestionId,
  pathNodeIds = new Set(),
  pathEdgeIds = new Set(),
}: UseGraphNodesProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  useEffect(() => {
    // Add isOnPath to story nodes based on path ancestry
    const storyNodesWithPath = initialNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        isOnPath: pathNodeIds.has(node.id),
      },
    }))

    const suggestionNodes: Node<SuggestedCardNodeData>[] = suggestions.map((suggestion, index) => {
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
    setNodes([...storyNodesWithPath, ...suggestionNodes])
  }, [initialNodes, suggestions, hoveredSuggestionId, acceptSuggestion, declineSuggestion, setHoveredSuggestionId, setNodes, pathNodeIds])

  useEffect(() => {
    // Enhance story edges with path glow styling
    const storyEdgesWithPath = initialEdges.map(edge => {
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

    const suggestionEdges: Edge[] = suggestions.map(suggestion => ({
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
    setEdges([...storyEdgesWithPath, ...suggestionEdges])
  }, [initialEdges, suggestions, setEdges, pathEdgeIds])

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
