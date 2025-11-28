import { StoryCard, Choice } from '@/lib/types'
import { CardAnalysis } from './useGraphLayout'

/**
 * Analyzes story cards for status indicators
 */
export function analyzeCards(
  storyCards: StoryCard[],
  choices: Choice[],
  firstCardId: string | null
): CardAnalysis {
  const hasIncomingLinks = new Set<string>()
  const hasOutgoingChoices = new Set<string>()
  const choiceCount = new Map<string, number>()
  const depth = new Map<string, number>()
  const childrenMap = new Map<string, string[]>()

  // Count choices per card and track connections
  choices.forEach(choice => {
    if (choice.targetCardId) {
      hasIncomingLinks.add(choice.targetCardId)
      // Build children map for collapse functionality
      const existingChildren = childrenMap.get(choice.storyCardId) || []
      if (!existingChildren.includes(choice.targetCardId)) {
        childrenMap.set(choice.storyCardId, [...existingChildren, choice.targetCardId])
      }
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
    childrenMap,
  }
}

/**
 * Gets all descendants of a node (for collapse functionality)
 */
export function getAllDescendants(
  nodeId: string,
  childrenMap: Map<string, string[]>,
  visited: Set<string> = new Set()
): Set<string> {
  const descendants = new Set<string>()
  const children = childrenMap.get(nodeId) || []

  for (const childId of children) {
    if (visited.has(childId)) continue
    visited.add(childId)
    descendants.add(childId)
    // Recursively get descendants of children
    const childDescendants = getAllDescendants(childId, childrenMap, visited)
    childDescendants.forEach(d => descendants.add(d))
  }

  return descendants
}
