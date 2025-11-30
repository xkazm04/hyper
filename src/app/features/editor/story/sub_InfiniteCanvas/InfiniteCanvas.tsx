'use client'

import { useCallback, useMemo, useEffect } from 'react'
import {
  useNodesState,
  useEdgesState,
  Node,
  Edge,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEditor } from '@/contexts/EditorContext'
import StoryNode, { StoryNodeData } from '../sub_StoryGraph/components/StoryNode'
import SuggestedCardNode, { SuggestedCardNodeData } from './components/SuggestedCardNode'
import { useStoryGraphData } from '../sub_StoryGraph/hooks/useStoryGraphData'
import { useAISuggestions } from './hooks/useAISuggestions'
import { useAuth } from '@/lib/auth/AuthContext'
import { cn } from '@/lib/utils'
import { CanvasGrid, CanvasControls, CanvasViewport } from './components/sub_InfiniteCanvas'

interface InfiniteCanvasProps {
  onCardSelect?: (cardId: string) => void
  className?: string
}

export default function InfiniteCanvas({ onCardSelect, className }: InfiniteCanvasProps) {
  const { user } = useAuth()
  const userId = user?.id || null
  const { setCurrentCardId, currentCardId, storyCards, choices, storyStack } = useEditor()
  const {
    nodes: storyNodes,
    edges: storyEdges,
    analysis,
  } = useStoryGraphData()

  const {
    suggestions,
    isGenerating,
    error,
    generateSuggestions,
    acceptSuggestion,
    declineSuggestion,
    dismissAllSuggestions,
    hoveredSuggestionId,
    setHoveredSuggestionId,
  } = useAISuggestions(userId, {
    enabled: !!userId && storyCards.length > 0,
    debounceMs: 3000,
    maxSuggestions: 3,
  })

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Memoize nodeTypes
  const nodeTypes = useMemo(
    () => ({
      storyNode: StoryNode,
      suggestedNode: SuggestedCardNode,
    }),
    []
  )

  // Combine story nodes with suggestion nodes
  useEffect(() => {
    // Create suggestion nodes with handlers
    const suggestionNodes: Node<SuggestedCardNodeData>[] = suggestions.map(
      (suggestion, index) => {
        // Position suggestions to the right of the source card
        const sourceNode = storyNodes.find(n => n.id === suggestion.sourceCardId)
        const baseX = sourceNode?.position.x ?? 400
        const baseY = sourceNode?.position.y ?? 200

        return {
          id: suggestion.id,
          type: 'suggestedNode',
          position: {
            x: baseX + 300,
            y: baseY + (index - 1) * 150,
          },
          data: {
            ...suggestion,
            isHovered: suggestion.id === hoveredSuggestionId,
            onAccept: acceptSuggestion,
            onDecline: declineSuggestion,
            onHover: setHoveredSuggestionId,
          },
        }
      }
    )

    // Combine with story nodes
    setNodes([...storyNodes, ...suggestionNodes])
  }, [
    storyNodes,
    suggestions,
    hoveredSuggestionId,
    acceptSuggestion,
    declineSuggestion,
    setHoveredSuggestionId,
    setNodes,
  ])

  // Create edges including suggestion connections
  useEffect(() => {
    // Create dashed edges for suggestions
    const suggestionEdges: Edge[] = suggestions.map(suggestion => ({
      id: `suggestion-edge-${suggestion.id}`,
      source: suggestion.sourceCardId,
      target: suggestion.id,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: suggestion.confidence >= 0.8
          ? 'hsl(142, 71%, 45%)'
          : suggestion.confidence >= 0.5
          ? 'hsl(45, 93%, 47%)'
          : 'hsl(0, 84%, 60%)',
        strokeWidth: 2,
        strokeDasharray: '5,5',
        opacity: suggestion.isAnimatingOut ? 0 : 0.7,
      },
      labelStyle: {
        fill: 'hsl(var(--muted-foreground))',
        fontWeight: 500,
        fontSize: '10px',
      },
      label: suggestion.choiceLabel,
      labelBgStyle: {
        fill: 'hsl(var(--card))',
        fillOpacity: 0.9,
      },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }))

    setEdges([...storyEdges, ...suggestionEdges])
  }, [storyEdges, suggestions, setEdges])

  // Handle node click
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Only handle clicks on story nodes, not suggestions
      if (node.type === 'storyNode') {
        setCurrentCardId(node.id)
        onCardSelect?.(node.id)
      }
    },
    [setCurrentCardId, onCardSelect]
  )

  // Statistics including suggestions
  const stats = useMemo(
    () => ({
      total: storyNodes.length,
      orphaned: analysis.orphanedCards.size,
      deadEnds: analysis.deadEndCards.size,
      incomplete: analysis.incompleteCards.size,
      complete: storyNodes.length - analysis.incompleteCards.size,
      suggestions: suggestions.length,
    }),
    [storyNodes.length, analysis, suggestions.length]
  )

  return (
    <div
      className={cn(
        'h-full w-full relative bg-background overflow-hidden font-sans halloween-fog-overlay halloween-dust-particles',
        className
      )}
      data-testid="infinite-canvas"
    >
      {/* Videogame Map Background Pattern */}
      <CanvasGrid />

      <CanvasViewport
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
      />

      {/* Top-right Panel: Stats & AI Controls */}
      <div className="absolute top-0 right-0 z-10">
        <CanvasControls stats={stats} />
      </div>
    </div>
  )
}
