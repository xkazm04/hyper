'use client'

import React, { useCallback, useMemo, useRef, useState, lazy, Suspense } from 'react'
import ReactFlow, { Controls, MiniMap, ConnectionLineType, Node, Edge, Background, BackgroundVariant } from 'reactflow'
import 'reactflow/dist/style.css'
import StoryNode, { StoryNodeData } from './StoryNode'
import SuggestedCardNode, { SuggestedCardNodeData } from '../../sub_InfiniteCanvas/components/SuggestedCardNode'
import { HalloweenMapBackground, NodeParticleEffect } from './HalloweenMapBackground'
import { NodePreviewPanel } from './NodePreviewPanel'
import NodeDropConfetti from './NodeDropConfetti'
import { NodeSearchWrapper } from './NodeSearchWrapper'
import { cn } from '@/lib/utils'
import { SuggestedCard } from '@/lib/types/ai-canvas'
import { DefaultBackground, useGraphNodes } from './sub_GraphCanvas'
import { useEditor } from '@/contexts/EditorContext'
import { playDropChime, warmupAudio } from '../lib/dropChime'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

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
  onEditCard?: (cardId: string) => void
  onDeleteCard?: (cardId: string) => void
  children?: React.ReactNode
}

// Hover state for node preview
interface NodeHoverState {
  nodeId: string | null
  screenPosition: { x: number; y: number } | null
}

export function GraphCanvas({
  initialNodes, initialEdges, suggestions, hoveredSuggestionId, acceptSuggestion,
  declineSuggestion, setHoveredSuggestionId, onNodeClick, currentCardId, isHalloween,
  pathNodeIds, pathEdgeIds, onOrphanAttachClick, onEditCard, onDeleteCard, children,
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

  // Performance context for controlling decorative animations
  const { showHeavyAnimations, isLowPower } = usePerformanceOptional()

  const { nodes, edges, onNodesChange, onEdgesChange, nodeColor } = useGraphNodes({
    initialNodes, initialEdges, suggestions, hoveredSuggestionId, acceptSuggestion, declineSuggestion, setHoveredSuggestionId,
    pathNodeIds, pathEdgeIds, onOrphanAttachClick, highlightedNodeIds,
  })

  const nodeTypes = useMemo(() => ({ storyNode: StoryNode, suggestedNode: SuggestedCardNode }), [])

  const removeParticleEffect = useCallback((id: string) => {
    setParticleEffects(prev => prev.filter(p => p.id !== id))
  }, [])

  // Remove confetti effect after animation completes
  const removeConfettiEffect = useCallback((id: string) => {
    setConfettiEffects(prev => prev.filter(c => c.id !== id))
  }, [])

  // Handle node drag start - warm up audio
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true
    warmupAudio()
  }, [])

  // Handle node drag stop - trigger confetti and chime
  const handleNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false

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

    // Play chime sound
    playDropChime({ isHalloween })
  }, [isHalloween])

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

  // Handle node mouse enter for preview
  const handleNodeMouseEnter = useCallback((event: React.MouseEvent, node: Node<StoryNodeData>) => {
    // Only show preview for story nodes, not suggested nodes
    if (node.type !== 'storyNode') return

    clearHoverTimeouts()

    // Delay showing preview to avoid flickering and excessive re-renders (increased to 400ms)
    hoverTimeoutRef.current = setTimeout(() => {
      const nodeElement = document.querySelector(`[data-node-id="${node.id}"]`)
      if (nodeElement) {
        const rect = nodeElement.getBoundingClientRect()
        setHoverState({
          nodeId: node.id,
          screenPosition: { x: rect.right, y: rect.top }
        })
      }
    }, 400)
  }, [clearHoverTimeouts])

  // Handle node mouse leave
  const handleNodeMouseLeave = useCallback(() => {
    clearHoverTimeouts()

    // Delay hiding to allow mouse to move to preview panel (increased to 200ms)
    hideTimeoutRef.current = setTimeout(() => {
      setHoverState({ nodeId: null, screenPosition: null })
    }, 200)
  }, [clearHoverTimeouts])

  // Close preview panel
  const closePreview = useCallback(() => {
    clearHoverTimeouts()
    setHoverState({ nodeId: null, screenPosition: null })
  }, [clearHoverTimeouts])

  // Handle edit action from preview panel
  const handleEditFromPreview = useCallback((cardId: string) => {
    if (onEditCard) {
      onEditCard(cardId)
    } else {
      // Default: select the card for editing
      setCurrentCardId(cardId)
    }
    closePreview()
  }, [onEditCard, setCurrentCardId, closePreview])

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
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        nodeTypes={nodeTypes} connectionLineType={ConnectionLineType.SmoothStep}
        fitView fitViewOptions={{ padding: 0.2, maxZoom: 1 }} minZoom={0.05} maxZoom={2}
        defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
        proOptions={{ hideAttribution: true }} style={{ background: 'transparent' }}
      >
        <Background variant={BackgroundVariant.Dots} color="hsl(var(--muted-foreground))" gap={24} size={1} className="opacity-30" />
        <Controls className="bg-card! border-2! border-border! rounded-lg! shadow-lg! [&>button]:bg-card! [&>button]:border-border! [&>button]:text-foreground! [&>button:hover]:bg-muted!" showInteractive={false} data-testid="story-graph-controls" />
        <MiniMap nodeColor={getNodeColor} nodeStrokeWidth={3} maskColor="hsl(var(--background) / 0.8)" className="bg-card/95! border-2! border-border! rounded-lg! shadow-lg!" style={{ width: 180, height: 120 }} pannable zoomable data-testid="story-graph-minimap" />
        {/* Node Search Bar */}
        <NodeSearchWrapper
          nodes={initialNodes}
          isHalloween={isHalloween}
          onHighlightChange={handleHighlightChange}
        />
        {children}
      </ReactFlow>

      {/* Node Preview Panel - rendered via portal */}
      {hoverState.nodeId && hoverState.screenPosition && (
        <NodePreviewPanel
          nodeId={hoverState.nodeId}
          nodePosition={hoverState.screenPosition}
          containerRect={containerRect}
          onEdit={handleEditFromPreview}
          onDelete={handleDeleteFromPreview}
          onClose={closePreview}
        />
      )}
    </div>
  )
}
