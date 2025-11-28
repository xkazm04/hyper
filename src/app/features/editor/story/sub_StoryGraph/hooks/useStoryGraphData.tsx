import { useMemo, useRef } from 'react'
import { Node, Edge, Position, MarkerType } from 'reactflow'
import { useEditor } from '@/contexts/EditorContext'
import { StoryNodeData } from '../components/StoryNode'
import { Choice } from '@/lib/types'
import {
  createHierarchicalLayout,
  createIncrementalLayout,
  getEdgeColor,
  CardAnalysis,
  NodePosition,
} from './useGraphLayout'
import { analyzeCards } from './useGraphOperations'
import { useHiddenNodes } from './useGraphSelection'
import {
  GraphSnapshot,
  GraphDiff,
  createGraphSnapshot,
  computeGraphDiff,
  getNodesNeedingLayout,
} from './useGraphDiff'

/**
 * Cache for preserving layout positions across renders
 */
interface LayoutCache {
  snapshot: GraphSnapshot | null
  positions: Map<string, NodePosition>
}

/**
 * Main hook for story graph data with incremental layout optimization
 *
 * Features:
 * - Graph diff detection to identify changed nodes/edges
 * - Incremental layout recalculation for affected subtrees only
 * - Position preservation for unchanged nodes
 * - Minimal React Flow state updates
 */
export function useStoryGraphData() {
  const { storyCards, choices, currentCardId, storyStack, characters, collapsedNodes } = useEditor()

  // Cache for layout positions and previous snapshot
  const layoutCacheRef = useRef<LayoutCache>({
    snapshot: null,
    positions: new Map(),
  })

  // Memoized analysis
  const cardAnalysis = useMemo(() =>
    analyzeCards(storyCards, choices, storyStack?.firstCardId ?? null),
    [storyCards, choices, storyStack?.firstCardId]
  )

  // Hidden nodes management
  const { hiddenNodes, hiddenDescendantCount } = useHiddenNodes(
    collapsedNodes,
    cardAnalysis.childrenMap
  )

  // Create current graph snapshot for diffing
  const currentSnapshot = useMemo(() =>
    createGraphSnapshot(storyCards, choices, storyStack?.firstCardId ?? null),
    [storyCards, choices, storyStack?.firstCardId]
  )

  // Compute graph diff from previous state
  const graphDiff = useMemo((): GraphDiff => {
    return computeGraphDiff(layoutCacheRef.current.snapshot, currentSnapshot)
  }, [currentSnapshot])

  // Determine which nodes need layout recalculation
  const nodesNeedingLayout = useMemo(() =>
    getNodesNeedingLayout(graphDiff, cardAnalysis.childrenMap),
    [graphDiff, cardAnalysis.childrenMap]
  )

  // Layout and node/edge generation with incremental optimization
  const { nodes, edges, nodePositions } = useMemo(() => {
    if (storyCards.length === 0) {
      return { nodes: [], edges: [], nodePositions: new Map<string, NodePosition>() }
    }

    // Filter out hidden nodes (descendants of collapsed nodes)
    const visibleCards = storyCards.filter(card => !hiddenNodes.has(card.id))

    // Filter choices to only include those between visible nodes
    const visibleChoices = choices.filter(choice =>
      !hiddenNodes.has(choice.storyCardId) &&
      (!choice.targetCardId || !hiddenNodes.has(choice.targetCardId))
    )

    // Calculate layout - use incremental if possible
    let computedPositions: Map<string, NodePosition>

    if (graphDiff.requiresFullLayout || layoutCacheRef.current.positions.size === 0) {
      // Full layout required
      const { nodePositions: fullPositions } = createHierarchicalLayout(visibleCards, visibleChoices, cardAnalysis)
      computedPositions = fullPositions
    } else {
      // Incremental layout - only recalculate affected subtrees
      const { nodePositions: incrementalPositions } = createIncrementalLayout(
        visibleCards,
        visibleChoices,
        cardAnalysis,
        layoutCacheRef.current.positions,
        nodesNeedingLayout
      )
      computedPositions = incrementalPositions
    }

    // Create React Flow Nodes with minimal updates
    const layoutNodes: Node<StoryNodeData>[] = visibleCards.map(card => {
      const position = computedPositions.get(card.id) || { x: 0, y: 0 }
      const isOrphaned = cardAnalysis.orphanedCards.has(card.id)
      const isDeadEnd = cardAnalysis.deadEndCards.has(card.id)
      const isIncomplete = cardAnalysis.incompleteCards.has(card.id)
      const isSelected = card.id === currentCardId
      const isFirst = card.id === storyStack?.firstCardId
      const choiceCount = cardAnalysis.choiceCount.get(card.id) || 0
      const nodeDepth = cardAnalysis.depth.get(card.id) ?? -1
      const isCollapsed = collapsedNodes.has(card.id)
      const hiddenCount = hiddenDescendantCount.get(card.id) || 0

      // Determine characters present in card content
      const presentCharacters = characters
        .filter(char => card.content?.toLowerCase().includes(char.name.toLowerCase()))
        .map(char => char.name)

      // Completion status
      const hasContent = !!(card.content && card.content.trim().length > 0)
      const hasImage = !!card.imageUrl
      const hasTitle = !!(card.title && card.title.trim().length > 0 && card.title !== 'Untitled Card')

      return {
        id: card.id,
        type: 'storyNode',
        position,
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        data: {
          label: card.title || 'Untitled',
          isFirst,
          isOrphaned,
          isDeadEnd,
          isIncomplete,
          isSelected,
          hasImage,
          hasContent,
          hasTitle,
          hasChoices: choiceCount > 0,
          choiceCount,
          characters: presentCharacters,
          depth: nodeDepth,
          isCollapsed,
          hiddenDescendantCount: hiddenCount,
        },
      }
    })

    // Group choices by source for edge styling (only visible nodes)
    const choicesBySource = new Map<string, Choice[]>()
    visibleChoices.forEach(choice => {
      if (choice.targetCardId && visibleCards.find(c => c.id === choice.targetCardId)) {
        const existing = choicesBySource.get(choice.storyCardId) || []
        existing.push(choice)
        choicesBySource.set(choice.storyCardId, existing)
      }
    })

    // Create React Flow Edges with improved styling for large graphs
    const layoutEdges: Edge[] = []

    choicesBySource.forEach((choiceList, sourceId) => {
      const sortedChoices = [...choiceList].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      const totalChoices = sortedChoices.length

      sortedChoices.forEach((choice, index) => {
        const edgeColor = getEdgeColor(index, totalChoices)
        const strokeWidth = totalChoices > 1 ? 2.5 : 2
        const opacity = totalChoices > 1 ? 1 : 0.8

        layoutEdges.push({
          id: choice.id,
          source: choice.storyCardId,
          target: choice.targetCardId,
          type: 'smoothstep',
          animated: false,
          pathOptions: {
            borderRadius: 12,
            offset: totalChoices > 1 ? (index - (totalChoices - 1) / 2) * 8 : 0,
          },
          style: {
            stroke: edgeColor,
            strokeWidth,
            opacity,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edgeColor,
            width: 16,
            height: 16,
          },
          label: totalChoices > 1 ? choice.label : undefined,
          labelStyle: {
            fill: 'hsl(var(--foreground))',
            fontWeight: 600,
            fontSize: '10px',
            fontFamily: 'inherit',
          },
          labelBgStyle: {
            fill: 'hsl(var(--card))',
            fillOpacity: 0.95,
          },
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 4,
          zIndex: choice.storyCardId === currentCardId ? 100 : 0,
        })
      })
    })

    return { nodes: layoutNodes, edges: layoutEdges, nodePositions: computedPositions }
  }, [
    storyCards,
    choices,
    cardAnalysis,
    currentCardId,
    storyStack?.firstCardId,
    characters,
    hiddenNodes,
    collapsedNodes,
    hiddenDescendantCount,
    graphDiff.requiresFullLayout,
    nodesNeedingLayout,
  ])

  // Update cache after successful layout calculation
  // This runs as a side effect after the memoized values are computed
  useMemo(() => {
    layoutCacheRef.current = {
      snapshot: currentSnapshot,
      positions: nodePositions,
    }
  }, [currentSnapshot, nodePositions])

  return { nodes, edges, analysis: cardAnalysis, hiddenNodes }
}
