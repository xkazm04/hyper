import { useMemo, useCallback } from 'react'
import { Choice, StoryCard } from '@/lib/types'

export interface BranchInfo {
  /** The choice that leads to this branch */
  choice: Choice
  /** The target card for this branch */
  targetCard: StoryCard | null
}

export interface PathNode {
  /** The story card at this position */
  card: StoryCard
  /** Index in the path (0 = selected node) */
  pathIndex: number
  /** The choice that led to this card (null for the first card in path) */
  incomingChoice: Choice | null
}

export interface BranchPathResult {
  /** The currently selected node for branch navigation */
  selectedNodeId: string | null
  /** Available branches (outgoing choices) from the selected node */
  availableBranches: BranchInfo[]
  /** The currently selected branch index (0-based) */
  selectedBranchIndex: number
  /** The linear path following the selected branch */
  linearPath: PathNode[]
  /** Select a node to view its branches */
  selectNode: (nodeId: string | null) => void
  /** Select which branch to follow (0-based index) */
  selectBranch: (branchIndex: number) => void
  /** Check if the hook has a valid selection */
  hasSelection: boolean
}

/**
 * useBranchPath - Hook for navigating and previewing story branches
 *
 * Given a selected node, this hook:
 * 1. Finds all outgoing branches (choices) from that node
 * 2. Allows selecting one branch to follow
 * 3. Computes the linear path from the selected node through the chosen branch
 *
 * The linear path follows the first choice at each subsequent node (DFS first-child).
 *
 * @param storyCards All story cards in the story
 * @param choices All choices in the story
 * @param selectedNodeId The currently selected node ID for branch navigation
 * @param selectedBranchIndex The currently selected branch index
 * @param onSelectNode Callback when a node is selected
 * @param onSelectBranch Callback when a branch is selected
 */
export function useBranchPath(
  storyCards: StoryCard[],
  choices: Choice[],
  selectedNodeId: string | null,
  selectedBranchIndex: number,
  onSelectNode: (nodeId: string | null) => void,
  onSelectBranch: (branchIndex: number) => void
): BranchPathResult {
  // Create a map of cards by ID for quick lookup
  const cardMap = useMemo(() => {
    const map = new Map<string, StoryCard>()
    for (const card of storyCards) {
      map.set(card.id, card)
    }
    return map
  }, [storyCards])

  // Create a map of choices by source card ID (sorted by orderIndex)
  const choicesByCard = useMemo(() => {
    const map = new Map<string, Choice[]>()
    for (const choice of choices) {
      const existing = map.get(choice.storyCardId) || []
      existing.push(choice)
      map.set(choice.storyCardId, existing)
    }
    // Sort each list by orderIndex
    for (const [, cardChoices] of map) {
      cardChoices.sort((a, b) => a.orderIndex - b.orderIndex)
    }
    return map
  }, [choices])

  // Get available branches from the selected node
  const availableBranches = useMemo((): BranchInfo[] => {
    if (!selectedNodeId) return []

    const nodeChoices = choicesByCard.get(selectedNodeId) || []
    return nodeChoices.map(choice => ({
      choice,
      targetCard: choice.targetCardId ? cardMap.get(choice.targetCardId) || null : null
    }))
  }, [selectedNodeId, choicesByCard, cardMap])

  // Compute the linear path from the selected node through the chosen branch
  const linearPath = useMemo((): PathNode[] => {
    if (!selectedNodeId) return []

    const startCard = cardMap.get(selectedNodeId)
    if (!startCard) return []

    const path: PathNode[] = []
    const visited = new Set<string>()

    // Start with the selected node
    path.push({
      card: startCard,
      pathIndex: 0,
      incomingChoice: null
    })
    visited.add(selectedNodeId)

    // If there are branches and one is selected, follow that branch
    if (availableBranches.length > 0 && selectedBranchIndex < availableBranches.length) {
      const selectedBranch = availableBranches[selectedBranchIndex]
      let currentChoice: Choice | null = selectedBranch.choice

      while (currentChoice && currentChoice.targetCardId) {
        const targetId = currentChoice.targetCardId

        // Avoid cycles
        if (visited.has(targetId)) break
        visited.add(targetId)

        const targetCard = cardMap.get(targetId)
        if (!targetCard) break

        path.push({
          card: targetCard,
          pathIndex: path.length,
          incomingChoice: currentChoice
        })

        // Follow the first choice from the target card (if any)
        const nextChoices = choicesByCard.get(targetId)
        currentChoice = nextChoices && nextChoices.length > 0 ? nextChoices[0] : null
      }
    }

    return path
  }, [selectedNodeId, selectedBranchIndex, availableBranches, cardMap, choicesByCard])

  const selectNode = useCallback((nodeId: string | null) => {
    onSelectNode(nodeId)
    // Reset branch selection when node changes
    if (nodeId !== selectedNodeId) {
      onSelectBranch(0)
    }
  }, [selectedNodeId, onSelectNode, onSelectBranch])

  const selectBranch = useCallback((branchIndex: number) => {
    onSelectBranch(Math.max(0, Math.min(branchIndex, availableBranches.length - 1)))
  }, [availableBranches.length, onSelectBranch])

  return {
    selectedNodeId,
    availableBranches,
    selectedBranchIndex,
    linearPath,
    selectNode,
    selectBranch,
    hasSelection: selectedNodeId !== null && linearPath.length > 0
  }
}
