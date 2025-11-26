'use client'

import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Panel,
  Node,
  Background,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEditor } from '@/contexts/EditorContext'
import StoryNode, { StoryNodeData } from './components/StoryNode'
import { useStoryGraphData } from './hooks/useStoryGraphData'
import { AIStoryAssistant } from './components/AIStoryAssistant'
import {
  Play,
  AlertTriangle,
  AlertCircle,
  Compass,
  MapPin,
  Circle,
} from 'lucide-react'

export default function StoryGraph() {
  const { setCurrentCardId } = useEditor()
  const { nodes: initialNodes, edges: initialEdges, analysis } = useStoryGraphData()

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Memoize nodeTypes to prevent re-creation
  const nodeTypes = useMemo(() => ({
    storyNode: StoryNode,
  }), [])

  // Sync with data changes
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, setNodes, initialEdges, setEdges])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setCurrentCardId(node.id)
    },
    [setCurrentCardId]
  )

  // Custom minimap node color based on status
  const nodeColor = useCallback((node: Node<StoryNodeData>) => {
    if (node.data.isFirst) return 'hsl(var(--primary))'
    if (node.data.isOrphaned) return 'hsl(45, 93%, 47%)'
    if (node.data.isDeadEnd) return 'hsl(0, 84%, 60%)'
    if (node.data.isIncomplete) return 'hsl(var(--muted-foreground))'
    return 'hsl(142, 71%, 45%)'
  }, [])

  // Statistics for the graph
  const stats = useMemo(() => ({
    total: nodes.length,
    orphaned: analysis.orphanedCards.size,
    deadEnds: analysis.deadEndCards.size,
    incomplete: analysis.incompleteCards.size,
    complete: nodes.length - analysis.incompleteCards.size,
  }), [nodes.length, analysis])

  return (
    <div className="h-full w-full relative bg-background overflow-hidden font-sans">
      {/* Videogame Map Background Pattern */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-muted/50" />

        {/* Grid pattern - hex/diamond like videogame maps */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexGrid" width="60" height="52" patternUnits="userSpaceOnUse">
              <path
                d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-foreground"
              />
            </pattern>
            <pattern id="dotGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1" className="fill-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexGrid)" />
        </svg>

        {/* Subtle compass rose decoration */}
        <div className="absolute top-4 left-4 opacity-10">
          <Compass className="w-16 h-16 text-foreground" />
        </div>

        {/* Vignette effect */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_hsl(var(--muted)/0.5)]" />
      </div>

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

        {/* Controls with theme styling */}
        <Controls
          className="!bg-card !border-2 !border-border !rounded-lg !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-muted"
          showInteractive={false}
        />

        {/* MiniMap for large graph navigation */}
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          maskColor="hsl(var(--background) / 0.8)"
          className="!bg-card/95 !border-2 !border-border !rounded-lg !shadow-lg"
          style={{ width: 180, height: 120 }}
          pannable
          zoomable
        />

        {/* Top-right Panel: Legend & AI Assistant */}
        <Panel position="top-right" className="flex flex-col gap-3 items-end max-w-[280px]">
          {/* Stats Overview Card */}
          <div className="bg-card/95 border-2 border-border rounded-lg p-3 shadow-lg backdrop-blur-sm w-full">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
              <MapPin className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Story Map</h3>
              <span className="ml-auto text-xs text-muted-foreground font-medium">
                {stats.total} scenes
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Completion</span>
                <span className="font-semibold text-foreground">
                  {stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.complete / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Legend Items */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <LegendItem
                icon={<Play className="w-3 h-3" />}
                label="Start"
                color="bg-primary"
                borderColor="border-primary"
              />
              <LegendItem
                icon={<Circle className="w-3 h-3" />}
                label="Scene"
                color="bg-card"
                borderColor="border-border"
              />
              <LegendItem
                icon={<AlertTriangle className="w-3 h-3" />}
                label={`Orphaned (${stats.orphaned})`}
                color="bg-amber-500/20"
                borderColor="border-amber-500"
                alert={stats.orphaned > 0}
              />
              <LegendItem
                icon={<AlertCircle className="w-3 h-3" />}
                label={`Dead End (${stats.deadEnds})`}
                color="bg-red-500/20"
                borderColor="border-red-500"
                alert={stats.deadEnds > 0}
              />
            </div>
          </div>

          {/* AI Assistant */}
          <AIStoryAssistant />
        </Panel>
      </ReactFlow>
    </div>
  )
}

function LegendItem({
  icon,
  label,
  color,
  borderColor,
  alert = false
}: {
  icon: React.ReactNode
  label: string
  color: string
  borderColor: string
  alert?: boolean
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${alert ? 'bg-destructive/10' : ''}`}>
      <div className={`w-4 h-4 rounded-sm border-2 ${color} ${borderColor} flex items-center justify-center`}>
        {icon}
      </div>
      <span className={`text-xs ${alert ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  )
}
