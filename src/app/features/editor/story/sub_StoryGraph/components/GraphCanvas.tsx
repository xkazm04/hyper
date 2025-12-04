'use client'

import React, { useCallback, useMemo, useRef, useState, useEffect, lazy, Suspense } from 'react'
import ReactFlow, { Controls, MiniMap, ConnectionLineType, Node, Edge, Background, BackgroundVariant, ReactFlowProvider, Viewport, OnMove } from 'reactflow'
import 'reactflow/dist/style.css'
import StoryNode, { StoryNodeData } from './StoryNode'
import SuggestedCardNode, { SuggestedCardNodeData } from '../../sub_InfiniteCanvas/components/SuggestedCardNode'
import { HalloweenMapBackground, NodeParticleEffect } from './HalloweenMapBackground'
import { NodePreviewPanel } from './NodePreviewPanel'
import NodeDropConfetti from './NodeDropConfetti'
import { NodeSearchWrapper } from './NodeSearchWrapper'
import ClusterOverlay from './ClusterOverlay'
import ClusterControls from './ClusterControls'
import { cn } from '@/lib/utils'
import { SuggestedCard } from '@/lib/types/ai-canvas'
import { DefaultBackground, useGraphNodes } from './sub_GraphCanvas'
import { useEditor } from '@/contexts/EditorContext'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'
import { useClusterState } from '../hooks/useClusterState'
import { throttleToFrame, viewportsEqual } from '../lib/viewportThrottle'

// Lazy load decorative components for performance
const FogOverlay = lazy(() => import('./decorative/FogOverlay'))
const DustParticles = lazy(() => import('./decorative/DustParticles'))
const CauldronBubbles = lazy(() => import('./decorative/CauldronBubbles'))

// Simple fallback for lazy loaded components
const DecorativeFallback = () => <div />

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
  onOrphanAttachClick?: (nodeId: string) => void
  onDeleteCard?: (cardId: string) => void
  children?: React.ReactNode
  /** Enable cluster grouping by depth. Defaults to true */
  enableClusters?: boolean
  /** Stats for the compact stats bar */
  stats?: import('./sub_GraphControls').GraphStats
}

// Hover state for node preview
interface NodeHoverState {
  nodeId: string | null
  screenPosition: { x: number; y: number } | null
}

export function GraphCanvas({
  initialNodes, initialEdges, suggestions, hoveredSuggestionId, acceptSuggestion,
  declineSuggestion, setHoveredSuggestionId, onNodeClick, currentCardId, isHalloween,
  pathNodeIds, pathEdgeIds, onOrphanAttachClick, onDeleteCard, children,
  enableClusters = true, stats,
}: GraphCanvasProps) {
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [particleEffects, setParticleEffects] = useState<Array<{ id: string; x: number; y: number }>>([])

  // Node drop confetti effects
  const [confettiEffects, setConfettiEffects] = useState<Array<{ id: string; x: number; y: number; nodeWidth: number }>>([])

  // Node preview hover state
  const [hoverState, setHoverState] = useState<NodeHoverState>({ nodeId: null, screenPosition: null })
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track if we're actively dragging
  const isDraggingRef = useRef(false)

  // Search highlight state
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set())

  const { storyStack, deleteCard, setCurrentCardId } = useEditor()

  // Cluster state management
  const { clusters, toggleCluster, expandAll, collapseAll, collapsedClusters } = useClusterState({
    stackId: storyStack?.id ?? null,
    nodes: initialNodes,
  })

  // Cluster feature toggle
  const [clustersEnabled, setClustersEnabled] = useState(enableClusters)

  // Performance context for controlling decorative animations
  const { showHeavyAnimations, isLowPower } = usePerformanceOptional()

  // Viewport tracking for throttled updates
  const lastViewportRef = useRef<Viewport | null>(null)
  const isInteractingRef = useRef(false)

  const { nodes, edges, onNodesChange, onEdgesChange, nodeColor } = useGraphNodes({
    initialNodes, initialEdges, suggestions, hoveredSuggestionId, acceptSuggestion, declineSuggestion, setHoveredSuggestionId,
    pathNodeIds, pathEdgeIds, onOrphanAttachClick, highlightedNodeIds,
  })

  // Throttled viewport change handler for 60fps performance
  const throttledOnMove = useMemo(() => {
    return throttleToFrame((event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      // Skip if viewport hasn't changed meaningfully
      if (viewportsEqual(lastViewportRef.current, viewport)) {
        return
      }
      lastViewportRef.current = viewport
    })
  }, [])

  // Handle move start - mark as interacting
  const handleMoveStart = useCallback(() => {
    isInteractingRef.current = true
  }, [])

  // Handle move end - mark as not interacting
  const handleMoveEnd = useCallback(() => {
    isInteractingRef.current = false
  }, [])

  // Cleanup throttled handler on unmount
  useEffect(() => {
    return () => {
      throttledOnMove.cancel()
    }
  }, [throttledOnMove])

  const nodeTypes = useMemo(() => ({ storyNode: StoryNode, suggestedNode: SuggestedCardNode }), [])

  const removeParticleEffect = useCallback((id: string) => {
    setParticleEffects(prev => prev.filter(p => p.id !== id))
  }, [])

  // Remove confetti effect after animation completes
  const removeConfettiEffect = useCallback((id: string) => {
    setConfettiEffects(prev => prev.filter(c => c.id !== id))
  }, [])

  // Handle node drag start
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true
  }, [])

  // Handle node drag stop - trigger confetti
  const handleNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    // Guard against undefined node
    if (!node || !node.type) return

    // Only trigger for story nodes, not suggested nodes
    if (node.type !== 'storyNode') return

    // Find the node element to get screen position
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`)
    if (!nodeElement) return

    const rect = nodeElement.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    // Add confetti effect
    setConfettiEffects(prev => [
      ...prev,
      {
        id: `confetti-${Date.now()}-${node.id}`,
        x: centerX,
        y: centerY,
        nodeWidth: rect.width,
      },
    ])
  }, [])

  // Clear all hover timeouts
  const clearHoverTimeouts = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // Handle node right-click for preview (replaces hover behavior)
  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node<StoryNodeData>) => {
    event.preventDefault()

    // Only show preview for story nodes, not suggested nodes
    if (node.type !== 'storyNode') return

    clearHoverTimeouts()

    // Show preview immediately on right-click
    const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`)
    if (nodeElement) {
      const rect = nodeElement.getBoundingClientRect()
      setHoverState({
        nodeId: node.id,
        screenPosition: { x: rect.right, y: rect.top }
      })
    }
  }, [clearHoverTimeouts])

  // Handle node mouse enter - disabled (no longer showing preview on hover)
  const handleNodeMouseEnter = useCallback((_event: React.MouseEvent, _node: Node<StoryNodeData>) => {
    // Preview is now triggered by right-click, not hover
    // This handler is kept for potential future use
  }, [])

  // Handle node mouse leave - disabled (no longer hiding preview on mouse leave)
  const handleNodeMouseLeave = useCallback(() => {
    // Preview is now closed via close button or clicking elsewhere
    // This handler is kept for potential future use
  }, [])

  // Close preview panel
  const closePreview = useCallback(() => {
    clearHoverTimeouts()
    setHoverState({ nodeId: null, screenPosition: null })
  }, [clearHoverTimeouts])

  // Handle delete action from preview panel
  const handleDeleteFromPreview = useCallback(async (cardId: string) => {
    if (onDeleteCard) {
      onDeleteCard(cardId)
    } else if (storyStack) {
      // Default: delete via API
      try {
        const response = await fetch(`/api/stories/${storyStack.id}/cards/${cardId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          deleteCard(cardId)
        }
      } catch (error) {
        console.error('Failed to delete card:', error)
      }
    }
    closePreview()
  }, [onDeleteCard, storyStack, deleteCard, closePreview])

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeClick(event, node)
    if (isHalloween) {
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      setParticleEffects(prev => [...prev, { id: `particle-${Date.now()}`, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }])
    }
  }, [onNodeClick, isHalloween])

  const getNodeColor = useCallback((node: Node<StoryNodeData | SuggestedCardNodeData>) => nodeColor(node, isHalloween), [nodeColor, isHalloween])

  // Handle search highlight changes
  const handleHighlightChange = useCallback((ids: Set<string>) => {
    setHighlightedNodeIds(ids)
  }, [])

  // Get container rect for preview positioning
  const containerRect = graphContainerRef.current?.getBoundingClientRect() ?? null

  // Determine if we should show CSS-based effects (removed when using canvas-based)
  const showCssEffects = isHalloween && !showHeavyAnimations

  return (
    <div ref={graphContainerRef} className={cn("h-full w-full relative bg-background overflow-hidden font-sans", showCssEffects && "halloween-cauldron-bubble halloween-fog-layer")} data-testid="story-graph-container" role="tree" aria-label="Story map navigation. Use arrow keys to navigate between connected scenes, Page Up/Down to jump between levels." aria-activedescendant={currentCardId ? `story-node-${currentCardId}` : undefined}>
      {isHalloween ? <HalloweenMapBackground /> : <DefaultBackground />}

      {/* Performance-optimized decorative layers - only render when Halloween theme is active */}
      {isHalloween && showHeavyAnimations && (
        <Suspense fallback={<DecorativeFallback />}>
          <FogOverlay visible={true} />
          <DustParticles visible={true} />
          <CauldronBubbles visible={true} />
        </Suspense>
      )}

      {/* Node drop confetti effects - respect performance settings */}
      {showHeavyAnimations && confettiEffects.map(effect => (
        <NodeDropConfetti
          key={effect.id}
          x={effect.x}
          y={effect.y}
          nodeWidth={effect.nodeWidth}
          onComplete={() => removeConfettiEffect(effect.id)}
        />
      ))}

      <ReactFlow
        nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onNodeContextMenu={handleNodeContextMenu}
        onMove={throttledOnMove}
        onMoveStart={handleMoveStart}
        onMoveEnd={handleMoveEnd}
        nodeTypes={nodeTypes} connectionLineType={ConnectionLineType.SmoothStep}
        fitView fitViewOptions={{ padding: 0.2, maxZoom: 1 }} minZoom={0.05} maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }} style={{ background: 'transparent' }}
      >
        {/* Cluster Overlay - rendered behind nodes using SVG */}
        {clustersEnabled && clusters.length > 0 && (
          <ClusterOverlay
            clusters={clusters}
            isHalloween={isHalloween}
            onToggleCluster={toggleCluster}
            enabled={clustersEnabled}
          />
        )}
        {/* Cluster Controls Panel */}
        {clusters.length > 0 && (
          <ClusterControls
            clusterCount={clusters.length}
            collapsedCount={collapsedClusters.size}
            expandAll={expandAll}
            collapseAll={collapseAll}
            enabled={clustersEnabled}
            onToggleEnabled={setClustersEnabled}
            isHalloween={isHalloween}
          />
        )}
        <Background variant={BackgroundVariant.Dots} color="hsl(var(--muted-foreground))" gap={24} size={1} className="opacity-30" />
        <Controls className="bg-card! border-2! border-border! rounded-lg! shadow-lg! [&>button]:bg-card! [&>button]:border-border! [&>button]:text-foreground! [&>button:hover]:bg-muted!" showInteractive={false} data-testid="story-graph-controls" />
        <MiniMap nodeColor={getNodeColor} nodeStrokeWidth={3} maskColor="hsl(var(--background) / 0.8)" className="bg-card/95! border-2! border-border! rounded-lg! shadow-lg!" style={{ width: 180, height: 120 }} pannable zoomable data-testid="story-graph-minimap" />
        {/* Stats bar and search bar */}
        <NodeSearchWrapper
          nodes={initialNodes}
          isHalloween={isHalloween}
          onHighlightChange={handleHighlightChange}
          stats={stats}
        />
        {children}
      </ReactFlow>

      {/* Node Preview Panel - rendered via portal, triggered by right-click */}
      {hoverState.nodeId && hoverState.screenPosition && (
        <NodePreviewPanel
          nodeId={hoverState.nodeId}
          nodePosition={hoverState.screenPosition}
          onDelete={handleDeleteFromPreview}
          onClose={closePreview}
        />
      )}
    </div>
  )
}
