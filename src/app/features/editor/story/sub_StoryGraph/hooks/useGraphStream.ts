/**
 * useGraphStream - React hooks for subscribing to GraphStreamHub
 *
 * These hooks provide reactive subscriptions to graph mutation events,
 * with proper cleanup and memoization for React components.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Observable } from 'rxjs'
import {
  getGraphStreamHub,
  type GraphMutationEvent,
  type GraphStateSnapshot,
  type GraphMutationType,
} from '../lib/graphStreamHub'
import type { StoryCard, Choice, Character } from '@/lib/types'

// Re-export types for convenience
export type { GraphMutationEvent, GraphStateSnapshot, GraphMutationType }

/**
 * Hook to subscribe to the full mutation stream
 * Returns the latest mutation event and a count for change detection
 */
export function useGraphMutations() {
  const [lastMutation, setLastMutation] = useState<GraphMutationEvent | null>(null)
  const [mutationCount, setMutationCount] = useState(0)

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.mutations$.subscribe(event => {
      setLastMutation(event)
      setMutationCount(c => c + 1)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { lastMutation, mutationCount }
}

/**
 * Hook to subscribe to throttled mutations (1 event per 100ms)
 * Useful for UI components that need updates but can't handle rapid changes
 */
export function useThrottledMutations() {
  const [lastMutation, setLastMutation] = useState<GraphMutationEvent | null>(null)
  const [mutationCount, setMutationCount] = useState(0)

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.throttledMutations$.subscribe(event => {
      setLastMutation(event)
      setMutationCount(c => c + 1)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { lastMutation, mutationCount }
}

/**
 * Hook to subscribe to debounced mutations (150ms silence before emit)
 * Useful for expensive operations like layout recalculation
 */
export function useDebouncedMutations() {
  const [lastMutation, setLastMutation] = useState<GraphMutationEvent | null>(null)
  const [mutationCount, setMutationCount] = useState(0)

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.debouncedMutations$.subscribe(event => {
      setLastMutation(event)
      setMutationCount(c => c + 1)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { lastMutation, mutationCount }
}

/**
 * Hook to subscribe to node-specific events only
 */
export function useNodeEvents() {
  const [lastEvent, setLastEvent] = useState<GraphMutationEvent | null>(null)
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.nodeEvents$.subscribe(event => {
      setLastEvent(event)
      setEventCount(c => c + 1)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { lastEvent, eventCount }
}

/**
 * Hook to subscribe to edge-specific events only
 */
export function useEdgeEvents() {
  const [lastEvent, setLastEvent] = useState<GraphMutationEvent | null>(null)
  const [eventCount, setEventCount] = useState(0)

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.edgeEvents$.subscribe(event => {
      setLastEvent(event)
      setEventCount(c => c + 1)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { lastEvent, eventCount }
}

/**
 * Hook to subscribe to selection change events only
 */
export function useSelectionEvents() {
  const hub = useMemo(() => getGraphStreamHub(), [])
  const [currentCardId, setCurrentCardId] = useState<string | null>(
    () => hub.getCurrentState().currentCardId
  )

  useEffect(() => {
    const subscription = hub.selectionEvents$.subscribe(event => {
      setCurrentCardId(event.payload.cardId)
    })

    return () => subscription.unsubscribe()
  }, [hub])

  return currentCardId
}

/**
 * Hook to subscribe to structural events (add/delete/reset)
 * Useful for components that need to re-layout on structural changes
 */
export function useStructuralEvents() {
  const [lastEvent, setLastEvent] = useState<GraphMutationEvent | null>(null)
  const [structureVersion, setStructureVersion] = useState(0)

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.structuralEvents$.subscribe(event => {
      setLastEvent(event)
      setStructureVersion(v => v + 1)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { lastEvent, structureVersion }
}

/**
 * Hook to get the current graph state snapshot
 * Updates whenever state changes
 */
export function useGraphState() {
  const [state, setState] = useState<GraphStateSnapshot>(() => {
    const hub = getGraphStreamHub()
    return hub.getCurrentState()
  })

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.state$.subscribe(setState)
    return () => subscription.unsubscribe()
  }, [])

  return state
}

/**
 * Hook to watch a specific card by ID
 * Returns the current card data from the stream state
 */
export function useWatchCard(cardId: string | null): StoryCard | null {
  const state = useGraphState()

  if (!cardId) return null
  return state.cards.get(cardId) ?? null
}

/**
 * Hook to watch a specific choice by ID
 * Returns the current choice data from the stream state
 */
export function useWatchChoice(choiceId: string | null): Choice | null {
  const state = useGraphState()

  if (!choiceId) return null
  return state.choices.get(choiceId) ?? null
}

/**
 * Hook to subscribe to specific mutation types
 */
export function useMutationTypes(...types: GraphMutationType[]) {
  const [lastEvent, setLastEvent] = useState<GraphMutationEvent | null>(null)
  const [eventCount, setEventCount] = useState(0)

  // Memoize types array to prevent unnecessary effect runs
  const typeKey = types.join(',')

  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.onMutationTypes(...types).subscribe(event => {
      setLastEvent(event)
      setEventCount(c => c + 1)
    })

    return () => subscription.unsubscribe()
  }, [typeKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return { lastEvent, eventCount }
}

/**
 * Hook to get mutation emitter functions
 * Returns stable callback references for emitting mutations
 */
export function useGraphMutationEmitters() {
  const hub = useMemo(() => getGraphStreamHub(), [])

  const emitNodeAdd = useCallback(
    (card: StoryCard) => hub.emitNodeAdd(card),
    [hub]
  )

  const emitNodeUpdate = useCallback(
    (cardId: string, updates: Partial<StoryCard>) => hub.emitNodeUpdate(cardId, updates),
    [hub]
  )

  const emitNodeDelete = useCallback(
    (cardId: string) => hub.emitNodeDelete(cardId),
    [hub]
  )

  const emitNodeBatchAdd = useCallback(
    (cards: StoryCard[]) => hub.emitNodeBatchAdd(cards),
    [hub]
  )

  const emitEdgeAdd = useCallback(
    (choice: Choice) => hub.emitEdgeAdd(choice),
    [hub]
  )

  const emitEdgeUpdate = useCallback(
    (choiceId: string, updates: Partial<Choice>) => hub.emitEdgeUpdate(choiceId, updates),
    [hub]
  )

  const emitEdgeDelete = useCallback(
    (choiceId: string) => hub.emitEdgeDelete(choiceId),
    [hub]
  )

  const emitEdgeBatchAdd = useCallback(
    (choices: Choice[]) => hub.emitEdgeBatchAdd(choices),
    [hub]
  )

  const emitSelectionChange = useCallback(
    (cardId: string | null) => hub.emitSelectionChange(cardId),
    [hub]
  )

  const emitCollapseToggle = useCallback(
    (nodeId: string, collapsed: boolean) => hub.emitCollapseToggle(nodeId, collapsed),
    [hub]
  )

  const emitGraphSync = useCallback(
    (
      cards: StoryCard[],
      choices: Choice[],
      characters: Character[],
      firstCardId: string | null,
      currentCardId: string | null,
      collapsedNodes: Set<string>
    ) => hub.emitGraphSync(cards, choices, characters, firstCardId, currentCardId, collapsedNodes),
    [hub]
  )

  return {
    emitNodeAdd,
    emitNodeUpdate,
    emitNodeDelete,
    emitNodeBatchAdd,
    emitEdgeAdd,
    emitEdgeUpdate,
    emitEdgeDelete,
    emitEdgeBatchAdd,
    emitSelectionChange,
    emitCollapseToggle,
    emitGraphSync,
  }
}

/**
 * Hook for custom observable subscription with cleanup
 */
export function useObservable<T>(
  observable$: Observable<T>,
  initialValue: T
): T {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    const subscription = observable$.subscribe(setValue)
    return () => subscription.unsubscribe()
  }, [observable$])

  return value
}

/**
 * Hook that subscribes to all mutations and calls the provided handler
 * Useful for reacting to mutations
 *
 * @param onMutation - Callback function to handle mutation events
 */
export function useOnMutation(
  onMutation: (event: GraphMutationEvent) => void
) {
  useEffect(() => {
    const hub = getGraphStreamHub()
    const subscription = hub.mutations$.subscribe(onMutation)
    return () => subscription.unsubscribe()
  }, [onMutation])
}

/**
 * Hook that triggers a re-render on any structural change
 * Returns a version number that increments on each structural change
 */
export function useGraphVersion() {
  const { structureVersion } = useStructuralEvents()
  return structureVersion
}
