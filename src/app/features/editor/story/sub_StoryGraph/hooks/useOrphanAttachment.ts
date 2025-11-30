import { useMemo, useCallback } from 'react'
import { StoryCard, Choice } from '@/lib/types'

export interface ParentSuggestion {
  cardId: string
  cardTitle: string
  score: number
  reasons: string[]
  distance: number // Graph distance from first card
}

/**
 * Calculates content similarity between two texts using word overlap
 */
function calculateContentSimilarity(text1: string | null, text2: string | null): number {
  if (!text1 || !text2) return 0

  const words1 = new Set(
    text1.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  )
  const words2 = new Set(
    text2.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3)
  )

  if (words1.size === 0 || words2.size === 0) return 0

  let overlap = 0
  words1.forEach(word => {
    if (words2.has(word)) overlap++
  })

  // Jaccard similarity
  const union = new Set([...words1, ...words2]).size
  return overlap / union
}

/**
 * Calculates title similarity using normalized Levenshtein-like approach
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  const t1 = title1.toLowerCase().trim()
  const t2 = title2.toLowerCase().trim()

  if (t1 === t2) return 1
  if (!t1 || !t2) return 0

  // Check for common word patterns
  const words1 = t1.split(/\s+/)
  const words2 = t2.split(/\s+/)

  let matchingWords = 0
  words1.forEach(w1 => {
    if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) {
      matchingWords++
    }
  })

  return matchingWords / Math.max(words1.length, words2.length)
}

/**
 * Hook to find and score potential parent nodes for orphaned cards
 */
export function useOrphanAttachment(
  storyCards: StoryCard[],
  choices: Choice[],
  firstCardId: string | null
) {
  // Calculate depth/distance from first card for all cards
  const cardDepths = useMemo(() => {
    const depths = new Map<string, number>()

    if (!firstCardId) return depths

    const queue: Array<{ id: string; depth: number }> = [{ id: firstCardId, depth: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      depths.set(id, depth)

      // Find all choices from this card
      choices
        .filter(c => c.storyCardId === id && c.targetCardId)
        .forEach(c => {
          if (!visited.has(c.targetCardId)) {
            queue.push({ id: c.targetCardId, depth: depth + 1 })
          }
        })
    }

    return depths
  }, [choices, firstCardId])

  // Get cards that have outgoing choices (potential parents)
  const cardsWithOutgoingChoices = useMemo(() => {
    const hasOutgoing = new Set<string>()
    choices.forEach(choice => {
      if (choice.targetCardId) {
        hasOutgoing.add(choice.storyCardId)
      }
    })
    return hasOutgoing
  }, [choices])

  // Get cards that already link to a specific target
  const getExistingTargets = useCallback((cardId: string): Set<string> => {
    const targets = new Set<string>()
    choices.forEach(choice => {
      if (choice.storyCardId === cardId && choice.targetCardId) {
        targets.add(choice.targetCardId)
      }
    })
    return targets
  }, [choices])

  /**
   * Find potential parent nodes for an orphaned card
   */
  const getSuggestedParents = useCallback((orphanCardId: string): ParentSuggestion[] => {
    const orphanCard = storyCards.find(c => c.id === orphanCardId)
    if (!orphanCard) return []

    const suggestions: ParentSuggestion[] = []

    storyCards.forEach(card => {
      // Skip the orphan itself
      if (card.id === orphanCardId) return

      // Skip cards that already link to this orphan
      const existingTargets = getExistingTargets(card.id)
      if (existingTargets.has(orphanCardId)) return

      const reasons: string[] = []
      let score = 0

      // Factor 1: Card is reachable from first card (connected to the main graph)
      const cardDepth = cardDepths.get(card.id)
      if (cardDepth !== undefined) {
        score += 30 // Base score for being connected
        reasons.push('Connected to story')

        // Prefer cards at moderate depth (not too shallow, not too deep)
        if (cardDepth >= 1 && cardDepth <= 3) {
          score += 10
        }
      } else {
        // Card is also orphaned, less ideal as parent
        score -= 20
      }

      // Factor 2: Content similarity
      const contentSim = calculateContentSimilarity(card.content, orphanCard.content)
      if (contentSim > 0.1) {
        const contentScore = Math.round(contentSim * 25)
        score += contentScore
        if (contentSim > 0.2) {
          reasons.push('Similar content')
        }
      }

      // Factor 3: Title similarity
      const titleSim = calculateTitleSimilarity(card.title || '', orphanCard.title || '')
      if (titleSim > 0.2) {
        const titleScore = Math.round(titleSim * 15)
        score += titleScore
        reasons.push('Related title')
      }

      // Factor 4: Cards with choices (branching points) are better parents
      if (cardsWithOutgoingChoices.has(card.id)) {
        const choiceCount = choices.filter(c => c.storyCardId === card.id).length
        if (choiceCount === 1) {
          score += 15 // Single choice - good candidate for adding another
          reasons.push('Has one choice')
        } else if (choiceCount === 2) {
          score += 5 // Two choices - could still add one more
        }
        // 3+ choices - no bonus (might be too crowded)
      } else {
        // Dead-end cards are excellent candidates for adding choices
        if (cardDepths.has(card.id)) {
          score += 20
          reasons.push('Dead end (needs choices)')
        }
      }

      // Factor 5: Order index proximity (cards created around the same time)
      const orderDiff = Math.abs(card.orderIndex - orphanCard.orderIndex)
      if (orderDiff <= 2) {
        score += 10
        reasons.push('Created nearby')
      } else if (orderDiff <= 5) {
        score += 5
      }

      // Factor 6: First card bonus (connecting orphan directly to start)
      if (card.id === firstCardId) {
        score += 5
        reasons.push('Story start')
      }

      // Only include cards with positive scores
      if (score > 0 && reasons.length > 0) {
        suggestions.push({
          cardId: card.id,
          cardTitle: card.title || 'Untitled',
          score,
          reasons,
          distance: cardDepth ?? -1,
        })
      }
    })

    // Sort by score descending, limit to top 5
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [storyCards, choices, cardDepths, cardsWithOutgoingChoices, getExistingTargets, firstCardId])

  return {
    getSuggestedParents,
    cardDepths,
  }
}
