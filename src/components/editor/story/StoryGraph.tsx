'use client'

import { useEditor } from '@/contexts/EditorContext'
import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { AlertCircle, AlertTriangle, Network } from 'lucide-react'

export default function StoryGraph() {
  const { storyCards, choices, currentCardId, setCurrentCardId, storyStack } = useEditor()

  // Calculate which cards are orphaned (no incoming links) and dead-ends (no outgoing choices)
  const cardAnalysis = useMemo(() => {
    const hasIncomingLinks = new Set<string>()
    const hasOutgoingChoices = new Set<string>()

    // Track which cards have incoming links from choices
    choices.forEach(choice => {
      if (choice.targetCardId) {
        hasIncomingLinks.add(choice.targetCardId)
      }
    })

    // Track which cards have outgoing choices
    choices.forEach(choice => {
      hasOutgoingChoices.add(choice.storyCardId)
    })

    // First card is not orphaned (it's the entry point)
    if (storyStack?.firstCardId) {
      hasIncomingLinks.add(storyStack.firstCardId)
    }

    return {
      orphanedCards: storyCards
        .filter(card => !hasIncomingLinks.has(card.id))
        .map(card => card.id),
      deadEndCards: storyCards
        .filter(card => !hasOutgoingChoices.has(card.id))
        .map(card => card.id),
    }
  }, [storyCards, choices, storyStack?.firstCardId])

  // Convert story cards to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    return storyCards.map((card, index) => {
      const isOrphaned = cardAnalysis.orphanedCards.includes(card.id)
      const isDeadEnd = cardAnalysis.deadEndCards.includes(card.id)
      const isSelected = card.id === currentCardId
      const isFirstCard = card.id === storyStack?.firstCardId

      // Determine node color based on status
      let backgroundColor = 'hsl(var(--card))'
      let borderColor = 'hsl(var(--border))'
      let borderWidth = 2

      if (isSelected) {
        borderColor = 'hsl(var(--primary))'
        borderWidth = 3
      } else if (isOrphaned && !isFirstCard) {
        backgroundColor = '#fef3c7' // yellow-100
        borderColor = '#f59e0b' // yellow-500
      } else if (isDeadEnd) {
        backgroundColor = '#fee2e2' // red-100
        borderColor = '#ef4444' // red-500
      }

      return {
        id: card.id,
        type: 'default',
        position: {
          x: (index % 3) * 250,
          y: Math.floor(index / 3) * 150,
        },
        data: {
          label: (
            <div className="px-3 py-2 min-w-[180px]">
              <div className="font-semibold text-sm mb-1 truncate">
                {card.title || 'Untitled Card'}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {isFirstCard && (
                  <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    START
                  </span>
                )}
                {isOrphaned && !isFirstCard && (
                  <span className="flex items-center gap-0.5 text-yellow-700">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px]">Orphaned</span>
                  </span>
                )}
                {isDeadEnd && (
                  <span className="flex items-center gap-0.5 text-red-700">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-[10px]">Dead End</span>
                  </span>
                )}
              </div>
            </div>
          ),
        },
        style: {
          backgroundColor,
          border: `${borderWidth}px solid ${borderColor}`,
          borderRadius: '8px',
          fontSize: '12px',
          padding: 0,
        },
      }
    })
  }, [storyCards, cardAnalysis, currentCardId, storyStack?.firstCardId])

  // Convert choices to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    return choices
      .filter(choice => choice.targetCardId) // Only show choices with valid targets
      .map(choice => ({
        id: choice.id,
        source: choice.storyCardId,
        target: choice.targetCardId,
        type: ConnectionLineType.SmoothStep,
        animated: true,
        style: {
          stroke: 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
        },
        label: choice.label,
        labelStyle: {
          fontSize: '10px',
          fill: 'hsl(var(--foreground))',
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: 'hsl(var(--muted))',
          fillOpacity: 0.9,
        },
      }))
  }, [choices])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes and edges when data changes
  useMemo(() => {
    setNodes(initialNodes)
  }, [initialNodes, setNodes])

  useMemo(() => {
    setEdges(initialEdges)
  }, [initialEdges, setEdges])

  // Handle node click to navigate to that card
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setCurrentCardId(node.id)
    },
    [setCurrentCardId]
  )

  if (storyCards.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <Network className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <div className="text-sm text-muted-foreground">
            Add cards to see the story flow
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Graph */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: ConnectionLineType.SmoothStep,
            animated: true,
          }}
        >
          <Background />
          <Controls
            showInteractive={false}
            className="[&_button]:bg-background [&_button]:border-2 [&_button]:border-border [&_button]:rounded [&_button]:touch-manipulation"
          />
          <Panel position="top-right" className="bg-card border-2 border-border rounded p-1.5 sm:p-2 text-[10px] sm:text-xs max-w-[200px] sm:max-w-none">
            <div className="space-y-0.5 sm:space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-100 border-2 border-yellow-500 rounded shrink-0"></div>
                <span className="leading-tight">Orphaned</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border-2 border-red-500 rounded shrink-0"></div>
                <span className="leading-tight">Dead End</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-card border-3 border-primary rounded shrink-0"></div>
                <span className="leading-tight">Selected</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  )
}
