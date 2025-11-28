'use client'

import { useCallback, useMemo } from 'react'
import { Node } from 'reactflow'
import { useEditor } from '@/contexts/EditorContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/lib/auth/AuthContext'
import { useStoryGraphData } from './hooks/useStoryGraphData'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { usePathAncestry } from './hooks/usePathAncestry'
import { useAISuggestions } from '../sub_InfiniteCanvas/hooks/useAISuggestions'
import { GraphCanvas } from './components/GraphCanvas'
import { GraphControls, GraphStats, AISuggestionsState } from './components/GraphControls'

/**
 * StoryGraph - Main component for visualizing and navigating the story structure
 * 
 * Composes:
 * - GraphCanvas: ReactFlow canvas with nodes, edges, and background effects
 * - GraphControls: Stats panel, legend, and AI assistant
 * 
 * Features:
 * - Hierarchical story visualization
 * - AI-powered suggestions
 * - Keyboard navigation for accessibility
 * - Halloween theme support with cauldron-bubble effect
 */
export default function StoryGraph() {
  const { setCurrentCardId, currentCardId, choices, storyStack, storyCards, collapsedNodes } = useEditor()
  const { theme } = useTheme()
  const { user } = useAuth()
  const userId = user?.id || null
  const isHalloween = theme === 'halloween'
  const { nodes: initialNodes, edges: initialEdges, analysis, hiddenNodes } = useStoryGraphData()

  // AI Co-Creator suggestions
  const {
    suggestions,
    isGenerating,
    error: aiError,
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

  // Keyboard navigation for accessibility
  const { focusableNodes, navigateToNode } = useKeyboardNavigation({
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
    suggestions: suggestions.length,
  }), [initialNodes.length, analysis, hiddenNodes.size, collapsedNodes.size, suggestions.length])

  // AI state for controls
  const aiState: AISuggestionsState = useMemo(() => ({
    suggestions,
    isGenerating,
    error: aiError,
    generateSuggestions,
    dismissAllSuggestions,
  }), [suggestions, isGenerating, aiError, generateSuggestions, dismissAllSuggestions])

  return (
    <GraphCanvas
      initialNodes={initialNodes}
      initialEdges={initialEdges}
      suggestions={suggestions}
      hoveredSuggestionId={hoveredSuggestionId}
      acceptSuggestion={acceptSuggestion}
      declineSuggestion={declineSuggestion}
      setHoveredSuggestionId={setHoveredSuggestionId}
      onNodeClick={onNodeClick}
      currentCardId={currentCardId}
      isHalloween={isHalloween}
      pathNodeIds={pathNodeIds}
      pathEdgeIds={pathEdgeIds}
    >
      <GraphControls
        stats={stats}
        aiState={aiState}
        currentCardId={currentCardId}
        storyCardsLength={storyCards.length}
      />
    </GraphCanvas>
  )
}
