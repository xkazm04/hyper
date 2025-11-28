'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, { Controls, MiniMap, ConnectionLineType, Node, Edge, Background, BackgroundVariant } from 'reactflow'
import 'reactflow/dist/style.css'
import StoryNode, { StoryNodeData } from './StoryNode'
import SuggestedCardNode, { SuggestedCardNodeData } from '../../sub_InfiniteCanvas/components/SuggestedCardNode'
import { HalloweenMapBackground, NodeParticleEffect } from './HalloweenMapBackground'
import { cn } from '@/lib/utils'
import { SuggestedCard } from '@/lib/types/ai-canvas'
import { DefaultBackground, useGraphNodes } from './sub_GraphCanvas'

export interface GraphCanvasProps {
  initialNodes: Node<StoryNodeData>[]
  initialEdges: Edge[]
  suggestions: SuggestedCard[]
  hoveredSuggestionId: string | null
  acceptSuggestion: (suggestion: SuggestedCard) => void
  declineSuggestion: (id: string) => void
  setHoveredSuggestionId: (id: string | null) => void
  onNodeClick: (event: React.MouseEvent, node: Node) => void
  currentCardId: string | null
  isHalloween: boolean
  pathNodeIds?: Set<string>
  pathEdgeIds?: Set<string>
  children?: React.ReactNode
}

export function GraphCanvas({
  initialNodes, initialEdges, suggestions, hoveredSuggestionId, acceptSuggestion,
  declineSuggestion, setHoveredSuggestionId, onNodeClick, currentCardId, isHalloween,
  pathNodeIds, pathEdgeIds, children,
}: GraphCanvasProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [particleEffects, setParticleEffects] = useState<Array<{ id: string; x: number; y: number }>>([])

  const { nodes, edges, onNodesChange, onEdgesChange, nodeColor } = useGraphNodes({
    initialNodes, initialEdges, suggestions, hoveredSuggestionId, acceptSuggestion, declineSuggestion, setHoveredSuggestionId,
    pathNodeIds, pathEdgeIds,
  })

  const nodeTypes = useMemo(() => ({ storyNode: StoryNode, suggestedNode: SuggestedCardNode }), [])

  const removeParticleEffect = useCallback((id: string) => {
    setParticleEffects(prev => prev.filter(p => p.id !== id))
  }, [])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(event, node)
    if (isHalloween) {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      setParticleEffects(prev => [...prev, { id: `particle-${Date.now()}`, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }])
    }
  }, [onNodeClick, isHalloween])

  const getNodeColor = useCallback((node: Node<StoryNodeData | SuggestedCardNodeData>) => nodeColor(node, isHalloween), [nodeColor, isHalloween])

  return (
    <div ref={graphContainerRef} className={cn("h-full w-full relative bg-background overflow-hidden font-sans", isHalloween && "halloween-cauldron-bubble halloween-fog-layer")} data-testid="story-graph-container" role="tree" aria-label="Story map navigation. Use arrow keys to navigate between connected scenes, Page Up/Down to jump between levels." aria-activedescendant={currentCardId ? `story-node-${currentCardId}` : undefined}>
      {isHalloween ? <HalloweenMapBackground /> : <DefaultBackground />}

      {particleEffects.map(effect => (
        <NodeParticleEffect key={effect.id} x={effect.x} y={effect.y} onComplete={() => removeParticleEffect(effect.id)} />
      ))}

      <ReactFlow
        nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick} nodeTypes={nodeTypes} connectionLineType={ConnectionLineType.SmoothStep}
        fitView fitViewOptions={{ padding: 0.2, maxZoom: 1 }} minZoom={0.05} maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }} style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} color="hsl(var(--muted-foreground))" gap={24} size={1} className="opacity-30" />
        <Controls className="bg-card! border-2! border-border! rounded-lg! shadow-lg! [&>button]:bg-card! [&>button]:border-border! [&>button]:text-foreground! [&>button:hover]:bg-muted!" showInteractive={false} data-testid="story-graph-controls" />
        <MiniMap nodeColor={getNodeColor} nodeStrokeWidth={3} maskColor="hsl(var(--background) / 0.8)" className="bg-card/95! border-2! border-border! rounded-lg! shadow-lg!" style={{ width: 180, height: 120 }} pannable zoomable data-testid="story-graph-minimap" />
        {children}
      </ReactFlow>
    </div>
  )
}
