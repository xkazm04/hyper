'use client'

import { useMemo } from 'react'
import type { StoryCard, Choice } from '@/lib/types'

interface PathCard {
  card: StoryCard
  isCurrentCard: boolean
  isFutureCard: boolean
  isPastCard: boolean
  depth: number
}

interface UseStoryPathOptions {
  storyCards: StoryCard[]
  choices: Choice[]
  currentCardId: string | null
  firstCardId: string | null
  maxDepth?: number // Maximum number of cards to show ahead
}

/**
 * Calculates a linear path through the story from start to current card,
 * plus a preview of upcoming cards along the most likely path.
 */
export function useStoryPath({
  storyCards,
  choices,
  currentCardId,
  firstCardId,
  maxDepth = 8,
}: UseStoryPathOptions): PathCard[] {
  return useMemo(() => {
    if (!storyCards.length) return []

    // Build a map for quick lookups
    const cardMap = new Map<string, StoryCard>()
    storyCards.forEach((card) => cardMap.set(card.id, card))

    // Build adjacency list: cardId -> list of target card IDs (ordered by orderIndex)
    // First collect all choices per card with their order
    const choicesByCard = new Map<string, { targetId: string; order: number }[]>()
    choices.forEach((choice) => {
      if (choice.targetCardId) {
        const existing = choicesByCard.get(choice.storyCardId) || []
        existing.push({ targetId: choice.targetCardId, order: choice.orderIndex })
        choicesByCard.set(choice.storyCardId, existing)
      }
    })

    // Now build the adjacency list with sorted target IDs
    const adjacencyList = new Map<string, string[]>()
    choicesByCard.forEach((choiceList, cardId) => {
      choiceList.sort((a, b) => a.order - b.order)
      adjacencyList.set(cardId, choiceList.map((c) => c.targetId))
    })

    // Find the first card
    const startCardId = firstCardId || storyCards[0]?.id
    if (!startCardId) return []

    // Build path from start to current card using BFS
    const pathToCurrentMap = new Map<string, string | null>() // Maps cardId to its predecessor
    const queue: string[] = [startCardId]
    pathToCurrentMap.set(startCardId, null)

    while (queue.length > 0) {
      const currentId = queue.shift()!
      if (currentId === currentCardId) break

      const neighbors = adjacencyList.get(currentId) || []
      for (const neighborId of neighbors) {
        if (!pathToCurrentMap.has(neighborId)) {
          pathToCurrentMap.set(neighborId, currentId)
          queue.push(neighborId)
        }
      }
    }

    // Reconstruct path from start to current
    const pastPath: string[] = []
    if (currentCardId && pathToCurrentMap.has(currentCardId)) {
      let nodeId: string | null = currentCardId
      while (nodeId !== null) {
        pastPath.unshift(nodeId)
        nodeId = pathToCurrentMap.get(nodeId) ?? null
      }
    } else if (!currentCardId) {
      // If no current card, just start from the first card
      pastPath.push(startCardId)
    } else {
      // Current card not reachable from start, just show current card path
      pastPath.push(currentCardId)
    }

    // Build future path by following the first choice from each card
    const futurePath: string[] = []
    const visitedFuture = new Set<string>(pastPath)
    let currentFuture = currentCardId || startCardId

    for (let i = 0; i < maxDepth; i++) {
      const neighbors = adjacencyList.get(currentFuture) || []
      const nextCardId = neighbors.find((id) => !visitedFuture.has(id))
      if (!nextCardId) break

      futurePath.push(nextCardId)
      visitedFuture.add(nextCardId)
      currentFuture = nextCardId
    }

    // Combine paths and create PathCard objects
    const result: PathCard[] = []

    // Past cards (excluding current)
    pastPath.slice(0, -1).forEach((cardId, index) => {
      const card = cardMap.get(cardId)
      if (card) {
        result.push({
          card,
          isCurrentCard: false,
          isFutureCard: false,
          isPastCard: true,
          depth: index,
        })
      }
    })

    // Current card
    const currentCard = cardMap.get(pastPath[pastPath.length - 1] || '')
    if (currentCard) {
      result.push({
        card: currentCard,
        isCurrentCard: true,
        isFutureCard: false,
        isPastCard: false,
        depth: pastPath.length - 1,
      })
    }

    // Future cards
    futurePath.forEach((cardId, index) => {
      const card = cardMap.get(cardId)
      if (card) {
        result.push({
          card,
          isCurrentCard: false,
          isFutureCard: true,
          isPastCard: false,
          depth: pastPath.length + index,
        })
      }
    })

    return result
  }, [storyCards, choices, currentCardId, firstCardId, maxDepth])
}

export type { PathCard }
