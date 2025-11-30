import { StoryCard, Choice } from '@/lib/types'

/**
 * Represents a diff between two graph states
 */
export interface GraphDiff {
  // Nodes
  addedNodes: Set<string>
  removedNodes: Set<string>
  modifiedNodes: Set<string> // Nodes with changed data (not position)

  // Edges
  addedEdges: Set<string>
  removedEdges: Set<string>
  modifiedEdges: Set<string>

  // Subtree roots that need re-layout
  affectedSubtreeRoots: Set<string>

  // Whether a full layout is required
  requiresFullLayout: boolean
}

/**
 * Snapshot of graph state for diffing
 */
export interface GraphSnapshot {
  cardIds: Set<string>
  cardHashes: Map<string, string> // Card ID -> hash of relevant properties
  choiceIds: Set<string>
  choiceHashes: Map<string, string> // Choice ID -> hash of relevant properties
  edgeSignatures: Map<string, string> // sourceId -> "targetId1,targetId2,..."
  childrenMap: Map<string, string[]>
  firstCardId: string | null
}

/**
 * Creates a hash string for a card to detect changes
 */
function hashCard(card: StoryCard): string {
  // We only care about structural properties for layout purposes
  // Content changes don't affect layout
  return `${card.id}|${card.title || ''}|${card.imageUrl ? '1' : '0'}`
}

/**
 * Creates a hash string for a choice to detect changes
 */
function hashChoice(choice: Choice): string {
  return `${choice.id}|${choice.storyCardId}|${choice.targetCardId || ''}|${choice.orderIndex ?? 0}`
}

/**
 * Creates a snapshot of the current graph state
 */
export function createGraphSnapshot(
  cards: StoryCard[],
  choices: Choice[],
  firstCardId: string | null
): GraphSnapshot {
  const cardIds = new Set(cards.map(c => c.id))
  const cardHashes = new Map<string, string>()
  const choiceIds = new Set(choices.map(c => c.id))
  const choiceHashes = new Map<string, string>()
  const edgeSignatures = new Map<string, string>()
  const childrenMap = new Map<string, string[]>()

  // Build card hashes
  cards.forEach(card => {
    cardHashes.set(card.id, hashCard(card))
  })

  // Build choice hashes and edge signatures
  const edgesBySource = new Map<string, string[]>()
  choices.forEach(choice => {
    choiceHashes.set(choice.id, hashChoice(choice))

    if (choice.targetCardId) {
      const existing = edgesBySource.get(choice.storyCardId) || []
      existing.push(choice.targetCardId)
      edgesBySource.set(choice.storyCardId, existing)

      // Build children map
      const children = childrenMap.get(choice.storyCardId) || []
      if (!children.includes(choice.targetCardId)) {
        childrenMap.set(choice.storyCardId, [...children, choice.targetCardId])
      }
    }
  })

  // Create sorted edge signatures for each source
  edgesBySource.forEach((targets, sourceId) => {
    edgeSignatures.set(sourceId, targets.sort().join(','))
  })

  return {
    cardIds,
    cardHashes,
    choiceIds,
    choiceHashes,
    edgeSignatures,
    childrenMap,
    firstCardId,
  }
}

/**
 * Computes the difference between two graph snapshots
 */
export function computeGraphDiff(
  previous: GraphSnapshot | null,
  current: GraphSnapshot
): GraphDiff {
  const addedNodes = new Set<string>()
  const removedNodes = new Set<string>()
  const modifiedNodes = new Set<string>()
  const addedEdges = new Set<string>()
  const removedEdges = new Set<string>()
  const modifiedEdges = new Set<string>()
  const affectedSubtreeRoots = new Set<string>()

  // If no previous snapshot, everything is new - requires full layout
  if (!previous) {
    current.cardIds.forEach(id => addedNodes.add(id))
    current.choiceIds.forEach(id => addedEdges.add(id))
    return {
      addedNodes,
      removedNodes,
      modifiedNodes,
      addedEdges,
      removedEdges,
      modifiedEdges,
      affectedSubtreeRoots,
      requiresFullLayout: true,
    }
  }

  // Detect added and removed nodes
  current.cardIds.forEach(id => {
    if (!previous.cardIds.has(id)) {
      addedNodes.add(id)
    }
  })
  previous.cardIds.forEach(id => {
    if (!current.cardIds.has(id)) {
      removedNodes.add(id)
    }
  })

  // Detect modified nodes (hash changed)
  current.cardIds.forEach(id => {
    if (previous.cardIds.has(id)) {
      const prevHash = previous.cardHashes.get(id)
      const currHash = current.cardHashes.get(id)
      if (prevHash !== currHash) {
        modifiedNodes.add(id)
      }
    }
  })

  // Detect added, removed, and modified edges
  current.choiceIds.forEach(id => {
    if (!previous.choiceIds.has(id)) {
      addedEdges.add(id)
    } else {
      const prevHash = previous.choiceHashes.get(id)
      const currHash = current.choiceHashes.get(id)
      if (prevHash !== currHash) {
        modifiedEdges.add(id)
      }
    }
  })
  previous.choiceIds.forEach(id => {
    if (!current.choiceIds.has(id)) {
      removedEdges.add(id)
    }
  })

  // Determine affected subtree roots based on edge changes
  // A subtree needs re-layout if:
  // 1. A node is added/removed in it
  // 2. An edge is added/removed/modified from it

  // Find nodes whose outgoing edges changed
  current.edgeSignatures.forEach((sig, sourceId) => {
    const prevSig = previous.edgeSignatures.get(sourceId)
    if (prevSig !== sig) {
      affectedSubtreeRoots.add(sourceId)
    }
  })
  previous.edgeSignatures.forEach((_, sourceId) => {
    if (!current.edgeSignatures.has(sourceId) && current.cardIds.has(sourceId)) {
      // This node lost all outgoing edges
      affectedSubtreeRoots.add(sourceId)
    }
  })

  // Add parent nodes of added nodes as affected
  addedNodes.forEach(addedId => {
    // Find parent by looking for edges targeting this node
    current.childrenMap.forEach((children, parentId) => {
      if (children.includes(addedId)) {
        affectedSubtreeRoots.add(parentId)
      }
    })
  })

  // Check if first card changed
  const firstCardChanged = previous.firstCardId !== current.firstCardId

  // Calculate how localized the changes are
  // If changes are concentrated in one subtree, incremental layout is more efficient
  const totalNodes = current.cardIds.size
  const changedNodeCount = addedNodes.size + removedNodes.size
  const changedEdgeCount = addedEdges.size + removedEdges.size + modifiedEdges.size
  const totalChanges = changedNodeCount + changedEdgeCount

  // Determine if full layout is required
  // Full layout needed when:
  // 1. First card changed (root of the tree changed)
  // 2. More than 40% of nodes were structurally affected (increased threshold for better incremental reuse)
  // 3. Multiple disjoint subtrees are affected (more than 3 subtree roots)
  // 4. The root subtree was affected significantly
  const affectedRatio = totalNodes > 0 ? (changedNodeCount + affectedSubtreeRoots.size) / totalNodes : 0
  const hasMultipleDisjointChanges = affectedSubtreeRoots.size > 3
  const rootSubtreeAffected = current.firstCardId !== null && affectedSubtreeRoots.has(current.firstCardId)

  // Be more conservative about requiring full layout - favor incremental when possible
  const requiresFullLayout: boolean =
    firstCardChanged ||
    (totalNodes > 0 && affectedRatio > 0.4) ||
    (hasMultipleDisjointChanges && affectedRatio > 0.25) ||
    (rootSubtreeAffected && changedNodeCount > totalNodes * 0.3)

  return {
    addedNodes,
    removedNodes,
    modifiedNodes,
    addedEdges,
    removedEdges,
    modifiedEdges,
    affectedSubtreeRoots,
    requiresFullLayout,
  }
}

/**
 * Gets all nodes in a subtree starting from the given root
 */
export function getSubtreeNodes(
  rootId: string,
  childrenMap: Map<string, string[]>,
  visited: Set<string> = new Set()
): Set<string> {
  const subtree = new Set<string>()

  if (visited.has(rootId)) {
    return subtree
  }

  visited.add(rootId)
  subtree.add(rootId)

  const children = childrenMap.get(rootId) || []
  for (const childId of children) {
    const childSubtree = getSubtreeNodes(childId, childrenMap, visited)
    childSubtree.forEach(id => subtree.add(id))
  }

  return subtree
}

/**
 * Determines which nodes need layout recalculation based on the diff
 */
export function getNodesNeedingLayout(
  diff: GraphDiff,
  childrenMap: Map<string, string[]>
): Set<string> {
  if (diff.requiresFullLayout) {
    return new Set() // Empty set signals full layout
  }

  const nodesNeedingLayout = new Set<string>()

  // Add all new nodes
  diff.addedNodes.forEach(id => nodesNeedingLayout.add(id))

  // Add all nodes in affected subtrees
  diff.affectedSubtreeRoots.forEach(rootId => {
    const subtree = getSubtreeNodes(rootId, childrenMap)
    subtree.forEach(id => nodesNeedingLayout.add(id))
  })

  return nodesNeedingLayout
}
