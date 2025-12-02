'use client'

import { useCallback, useMemo, useState, useRef } from 'react'
import { Node, Panel } from 'reactflow'
import { useEditor } from '@/contexts/EditorContext'
import { useTheme } from '@/contexts/ThemeContext'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'
import { useStoryGraphData } from './hooks/useStoryGraphData'
import { useStoryGraphNavigation } from './hooks/useStoryGraphNavigation'
import { usePathAncestry } from './hooks/usePathAncestry'
import { useBranchDepth } from './hooks/useBranchDepth'
import { usePathProgress } from './hooks/usePathProgress'
import { usePreviousValue } from './hooks/usePreviousValue'
import { usePathProgressSettings } from './hooks/usePathProgressSettings'
import { useOrphanAttachmentActions } from './hooks/useOrphanAttachmentState'
import { useGraphValidation } from './hooks/useGraphValidation'
import { useStoryGraphExport } from './hooks/useStoryGraphExport'
import { GraphCanvas } from './components/GraphCanvas'
import { GraphControls, GraphStats } from './components/GraphControls'
import { BranchDepthProgressBar } from './components/BranchDepthProgressBar'
import { PathProgressBar } from './components/PathProgressBar'
import { OrphanAttachmentHelper } from './components/OrphanAttachmentHelper'
import { ValidationDiagnosticsOverlay } from './components/ValidationDiagnosticsOverlay'
import { BranchNavigator } from './components/BranchNavigator'
import { GraphToolsSidebar, PumpkinOverlay } from './components/GraphToolsSidebar'

/**
 * StoryGraph - Main component for visualizing and navigating the story structure
 *
 * Composes:
 * - GraphCanvas: ReactFlow canvas with nodes, edges, and background effects
 * - GraphControls: Stats panel and unified AI Companion
 *
 * Features:
 * - Hierarchical story visualization
 * - AI-powered story assistance (via AICompanion)
 * - Keyboard navigation for accessibility
 * - Halloween theme support with cauldron-bubble effect
 */
export default function StoryGraph() {
  const { setCurrentCardId, currentCardId, choices, storyStack, storyCards, collapsedNodes } = useEditor()
  const { theme } = useTheme()
  const { showHeavyAnimations } = usePerformanceOptional()
  const isHalloween = theme === 'halloween'
  const { nodes: initialNodes, edges: initialEdges, analysis, hiddenNodes } = useStoryGraphData()

  // File input ref for import
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Graph validation
  const {
    validationResult,
    applyFix,
    navigateToCard,
    isDiagnosticsVisible,
    toggleDiagnosticsVisibility,
  } = useGraphValidation()

  // Export/Import functionality
  const {
    handleExport,
    isExporting,
    handleImportFile,
    isImporting,
  } = useStoryGraphExport()

  // Handle file input change for import
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleImportFile(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleImportFile])

  // Trigger file input click
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Orphan attachment state
  const [activeOrphanId, setActiveOrphanId] = useState<string | null>(null)
  const { getSuggestedParents, attachOrphan } = useOrphanAttachmentActions()

  // Get suggestions for the active orphan
  const orphanSuggestions = useMemo(() => {
    if (!activeOrphanId) return []
    return getSuggestedParents(activeOrphanId)
  }, [activeOrphanId, getSuggestedParents])

  // Get the title of the active orphan card
  const activeOrphanTitle = useMemo(() => {
    if (!activeOrphanId) return ''
    const card = storyCards.find(c => c.id === activeOrphanId)
    return card?.title || 'Untitled'
  }, [activeOrphanId, storyCards])

  // Handle orphan attachment button click
  const handleOrphanAttachClick = useCallback((nodeId: string) => {
    setActiveOrphanId(nodeId)
  }, [])

  // Handle closing the attachment helper
  const handleCloseAttachmentHelper = useCallback(() => {
    setActiveOrphanId(null)
  }, [])

  // Handle attaching orphan to parent
  const handleAttachOrphan = useCallback(async (parentCardId: string, orphanCardId: string) => {
    await attachOrphan(parentCardId, orphanCardId)
  }, [attachOrphan])

  // Keyboard navigation for accessibility
  const { focusableNodes, navigateToNode } = useStoryGraphNavigation({
    nodes: initialNodes,
    choices,
    currentCardId,
    setCurrentCardId,
    firstCardId: storyStack?.firstCardId ?? null,
  })

  // Path ancestry for dynamic glow effect
  const { pathNodeIds, pathEdgeIds } = usePathAncestry(
    currentCardId,
    storyStack?.firstCardId ?? null,
    choices
  )

  // Branch depth for progress bar
  const branchDepth = useBranchDepth(
    currentCardId,
    storyStack?.firstCardId ?? null,
    analysis
  )

  // Track previous card for animation direction
  const previousCardId = usePreviousValue(currentCardId) ?? null

  // Path progress for animated progress bar
  const nodeIds = useMemo(() => new Set(initialNodes.map(n => n.id)), [initialNodes])
  const pathProgress = usePathProgress(
    currentCardId,
    storyStack?.firstCardId ?? null,
    choices,
    previousCardId,
    nodeIds
  )

  // Path progress visibility settings
  const { isVisible: isPathProgressVisible, toggleVisibility: togglePathProgressVisibility } = usePathProgressSettings()

  // Handle node click
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setCurrentCardId(node.id)
    },
    [setCurrentCardId]
  )

  // Statistics for the graph
  const stats: GraphStats = useMemo(() => ({
    total: initialNodes.length + hiddenNodes.size,
    visible: initialNodes.length,
    hidden: hiddenNodes.size,
    collapsed: collapsedNodes.size,
    orphaned: analysis.orphanedCards.size,
    deadEnds: analysis.deadEndCards.size,
    incomplete: analysis.incompleteCards.size,
    complete: initialNodes.length - analysis.incompleteCards.size,
    suggestions: 0, // AI suggestions are now handled internally by AICompanion
  }), [initialNodes.length, analysis, hiddenNodes.size, collapsedNodes.size])

  return (
    <GraphCanvas
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      suggestions={[]}
      hoveredSuggestionId={null}
      acceptSuggestion={() => Promise.resolve()}
      declineSuggestion={() => Promise.resolve()}
      setHoveredSuggestionId={() => {}}
      onNodeClick={onNodeClick}
      currentCardId={currentCardId}
      isHalloween={isHalloween}
      pathNodeIds={pathNodeIds}
      pathEdgeIds={pathEdgeIds}
      onOrphanAttachClick={handleOrphanAttachClick}
    >
      {/* Pumpkin overlay - shown when effects are ON and halloween theme */}
      {isHalloween && <PumpkinOverlay visible={showHeavyAnimations} />}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        data-testid="import-file-input"
      />

      {/* Stats Overview - top right */}
      <GraphControls stats={stats} />

      {/* Icon-only Tools Sidebar - replaces separate panels */}
      <Panel position="top-right" className="mt-[140px]">
        <GraphToolsSidebar
          validationResult={validationResult}
          isValidationVisible={isDiagnosticsVisible}
          onToggleValidation={toggleDiagnosticsVisibility}
          onExport={handleExport}
          onImportClick={handleImportClick}
          isExporting={isExporting}
          isImporting={isImporting}
          isHalloween={isHalloween}
        />
      </Panel>

      {activeOrphanId && (
        <OrphanAttachmentHelper
          orphanCardId={activeOrphanId}
          orphanCardTitle={activeOrphanTitle}
          suggestions={orphanSuggestions}
          onAttach={handleAttachOrphan}
          onClose={handleCloseAttachmentHelper}
          isVisible={!!activeOrphanId}
        />
      )}

      {/* Validation Diagnostics Overlay - shown when toggled from sidebar */}
      <ValidationDiagnosticsOverlay
        validationResult={validationResult}
        onApplyFix={applyFix}
        onNavigateToCard={navigateToCard}
        isVisible={isDiagnosticsVisible}
        onToggleVisibility={toggleDiagnosticsVisibility}
      />

      {/* BranchNavigator - positioned at left, vertically centered to avoid AI Companion at bottom */}
      <Panel position="top-left" className="mt-24">
        <BranchNavigator
          onCardClick={setCurrentCardId}
        />
      </Panel>
    </GraphCanvas>
  )
}
