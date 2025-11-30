/**
 * Zustand store for story graph state with memoized selectors
 *
 * This store decouples graph layout computation from UI state updates,
 * ensuring expensive dagre calculations only happen when story structure changes.
 *
 * Layout computation can be offloaded to the server with caching for better performance
 * on large graphs. The store maintains both client-side and server-side layout capabilities.
 *
 * The store now integrates with GraphStreamHub for reactive updates:
 * - Subscribes to debounced structural events for layout updates
 * - Subscribes to selection events for fast selection updates
 * - Throttles heavy operations for better responsiveness
 */
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Node, Edge, Position, MarkerType } from 'reactflow'
import { StoryCard, Choice, Character, StoryStack } from '@/lib/types'
import { StoryNodeData } from '../components/StoryNode'
import {
  createHierarchicalLayout,
  createIncrementalLayout,
  getEdgeColor,
  CardAnalysis,
  NodePosition,
} from '../hooks/useGraphLayout'
import { analyzeCards } from '../hooks/useGraphOperations'
import {
  GraphSnapshot,
  GraphDiff,
  createGraphSnapshot,
  computeGraphDiff,
  getNodesNeedingLayout,
} from '../hooks/useGraphDiff'
import { computeHiddenNodes, computeHiddenDescendantCounts } from './hiddenNodesUtils'
import { computeBatchNodeDimensions, NodeDimensions } from './nodeDimensions'
import { computeGraphLayout } from '../actions/computeLayout'
import { getGraphStreamHub, GraphMutationEvent } from './graphStreamHub'
import {
  createChoiceSignature,
  getSessionLayoutCache,
  setSessionLayoutCache,
} from './layoutCache'
import { Subscription } from 'rxjs'

// ============================================================================
// Types
// ============================================================================

export interface StoryGraphState {
  // Source data (synced from EditorContext)
  storyCards: StoryCard[]
  choices: Choice[]
  characters: Character[]
  firstCardId: string | null
  currentCardId: string | null
  collapsedNodes: Set<string>
  stackId: string | null

  // Computed graph data (memoized)
  nodes: Node<StoryNodeData>[]
  edges: Edge[]
  analysis: CardAnalysis
  hiddenNodes: Set<string>
  hiddenDescendantCount: Map<string, number>

  // Internal state for incremental layout
  _snapshot: GraphSnapshot | null
  _positions: Map<string, NodePosition>
  _lastStructureHash: string
  _lastChoiceSignature: string  // For session cache invalidation
  _nodeDimensions: Map<string, NodeDimensions>
  _serverLayoutPending: boolean
  _lastServerLayoutHash: string | null
  _useServerLayout: boolean

  // Actions
  syncFromEditor: (data: SyncData) => void
  syncFromEditorWithServerLayout: (data: SyncData) => Promise<void>
  setCurrentCardId: (cardId: string | null) => void
  setCollapsedNodes: (nodes: Set<string>) => void
  toggleNodeCollapsed: (nodeId: string) => void
  setUseServerLayout: (enabled: boolean) => void
  applyServerPositions: (positions: Record<string, { x: number; y: number }>, structureHash: string) => void
}

export interface SyncData {
  storyCards: StoryCard[]
  choices: Choice[]
  characters: Character[]
  storyStack: StoryStack | null
  collapsedNodes: Set<string>
  currentCardId: string | null
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a hash of the story structure for change detection.
 * Only includes properties that affect layout.
 */
function createStructureHash(
  storyCards: StoryCard[],
  choices: Choice[],
  firstCardId: string | null,
  collapsedNodes: Set<string>
): string {
  const cardIds = storyCards.map(c => c.id).sort().join(',')
  const choiceSignatures = choices
    .map(c => `${c.id}:${c.storyCardId}->${c.targetCardId || 'null'}:${c.orderIndex}`)
    .sort()
    .join('|')
  const collapsed = Array.from(collapsedNodes).sort().join(',')
  return `${cardIds}::${choiceSignatures}::${firstCardId || 'null'}::${collapsed}`
}

/**
 * Compute nodes and edges from story data with incremental layout optimization
 */
function computeNodesAndEdges(
  storyCards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  firstCardId: string | null,
  currentCardId: string | null,
  collapsedNodes: Set<string>,
  analysis: CardAnalysis,
  hiddenNodes: Set<string>,
  hiddenDescendantCount: Map<string, number>,
  prevSnapshot: GraphSnapshot | null,
  prevPositions: Map<string, NodePosition>,
  nodeDimensions: Map<string, NodeDimensions>
): { nodes: Node<StoryNodeData>[]; edges: Edge[]; positions: Map<string, NodePosition>; snapshot: GraphSnapshot } {
  if (storyCards.length === 0) {
    return {
      nodes: [],
      edges: [],
      positions: new Map(),
      snapshot: createGraphSnapshot([], [], null),
    }
  }

  // Filter out hidden nodes (descendants of collapsed nodes)
  const visibleCards = storyCards.filter(card => !hiddenNodes.has(card.id))

  // Filter choices to only include those between visible nodes
  const visibleChoices = choices.filter(choice =>
    !hiddenNodes.has(choice.storyCardId) &&
    (!choice.targetCardId || !hiddenNodes.has(choice.targetCardId))
  )

  // Create current snapshot for diffing
  const currentSnapshot = createGraphSnapshot(visibleCards, visibleChoices, firstCardId)

  // Compute graph diff
  const graphDiff: GraphDiff = computeGraphDiff(prevSnapshot, currentSnapshot)

  // Determine which nodes need layout
  const nodesNeedingLayout = getNodesNeedingLayout(graphDiff, analysis.childrenMap)

  // Calculate layout with dynamic dimensions
  let computedPositions: Map<string, NodePosition>

  if (graphDiff.requiresFullLayout || prevPositions.size === 0) {
    const { nodePositions } = createHierarchicalLayout(visibleCards, visibleChoices, analysis, nodeDimensions)
    computedPositions = nodePositions
  } else {
    const { nodePositions } = createIncrementalLayout(
      visibleCards,
      visibleChoices,
      analysis,
      prevPositions,
      nodesNeedingLayout,
      nodeDimensions
    )
    computedPositions = nodePositions
  }

  // Create React Flow Nodes
  const layoutNodes: Node<StoryNodeData>[] = visibleCards.map(card => {
    const position = computedPositions.get(card.id) || { x: 0, y: 0 }
    const isOrphaned = analysis.orphanedCards.has(card.id)
    const isDeadEnd = analysis.deadEndCards.has(card.id)
    const isIncomplete = analysis.incompleteCards.has(card.id)
    const isSelected = card.id === currentCardId
    const isFirst = card.id === firstCardId
    const choiceCount = analysis.choiceCount.get(card.id) || 0
    const nodeDepth = analysis.depth.get(card.id) ?? -1
    const isCollapsed = collapsedNodes.has(card.id)
    const hiddenCount = hiddenDescendantCount.get(card.id) || 0

    // Get dynamic dimensions for this node
    const dimensions = nodeDimensions.get(card.id)

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
        // Dynamic dimensions
        nodeWidth: dimensions?.width,
        nodeHeight: dimensions?.height,
      },
    }
  })

  // Group choices by source for edge styling
  const choicesBySource = new Map<string, Choice[]>()
  visibleChoices.forEach(choice => {
    if (choice.targetCardId && visibleCards.find(c => c.id === choice.targetCardId)) {
      const existing = choicesBySource.get(choice.storyCardId) || []
      existing.push(choice)
      choicesBySource.set(choice.storyCardId, existing)
    }
  })

  // Create React Flow Edges
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

  return { nodes: layoutNodes, edges: layoutEdges, positions: computedPositions, snapshot: currentSnapshot }
}

/**
 * Compute nodes and edges using pre-computed positions (from server cache)
 * This skips the dagre layout computation entirely, using provided positions.
 */
function computeNodesAndEdgesWithPositions(
  storyCards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  firstCardId: string | null,
  currentCardId: string | null,
  collapsedNodes: Set<string>,
  analysis: CardAnalysis,
  hiddenNodes: Set<string>,
  hiddenDescendantCount: Map<string, number>,
  positions: Map<string, NodePosition>,
  nodeDimensions: Map<string, NodeDimensions>
): { nodes: Node<StoryNodeData>[]; edges: Edge[]; snapshot: GraphSnapshot } {
  if (storyCards.length === 0) {
    return {
      nodes: [],
      edges: [],
      snapshot: createGraphSnapshot([], [], null),
    }
  }

  // Filter out hidden nodes (descendants of collapsed nodes)
  const visibleCards = storyCards.filter(card => !hiddenNodes.has(card.id))

  // Filter choices to only include those between visible nodes
  const visibleChoices = choices.filter(choice =>
    !hiddenNodes.has(choice.storyCardId) &&
    (!choice.targetCardId || !hiddenNodes.has(choice.targetCardId))
  )

  // Create current snapshot
  const currentSnapshot = createGraphSnapshot(visibleCards, visibleChoices, firstCardId)

  // Create React Flow Nodes using pre-computed positions
  const layoutNodes: Node<StoryNodeData>[] = visibleCards.map(card => {
    const position = positions.get(card.id) || { x: 0, y: 0 }
    const isOrphaned = analysis.orphanedCards.has(card.id)
    const isDeadEnd = analysis.deadEndCards.has(card.id)
    const isIncomplete = analysis.incompleteCards.has(card.id)
    const isSelected = card.id === currentCardId
    const isFirst = card.id === firstCardId
    const choiceCount = analysis.choiceCount.get(card.id) || 0
    const nodeDepth = analysis.depth.get(card.id) ?? -1
    const isCollapsed = collapsedNodes.has(card.id)
    const hiddenCount = hiddenDescendantCount.get(card.id) || 0

    // Get dynamic dimensions for this node
    const dimensions = nodeDimensions.get(card.id)

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
        // Dynamic dimensions
        nodeWidth: dimensions?.width,
        nodeHeight: dimensions?.height,
      },
    }
  })

  // Group choices by source for edge styling
  const choicesBySource = new Map<string, Choice[]>()
  visibleChoices.forEach(choice => {
    if (choice.targetCardId && visibleCards.find(c => c.id === choice.targetCardId)) {
      const existing = choicesBySource.get(choice.storyCardId) || []
      existing.push(choice)
      choicesBySource.set(choice.storyCardId, existing)
    }
  })

  // Create React Flow Edges
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

  return { nodes: layoutNodes, edges: layoutEdges, snapshot: currentSnapshot }
}

// ============================================================================
// Store Definition
// ============================================================================

const emptyAnalysis: CardAnalysis = {
  orphanedCards: new Set(),
  deadEndCards: new Set(),
  incompleteCards: new Set(),
  choiceCount: new Map(),
  depth: new Map(),
  childrenMap: new Map(),
}

export const useStoryGraphStore = create<StoryGraphState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    storyCards: [],
    choices: [],
    characters: [],
    firstCardId: null,
    currentCardId: null,
    collapsedNodes: new Set(),
    stackId: null,
    nodes: [],
    edges: [],
    analysis: emptyAnalysis,
    hiddenNodes: new Set(),
    hiddenDescendantCount: new Map(),
    _snapshot: null,
    _positions: new Map(),
    _lastStructureHash: '',
    _lastChoiceSignature: '',  // For session cache invalidation
    _nodeDimensions: new Map(),
    _serverLayoutPending: false,
    _lastServerLayoutHash: null,
    _useServerLayout: true, // Enable server layout by default

    /**
     * Sync story data from EditorContext and recompute graph if structure changed
     *
     * Session Cache Integration:
     * - Uses session layout cache for instant view toggle rendering
     * - Only recomputes layout when choices are added, removed, or reordered
     * - Non-choice changes (card content, title edits) use cached positions
     */
    syncFromEditor: (data: SyncData) => {
      const state = get()
      const firstCardId = data.storyStack?.firstCardId ?? null
      const stackId = data.storyStack?.id ?? null

      // Create structure hash to detect changes
      const newHash = createStructureHash(
        data.storyCards,
        data.choices,
        firstCardId,
        data.collapsedNodes
      )

      // Create choice signature for session cache validation
      // This determines if layout needs to be recomputed
      const currentChoiceSignature = createChoiceSignature(
        data.choices.map(c => ({
          sourceId: c.storyCardId,
          targetId: c.targetCardId,
          orderIndex: c.orderIndex ?? 0,
        }))
      )

      // If structure hasn't changed, only update currentCardId if needed
      if (newHash === state._lastStructureHash) {
        if (data.currentCardId !== state.currentCardId) {
          // Only update selection - recompute nodes with new selection state
          const updatedNodes = state.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isSelected: node.id === data.currentCardId,
            },
          }))
          // Update edge zIndex for selected card
          const updatedEdges = state.edges.map(edge => ({
            ...edge,
            zIndex: edge.source === data.currentCardId ? 100 : 0,
          }))
          set({
            currentCardId: data.currentCardId,
            nodes: updatedNodes,
            edges: updatedEdges,
          })
        }
        return
      }

      // Structure changed - check if we can use session cache
      const analysis = analyzeCards(data.storyCards, data.choices, firstCardId)
      const hiddenNodes = computeHiddenNodes(data.collapsedNodes, analysis.childrenMap)
      const hiddenDescendantCount = computeHiddenDescendantCounts(data.collapsedNodes, analysis.childrenMap)

      // Compute dynamic node dimensions based on title text
      const nodeDimensions = computeBatchNodeDimensions(data.storyCards)

      // Check if choice structure changed (requires full layout recompute)
      const choiceStructureChanged = currentChoiceSignature !== state._lastChoiceSignature

      // Try to use session cache if available and choice structure hasn't changed
      let computedPositions: Map<string, NodePosition> | null = null

      if (stackId && !choiceStructureChanged) {
        // Check session cache for instant rendering
        computedPositions = getSessionLayoutCache(stackId, currentChoiceSignature)
      }

      let nodes: Node<StoryNodeData>[]
      let edges: Edge[]
      let positions: Map<string, NodePosition>
      let snapshot: GraphSnapshot

      if (computedPositions && computedPositions.size > 0) {
        // Use cached positions for instant rendering (no dagre computation!)
        const result = computeNodesAndEdgesWithPositions(
          data.storyCards,
          data.choices,
          data.characters,
          firstCardId,
          data.currentCardId,
          data.collapsedNodes,
          analysis,
          hiddenNodes,
          hiddenDescendantCount,
          computedPositions,
          nodeDimensions
        )
        nodes = result.nodes
        edges = result.edges
        positions = computedPositions
        snapshot = result.snapshot
      } else {
        // Need to compute layout (dagre)
        const result = computeNodesAndEdges(
          data.storyCards,
          data.choices,
          data.characters,
          firstCardId,
          data.currentCardId,
          data.collapsedNodes,
          analysis,
          hiddenNodes,
          hiddenDescendantCount,
          state._snapshot,
          state._positions,
          nodeDimensions
        )
        nodes = result.nodes
        edges = result.edges
        positions = result.positions
        snapshot = result.snapshot

        // Cache the computed positions for future view toggles
        if (stackId) {
          setSessionLayoutCache(
            stackId,
            positions,
            newHash,
            currentChoiceSignature
          )
        }
      }

      set({
        storyCards: data.storyCards,
        choices: data.choices,
        characters: data.characters,
        firstCardId,
        currentCardId: data.currentCardId,
        collapsedNodes: data.collapsedNodes,
        stackId,
        nodes,
        edges,
        analysis,
        hiddenNodes,
        hiddenDescendantCount,
        _snapshot: snapshot,
        _positions: positions,
        _lastStructureHash: newHash,
        _lastChoiceSignature: currentChoiceSignature,
        _nodeDimensions: nodeDimensions,
      })
    },

    /**
     * Update current card selection without recomputing layout
     */
    setCurrentCardId: (cardId: string | null) => {
      const state = get()
      if (cardId === state.currentCardId) return

      const updatedNodes = state.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isSelected: node.id === cardId,
        },
      }))
      const updatedEdges = state.edges.map(edge => ({
        ...edge,
        zIndex: edge.source === cardId ? 100 : 0,
      }))

      set({
        currentCardId: cardId,
        nodes: updatedNodes,
        edges: updatedEdges,
      })
    },

    /**
     * Update collapsed nodes and recompute graph
     */
    setCollapsedNodes: (nodes: Set<string>) => {
      const state = get()
      const newHash = createStructureHash(
        state.storyCards,
        state.choices,
        state.firstCardId,
        nodes
      )

      if (newHash === state._lastStructureHash) return

      const hiddenNodes = computeHiddenNodes(nodes, state.analysis.childrenMap)
      const hiddenDescendantCount = computeHiddenDescendantCounts(nodes, state.analysis.childrenMap)

      const { nodes: layoutNodes, edges, positions, snapshot } = computeNodesAndEdges(
        state.storyCards,
        state.choices,
        state.characters,
        state.firstCardId,
        state.currentCardId,
        nodes,
        state.analysis,
        hiddenNodes,
        hiddenDescendantCount,
        state._snapshot,
        state._positions,
        state._nodeDimensions
      )

      set({
        collapsedNodes: nodes,
        nodes: layoutNodes,
        edges,
        hiddenNodes,
        hiddenDescendantCount,
        _snapshot: snapshot,
        _positions: positions,
        _lastStructureHash: newHash,
      })
    },

    /**
     * Toggle a single node's collapsed state
     */
    toggleNodeCollapsed: (nodeId: string) => {
      const state = get()
      const newCollapsed = new Set(state.collapsedNodes)
      if (newCollapsed.has(nodeId)) {
        newCollapsed.delete(nodeId)
      } else {
        newCollapsed.add(nodeId)
      }
      get().setCollapsedNodes(newCollapsed)
    },

    /**
     * Enable or disable server-side layout computation
     */
    setUseServerLayout: (enabled: boolean) => {
      set({ _useServerLayout: enabled })
    },

    /**
     * Apply pre-computed positions from server
     */
    applyServerPositions: (positions: Record<string, { x: number; y: number }>, structureHash: string) => {
      const state = get()

      // Convert record to Map
      const positionsMap = new Map<string, NodePosition>()
      Object.entries(positions).forEach(([id, pos]) => {
        positionsMap.set(id, pos)
      })

      // Update node positions
      const updatedNodes = state.nodes.map(node => ({
        ...node,
        position: positions[node.id] || node.position,
      }))

      set({
        nodes: updatedNodes,
        _positions: positionsMap,
        _lastServerLayoutHash: structureHash,
        _serverLayoutPending: false,
      })
    },

    /**
     * Sync from editor with server-side layout computation
     * This fetches layout from the server with caching, falling back to client-side if needed
     *
     * Session Cache Integration:
     * - First checks session cache for instant rendering
     * - Falls back to server layout for large graphs
     * - Finally uses client-side dagre if all else fails
     */
    syncFromEditorWithServerLayout: async (data: SyncData) => {
      const state = get()
      const firstCardId = data.storyStack?.firstCardId ?? null
      const stackId = data.storyStack?.id ?? null

      // Create structure hash to detect changes
      const newHash = createStructureHash(
        data.storyCards,
        data.choices,
        firstCardId,
        data.collapsedNodes
      )

      // Create choice signature for session cache validation
      const currentChoiceSignature = createChoiceSignature(
        data.choices.map(c => ({
          sourceId: c.storyCardId,
          targetId: c.targetCardId,
          orderIndex: c.orderIndex ?? 0,
        }))
      )

      // If structure hasn't changed, only update currentCardId if needed
      if (newHash === state._lastStructureHash) {
        if (data.currentCardId !== state.currentCardId) {
          const updatedNodes = state.nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isSelected: node.id === data.currentCardId,
            },
          }))
          const updatedEdges = state.edges.map(edge => ({
            ...edge,
            zIndex: edge.source === data.currentCardId ? 100 : 0,
          }))
          set({
            currentCardId: data.currentCardId,
            nodes: updatedNodes,
            edges: updatedEdges,
          })
        }
        return
      }

      // Structure changed - compute analysis and hidden nodes first (needed for node/edge creation)
      const analysis = analyzeCards(data.storyCards, data.choices, firstCardId)
      const hiddenNodes = computeHiddenNodes(data.collapsedNodes, analysis.childrenMap)
      const hiddenDescendantCount = computeHiddenDescendantCounts(data.collapsedNodes, analysis.childrenMap)
      const nodeDimensions = computeBatchNodeDimensions(data.storyCards)

      // Check if choice structure changed (requires full layout recompute)
      const choiceStructureChanged = currentChoiceSignature !== state._lastChoiceSignature

      // Priority 1: Try session cache for instant rendering (if choice structure unchanged)
      if (stackId && !choiceStructureChanged) {
        const cachedPositions = getSessionLayoutCache(stackId, currentChoiceSignature)
        if (cachedPositions && cachedPositions.size > 0) {
          // Use cached positions for instant rendering!
          const { nodes, edges, snapshot } = computeNodesAndEdgesWithPositions(
            data.storyCards,
            data.choices,
            data.characters,
            firstCardId,
            data.currentCardId,
            data.collapsedNodes,
            analysis,
            hiddenNodes,
            hiddenDescendantCount,
            cachedPositions,
            nodeDimensions
          )

          set({
            storyCards: data.storyCards,
            choices: data.choices,
            characters: data.characters,
            firstCardId,
            currentCardId: data.currentCardId,
            collapsedNodes: data.collapsedNodes,
            stackId,
            nodes,
            edges,
            analysis,
            hiddenNodes,
            hiddenDescendantCount,
            _snapshot: snapshot,
            _positions: cachedPositions,
            _lastStructureHash: newHash,
            _lastChoiceSignature: currentChoiceSignature,
            _nodeDimensions: nodeDimensions,
          })

          return
        }
      }

      // Priority 2: Try server-side layout if enabled and we have a stack ID
      if (state._useServerLayout && stackId) {
        set({ _serverLayoutPending: true, stackId })

        try {
          // Call server action for layout computation with caching
          const result = await computeGraphLayout({
            stackId,
            cards: data.storyCards.map(c => ({ id: c.id, title: c.title || 'Untitled' })),
            choices: data.choices.map(c => ({
              id: c.id,
              storyCardId: c.storyCardId,
              targetCardId: c.targetCardId,
              orderIndex: c.orderIndex ?? 0,
            })),
            firstCardId,
            collapsedNodes: Array.from(data.collapsedNodes),
          })

          // Convert server positions to Map
          const positionsMap = new Map<string, NodePosition>()
          Object.entries(result.positions).forEach(([id, pos]) => {
            positionsMap.set(id, pos)
          })

          // Create nodes and edges with server-computed positions
          const { nodes, edges, snapshot } = computeNodesAndEdgesWithPositions(
            data.storyCards,
            data.choices,
            data.characters,
            firstCardId,
            data.currentCardId,
            data.collapsedNodes,
            analysis,
            hiddenNodes,
            hiddenDescendantCount,
            positionsMap,
            nodeDimensions
          )

          // Cache the server-computed positions for future view toggles
          setSessionLayoutCache(
            stackId,
            positionsMap,
            newHash,
            currentChoiceSignature
          )

          set({
            storyCards: data.storyCards,
            choices: data.choices,
            characters: data.characters,
            firstCardId,
            currentCardId: data.currentCardId,
            collapsedNodes: data.collapsedNodes,
            stackId,
            nodes,
            edges,
            analysis,
            hiddenNodes,
            hiddenDescendantCount,
            _snapshot: snapshot,
            _positions: positionsMap,
            _lastStructureHash: newHash,
            _lastChoiceSignature: currentChoiceSignature,
            _nodeDimensions: nodeDimensions,
            _serverLayoutPending: false,
            _lastServerLayoutHash: result.structureHash,
          })

          return
        } catch (error) {
          console.warn('Server layout computation failed, falling back to client-side:', error)
          set({ _serverLayoutPending: false })
          // Fall through to client-side computation
        }
      }

      // Priority 3: Client-side fallback
      const { nodes, edges, positions, snapshot } = computeNodesAndEdges(
        data.storyCards,
        data.choices,
        data.characters,
        firstCardId,
        data.currentCardId,
        data.collapsedNodes,
        analysis,
        hiddenNodes,
        hiddenDescendantCount,
        state._snapshot,
        state._positions,
        nodeDimensions
      )

      // Cache the client-computed positions for future view toggles
      if (stackId) {
        setSessionLayoutCache(
          stackId,
          positions,
          newHash,
          currentChoiceSignature
        )
      }

      set({
        storyCards: data.storyCards,
        choices: data.choices,
        characters: data.characters,
        firstCardId,
        currentCardId: data.currentCardId,
        collapsedNodes: data.collapsedNodes,
        stackId,
        nodes,
        edges,
        analysis,
        hiddenNodes,
        hiddenDescendantCount,
        _snapshot: snapshot,
        _positions: positions,
        _lastStructureHash: newHash,
        _lastChoiceSignature: currentChoiceSignature,
        _nodeDimensions: nodeDimensions,
      })
    },
  }))
)

// ============================================================================
// Memoized Selectors
// ============================================================================

// These selectors use Zustand's subscribeWithSelector to ensure components
// only re-render when their specific slice of state changes

export const selectNodes = (state: StoryGraphState) => state.nodes
export const selectEdges = (state: StoryGraphState) => state.edges
export const selectAnalysis = (state: StoryGraphState) => state.analysis
export const selectHiddenNodes = (state: StoryGraphState) => state.hiddenNodes
export const selectCurrentCardId = (state: StoryGraphState) => state.currentCardId

// Combined selector for graph data (nodes + edges + analysis + hiddenNodes)
export const selectGraphData = (state: StoryGraphState) => ({
  nodes: state.nodes,
  edges: state.edges,
  analysis: state.analysis,
  hiddenNodes: state.hiddenNodes,
})

// Selector for orphaned card IDs
export const selectOrphanedCardIds = (state: StoryGraphState) => state.analysis.orphanedCards

// Selector for dead end card IDs
export const selectDeadEndCardIds = (state: StoryGraphState) => state.analysis.deadEndCards

// ============================================================================
// Stream Subscription
// ============================================================================

let streamSubscription: Subscription | null = null

/**
 * Initialize the store's subscription to GraphStreamHub
 * This enables reactive updates from the stream to the store
 *
 * Call this once when the app initializes (e.g., in a layout or provider)
 */
export function initializeStreamSubscription(): () => void {
  if (streamSubscription) {
    return () => {
      streamSubscription?.unsubscribe()
      streamSubscription = null
    }
  }

  const hub = getGraphStreamHub()
  const store = useStoryGraphStore.getState

  // Subscribe to debounced structural events for layout recalculation
  // This uses the 150ms debounce to batch rapid changes
  const structuralSub = hub.debouncedMutations$.subscribe((event: GraphMutationEvent) => {
    // Only process structural changes that require layout
    if (
      event.type === 'graph:sync' ||
      event.type === 'graph:reset' ||
      event.type.includes('add') ||
      event.type.includes('delete') ||
      event.type === 'collapse:toggle'
    ) {
      // Get current state from hub and sync to store
      const hubState = hub.getCurrentState()
      const cards = Array.from(hubState.cards.values())
      const choices = Array.from(hubState.choices.values())
      const characters = Array.from(hubState.characters.values())

      store().syncFromEditor({
        storyCards: cards,
        choices: choices,
        characters: characters,
        storyStack: hubState.firstCardId
          ? ({ id: '', firstCardId: hubState.firstCardId } as StoryStack)
          : null,
        collapsedNodes: hubState.collapsedNodes,
        currentCardId: hubState.currentCardId,
      })
    }
  })

  // Subscribe to throttled selection events for fast UI updates
  // Uses 100ms throttle for responsive but not overwhelming updates
  const selectionSub = hub.throttledMutations$.subscribe((event: GraphMutationEvent) => {
    if (event.type === 'selection:change') {
      store().setCurrentCardId(event.payload.cardId)
    }
  })

  // Combine subscriptions
  streamSubscription = new Subscription()
  streamSubscription.add(structuralSub)
  streamSubscription.add(selectionSub)

  return () => {
    streamSubscription?.unsubscribe()
    streamSubscription = null
  }
}

/**
 * Check if stream subscription is active
 */
export function isStreamSubscribed(): boolean {
  return streamSubscription !== null && !streamSubscription.closed
}
