import { useMemo } from 'react'
import { Node, Edge, Position, MarkerType } from 'reactflow'
import dagre from 'dagre'
import { useEditor } from '@/contexts/EditorContext'
import { StoryNodeData } from '../components/StoryNode'
import { Choice, StoryCard } from '@/lib/types'

// Optimized node dimensions for large graphs (140px width nodes)
const NODE_WIDTH = 160
const NODE_HEIGHT = 95

// Spacing optimized for decision trees with up to 3 branches
// These values ensure readability even at 100+ nodes
const RANK_SEPARATION = 250  // Horizontal spacing between depth levels (increased for clarity)
const NODE_SEPARATION = 60   // Vertical spacing between sibling nodes (reduced, nodes are compact)
const EDGE_SEPARATION = 25   // Spacing between parallel edges

// Edge styling constants for visual hierarchy
const EDGE_COLORS = {
  branch1: { hue: 220, sat: 60, light: 50 }, // Blue - first choice
  branch2: { hue: 160, sat: 50, light: 45 }, // Teal - second choice
  branch3: { hue: 280, sat: 50, light: 55 }, // Purple - third choice
  single: { hue: 210, sat: 30, light: 55 },  // Subtle blue-gray for single paths
}

interface CardAnalysis {
  orphanedCards: Set<string>
  deadEndCards: Set<string>
  incompleteCards: Set<string>
  choiceCount: Map<string, number>
  depth: Map<string, number>
}

/**
 * Analyzes story cards for status indicators
 */
function analyzeCards(
  storyCards: StoryCard[],
  choices: Choice[],
  firstCardId: string | null
): CardAnalysis {
  const hasIncomingLinks = new Set<string>()
  const hasOutgoingChoices = new Set<string>()
  const choiceCount = new Map<string, number>()
  const depth = new Map<string, number>()

  // Count choices per card and track connections
  choices.forEach(choice => {
    if (choice.targetCardId) {
      hasIncomingLinks.add(choice.targetCardId)
    }
    hasOutgoingChoices.add(choice.storyCardId)
    choiceCount.set(
      choice.storyCardId,
      (choiceCount.get(choice.storyCardId) || 0) + 1
    )
  })

  // First card is always reachable
  if (firstCardId) {
    hasIncomingLinks.add(firstCardId)
  }

  // Calculate depth from first card using BFS
  if (firstCardId) {
    const queue: Array<{ id: string; level: number }> = [{ id: firstCardId, level: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, level } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      depth.set(id, level)

      // Find all choices from this card
      choices
        .filter(c => c.storyCardId === id && c.targetCardId)
        .forEach(c => {
          if (!visited.has(c.targetCardId)) {
            queue.push({ id: c.targetCardId, level: level + 1 })
          }
        })
    }
  }

  // Identify incomplete cards (missing content, image, or choices)
  const incompleteCards = new Set<string>()
  storyCards.forEach(card => {
    const hasContent = card.content && card.content.trim().length > 0
    const hasImage = !!card.imageUrl
    const hasChoices = hasOutgoingChoices.has(card.id)
    const hasTitle = card.title && card.title.trim().length > 0 && card.title !== 'Untitled Card'

    if (!hasContent || !hasImage || !hasTitle) {
      incompleteCards.add(card.id)
    }
  })

  return {
    orphanedCards: new Set(storyCards.filter(c => !hasIncomingLinks.has(c.id)).map(c => c.id)),
    deadEndCards: new Set(storyCards.filter(c => !hasOutgoingChoices.has(c.id)).map(c => c.id)),
    incompleteCards,
    choiceCount,
    depth,
  }
}

/**
 * Creates a hierarchical layout optimized for decision trees with up to 3 branches
 *
 * Layout strategy for 100+ nodes:
 * - Left-to-right flow (chronological reading)
 * - Depth-based ranking to ensure proper tree structure
 * - Vertical fan-out for branches at angles that remain readable
 * - Increased spacing at deeper levels to prevent overlap
 */
function createHierarchicalLayout(
  storyCards: StoryCard[],
  choices: Choice[],
  analysis: CardAnalysis
): { nodePositions: Map<string, { x: number; y: number }> } {
  const g = new dagre.graphlib.Graph()

  // Calculate max depth for adaptive spacing
  const maxDepth = Math.max(...Array.from(analysis.depth.values()), 0)

  // Configure for left-to-right decision tree layout
  // Use tighter vertical spacing but wider horizontal for readability
  g.setGraph({
    rankdir: 'LR',           // Left to right chronological flow
    align: 'UL',             // Upper-left alignment - keeps branches predictable
    ranksep: RANK_SEPARATION,
    nodesep: NODE_SEPARATION,
    edgesep: EDGE_SEPARATION,
    marginx: 80,
    marginy: 80,
    ranker: 'tight-tree',    // Better for tree structures
  })

  g.setDefaultEdgeLabel(() => ({}))

  // Add all nodes with depth-aware sizing
  storyCards.forEach(card => {
    const depth = analysis.depth.get(card.id) ?? 999
    g.setNode(card.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      rank: depth,
    })
  })

  // Group edges by source for branch ordering
  const edgesBySource = new Map<string, Choice[]>()
  choices
    .filter(choice => choice.targetCardId && storyCards.find(c => c.id === choice.targetCardId))
    .forEach(choice => {
      const existing = edgesBySource.get(choice.storyCardId) || []
      existing.push(choice)
      edgesBySource.set(choice.storyCardId, existing)
    })

  // Add edges sorted by orderIndex for consistent vertical ordering
  // Weight edges to encourage proper branch distribution
  edgesBySource.forEach((choiceList, sourceId) => {
    const sortedChoices = choiceList.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    const branchCount = sortedChoices.length

    sortedChoices.forEach((choice, index) => {
      // Adjust weights to spread branches vertically
      // First choice goes up, middle stays center, last goes down
      let weight = 1
      if (branchCount > 1) {
        // Higher weight = tighter to parent
        weight = branchCount === 2
          ? (index === 0 ? 1.5 : 0.5)
          : (index === 0 ? 2 : index === branchCount - 1 ? 0.5 : 1)
      }

      g.setEdge(sourceId, choice.targetCardId, {
        weight,
        minlen: 1,
        labelpos: 'c',
      })
    })
  })

  // Calculate layout
  dagre.layout(g)

  // Extract positions
  const nodePositions = new Map<string, { x: number; y: number }>()
  storyCards.forEach(card => {
    const nodeWithPosition = g.node(card.id)
    if (nodeWithPosition) {
      nodePositions.set(card.id, {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      })
    }
  })

  return { nodePositions }
}

/**
 * Get edge color based on branch index for visual distinction
 */
function getEdgeColor(branchIndex: number, totalBranches: number): string {
  if (totalBranches === 1) {
    const { hue, sat, light } = EDGE_COLORS.single
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }

  const colors = [EDGE_COLORS.branch1, EDGE_COLORS.branch2, EDGE_COLORS.branch3]
  const color = colors[Math.min(branchIndex, colors.length - 1)]
  return `hsl(${color.hue}, ${color.sat}%, ${color.light}%)`
}

export function useStoryGraphData() {
  const { storyCards, choices, currentCardId, storyStack, characters } = useEditor()

  // Memoized analysis
  const cardAnalysis = useMemo(() =>
    analyzeCards(storyCards, choices, storyStack?.firstCardId ?? null),
    [storyCards, choices, storyStack?.firstCardId]
  )

  // Layout and node/edge generation
  const { nodes, edges } = useMemo(() => {
    if (storyCards.length === 0) {
      return { nodes: [], edges: [] }
    }

    const { nodePositions } = createHierarchicalLayout(storyCards, choices, cardAnalysis)

    // Create React Flow Nodes
    const layoutNodes: Node<StoryNodeData>[] = storyCards.map(card => {
      const position = nodePositions.get(card.id) || { x: 0, y: 0 }
      const isOrphaned = cardAnalysis.orphanedCards.has(card.id)
      const isDeadEnd = cardAnalysis.deadEndCards.has(card.id)
      const isIncomplete = cardAnalysis.incompleteCards.has(card.id)
      const isSelected = card.id === currentCardId
      const isFirst = card.id === storyStack?.firstCardId
      const choiceCount = cardAnalysis.choiceCount.get(card.id) || 0
      const nodeDepth = cardAnalysis.depth.get(card.id) ?? -1

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
        },
      }
    })

    // Group choices by source for edge styling
    const choicesBySource = new Map<string, Choice[]>()
    choices.forEach(choice => {
      if (choice.targetCardId && storyCards.find(c => c.id === choice.targetCardId)) {
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

        // Determine edge styling based on branch count
        // Single paths: subtle, multi-branch: distinct colors
        const strokeWidth = totalChoices > 1 ? 2.5 : 2
        const opacity = totalChoices > 1 ? 1 : 0.8

        layoutEdges.push({
          id: choice.id,
          source: choice.storyCardId,
          target: choice.targetCardId,
          type: 'smoothstep',
          animated: false,
          // Custom path options for better angles
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
          // Show labels only when there are multiple choices (decision points)
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
          // z-index for layering: selected edges on top
          zIndex: choice.storyCardId === currentCardId ? 100 : 0,
        })
      })
    })

    return { nodes: layoutNodes, edges: layoutEdges }
  }, [storyCards, choices, cardAnalysis, currentCardId, storyStack?.firstCardId, characters])

  return { nodes, edges, analysis: cardAnalysis }
}
