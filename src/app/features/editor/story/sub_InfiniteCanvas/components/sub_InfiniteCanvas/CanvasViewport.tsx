'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Controls,
  MiniMap,
  ConnectionLineType,
  Node,
  Edge,
  Background,
  BackgroundVariant,
  NodeChange,
  EdgeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { StoryNodeData } from '@/app/features/editor/story/sub_StoryGraph/components/StoryNode'
import { SuggestedCardNodeData } from '../SuggestedCardNode'

interface CanvasViewportProps {
  nodes: Node[]
  edges: Edge[]
  nodeTypes: Record<string, React.ComponentType<any>>
  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onNodeClick: (event: React.MouseEvent, node: Node) => void
}

/**
 * CanvasViewport - ReactFlow wrapper with minimap and controls
 * 
 * Features:
 * - ReactFlow canvas with smooth step connections
 * - Dot background pattern
 * - Minimap with custom node colors
 * - Zoom controls
 */
export function CanvasViewport({
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}: CanvasViewportProps) {
  // Custom minimap node color
  const nodeColor = useCallback((node: Node<StoryNodeData | SuggestedCardNodeData>) => {
    // Suggestion nodes are purple
    if (node.type === 'suggestedNode') {
      return 'hsl(270, 70%, 60%)'
    }

    const data = node.data as StoryNodeData
    if (data.isFirst) return 'hsl(var(--primary))'
    if (data.isOrphaned) return 'hsl(45, 93%, 47%)'
    if (data.isDeadEnd) return 'hsl(0, 84%, 60%)'
    if (data.isIncomplete) return 'hsl(var(--muted-foreground))'
    return 'hsl(142, 71%, 45%)'
  }, [])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      connectionLineType={ConnectionLineType.SmoothStep}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={0.05}
      maxZoom={2}
      defaultEdgeOptions={{
        type: 'smoothstep',
        animated: false,
      }}
      proOptions={{ hideAttribution: true }}
      style={{ background: 'transparent' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        color="hsl(var(--muted-foreground))"
        gap={24}
        size={1}
        className="opacity-30"
      />

      <Controls
        className="!bg-card !border-2 !border-border !rounded-lg !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
        showInteractive={false}
      />

      <MiniMap
        nodeColor={nodeColor}
        nodeStrokeWidth={3}
        maskColor="hsl(var(--background) / 0.8)"
        className="!bg-card/95 !border-2 !border-border !rounded-lg !shadow-lg"
        style={{ width: 180, height: 120 }}
        pannable
        zoomable
      />
    </ReactFlow>
  )
}
