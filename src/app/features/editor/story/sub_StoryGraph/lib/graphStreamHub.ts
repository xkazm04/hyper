/**
 * GraphStreamHub - Central RxJS Subject for all graph mutations
 *
 * This module provides a reactive stream that emits all graph mutations
 * (node/edge add, delete, update). All UI components (StoryGraph, AICompanion,
 * runtime preview) can subscribe to this stream, eliminating repeated context
 * reads and manual re-renders.
 *
 * Features:
 * - Single source of truth for graph mutations
 * - Throttle/debounce support for heavy changes
 * - Type-safe mutation events
 * - Decoupled components for future features like live collaboration
 */

import { Subject, BehaviorSubject, Observable } from 'rxjs'
import {
  throttleTime,
  debounceTime,
  filter,
  map,
  distinctUntilChanged,
  shareReplay,
  scan,
} from 'rxjs/operators'
import type { StoryCard, Choice, Character } from '@/lib/types'

// ============================================================================
// Mutation Event Types
// ============================================================================

export type GraphMutationType =
  | 'node:add'
  | 'node:update'
  | 'node:delete'
  | 'node:batch-add'
  | 'node:batch-update'
  | 'node:batch-delete'
  | 'edge:add'
  | 'edge:update'
  | 'edge:delete'
  | 'edge:batch-add'
  | 'edge:batch-update'
  | 'edge:batch-delete'
  | 'graph:reset'
  | 'graph:sync'
  | 'selection:change'
  | 'collapse:toggle'

export interface NodeAddEvent {
  type: 'node:add'
  payload: StoryCard
  timestamp: number
}

export interface NodeUpdateEvent {
  type: 'node:update'
  payload: {
    cardId: string
    updates: Partial<StoryCard>
  }
  timestamp: number
}

export interface NodeDeleteEvent {
  type: 'node:delete'
  payload: { cardId: string }
  timestamp: number
}

export interface NodeBatchAddEvent {
  type: 'node:batch-add'
  payload: StoryCard[]
  timestamp: number
}

export interface NodeBatchUpdateEvent {
  type: 'node:batch-update'
  payload: Array<{ cardId: string; updates: Partial<StoryCard> }>
  timestamp: number
}

export interface NodeBatchDeleteEvent {
  type: 'node:batch-delete'
  payload: { cardIds: string[] }
  timestamp: number
}

export interface EdgeAddEvent {
  type: 'edge:add'
  payload: Choice
  timestamp: number
}

export interface EdgeUpdateEvent {
  type: 'edge:update'
  payload: {
    choiceId: string
    updates: Partial<Choice>
  }
  timestamp: number
}

export interface EdgeDeleteEvent {
  type: 'edge:delete'
  payload: { choiceId: string }
  timestamp: number
}

export interface EdgeBatchAddEvent {
  type: 'edge:batch-add'
  payload: Choice[]
  timestamp: number
}

export interface EdgeBatchUpdateEvent {
  type: 'edge:batch-update'
  payload: Array<{ choiceId: string; updates: Partial<Choice> }>
  timestamp: number
}

export interface EdgeBatchDeleteEvent {
  type: 'edge:batch-delete'
  payload: { choiceIds: string[] }
  timestamp: number
}

export interface GraphResetEvent {
  type: 'graph:reset'
  payload: {
    cards: StoryCard[]
    choices: Choice[]
    characters: Character[]
    firstCardId: string | null
    currentCardId: string | null
  }
  timestamp: number
}

export interface GraphSyncEvent {
  type: 'graph:sync'
  payload: {
    cards: StoryCard[]
    choices: Choice[]
    characters: Character[]
    firstCardId: string | null
    currentCardId: string | null
    collapsedNodes: Set<string>
  }
  timestamp: number
}

export interface SelectionChangeEvent {
  type: 'selection:change'
  payload: { cardId: string | null }
  timestamp: number
}

export interface CollapseToggleEvent {
  type: 'collapse:toggle'
  payload: { nodeId: string; collapsed: boolean }
  timestamp: number
}

export type GraphMutationEvent =
  | NodeAddEvent
  | NodeUpdateEvent
  | NodeDeleteEvent
  | NodeBatchAddEvent
  | NodeBatchUpdateEvent
  | NodeBatchDeleteEvent
  | EdgeAddEvent
  | EdgeUpdateEvent
  | EdgeDeleteEvent
  | EdgeBatchAddEvent
  | EdgeBatchUpdateEvent
  | EdgeBatchDeleteEvent
  | GraphResetEvent
  | GraphSyncEvent
  | SelectionChangeEvent
  | CollapseToggleEvent

// ============================================================================
// Graph State Snapshot
// ============================================================================

export interface GraphStateSnapshot {
  cards: Map<string, StoryCard>
  choices: Map<string, Choice>
  characters: Map<string, Character>
  firstCardId: string | null
  currentCardId: string | null
  collapsedNodes: Set<string>
  lastMutation: GraphMutationEvent | null
  mutationCount: number
}

const createInitialSnapshot = (): GraphStateSnapshot => ({
  cards: new Map(),
  choices: new Map(),
  characters: new Map(),
  firstCardId: null,
  currentCardId: null,
  collapsedNodes: new Set(),
  lastMutation: null,
  mutationCount: 0,
})

// ============================================================================
// State Reducer
// ============================================================================

function reduceGraphState(
  state: GraphStateSnapshot,
  event: GraphMutationEvent
): GraphStateSnapshot {
  const newState = { ...state, lastMutation: event, mutationCount: state.mutationCount + 1 }

  switch (event.type) {
    case 'node:add': {
      const cards = new Map(state.cards)
      cards.set(event.payload.id, event.payload)
      return { ...newState, cards }
    }

    case 'node:update': {
      const cards = new Map(state.cards)
      const existing = cards.get(event.payload.cardId)
      if (existing) {
        cards.set(event.payload.cardId, { ...existing, ...event.payload.updates })
      }
      return { ...newState, cards }
    }

    case 'node:delete': {
      const cards = new Map(state.cards)
      cards.delete(event.payload.cardId)
      return { ...newState, cards }
    }

    case 'node:batch-add': {
      const cards = new Map(state.cards)
      event.payload.forEach(card => cards.set(card.id, card))
      return { ...newState, cards }
    }

    case 'node:batch-update': {
      const cards = new Map(state.cards)
      event.payload.forEach(({ cardId, updates }) => {
        const existing = cards.get(cardId)
        if (existing) {
          cards.set(cardId, { ...existing, ...updates })
        }
      })
      return { ...newState, cards }
    }

    case 'node:batch-delete': {
      const cards = new Map(state.cards)
      event.payload.cardIds.forEach(id => cards.delete(id))
      return { ...newState, cards }
    }

    case 'edge:add': {
      const choices = new Map(state.choices)
      choices.set(event.payload.id, event.payload)
      return { ...newState, choices }
    }

    case 'edge:update': {
      const choices = new Map(state.choices)
      const existing = choices.get(event.payload.choiceId)
      if (existing) {
        choices.set(event.payload.choiceId, { ...existing, ...event.payload.updates })
      }
      return { ...newState, choices }
    }

    case 'edge:delete': {
      const choices = new Map(state.choices)
      choices.delete(event.payload.choiceId)
      return { ...newState, choices }
    }

    case 'edge:batch-add': {
      const choices = new Map(state.choices)
      event.payload.forEach(choice => choices.set(choice.id, choice))
      return { ...newState, choices }
    }

    case 'edge:batch-update': {
      const choices = new Map(state.choices)
      event.payload.forEach(({ choiceId, updates }) => {
        const existing = choices.get(choiceId)
        if (existing) {
          choices.set(choiceId, { ...existing, ...updates })
        }
      })
      return { ...newState, choices }
    }

    case 'edge:batch-delete': {
      const choices = new Map(state.choices)
      event.payload.choiceIds.forEach(id => choices.delete(id))
      return { ...newState, choices }
    }

    case 'graph:reset':
    case 'graph:sync': {
      const cards = new Map<string, StoryCard>()
      const choices = new Map<string, Choice>()
      const characters = new Map<string, Character>()

      event.payload.cards.forEach(card => cards.set(card.id, card))
      event.payload.choices.forEach(choice => choices.set(choice.id, choice))
      if ('characters' in event.payload) {
        event.payload.characters.forEach(char => characters.set(char.id, char))
      }

      return {
        ...newState,
        cards,
        choices,
        characters,
        firstCardId: event.payload.firstCardId,
        currentCardId: event.payload.currentCardId,
        collapsedNodes: 'collapsedNodes' in event.payload ? event.payload.collapsedNodes : new Set(),
      }
    }

    case 'selection:change': {
      return { ...newState, currentCardId: event.payload.cardId }
    }

    case 'collapse:toggle': {
      const collapsedNodes = new Set(state.collapsedNodes)
      if (event.payload.collapsed) {
        collapsedNodes.add(event.payload.nodeId)
      } else {
        collapsedNodes.delete(event.payload.nodeId)
      }
      return { ...newState, collapsedNodes }
    }

    default:
      return newState
  }
}

// ============================================================================
// GraphStreamHub Singleton
// ============================================================================

class GraphStreamHub {
  private static instance: GraphStreamHub | null = null

  // Core mutation subject - emits all raw mutation events
  private readonly mutationSubject = new Subject<GraphMutationEvent>()

  // State subject - holds the current computed state
  private readonly stateSubject: BehaviorSubject<GraphStateSnapshot>

  // Shared observable streams
  public readonly mutations$: Observable<GraphMutationEvent>
  public readonly state$: Observable<GraphStateSnapshot>

  // Throttled streams for performance-sensitive consumers
  public readonly throttledMutations$: Observable<GraphMutationEvent>
  public readonly debouncedMutations$: Observable<GraphMutationEvent>

  // Filtered streams by mutation category
  public readonly nodeEvents$: Observable<GraphMutationEvent>
  public readonly edgeEvents$: Observable<GraphMutationEvent>
  public readonly selectionEvents$: Observable<SelectionChangeEvent>
  public readonly structuralEvents$: Observable<GraphMutationEvent>

  private constructor() {
    this.stateSubject = new BehaviorSubject<GraphStateSnapshot>(createInitialSnapshot())

    // Main mutations stream with replay for late subscribers
    this.mutations$ = this.mutationSubject.asObservable().pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    )

    // Compute state from mutations
    this.mutationSubject.pipe(
      scan(reduceGraphState, createInitialSnapshot())
    ).subscribe(state => {
      this.stateSubject.next(state)
    })

    this.state$ = this.stateSubject.asObservable().pipe(
      distinctUntilChanged((prev, curr) => prev.mutationCount === curr.mutationCount),
      shareReplay({ bufferSize: 1, refCount: true })
    )

    // Throttled stream - limits to 1 event per 100ms for heavy UI updates
    this.throttledMutations$ = this.mutations$.pipe(
      throttleTime(100, undefined, { leading: true, trailing: true }),
      shareReplay({ bufferSize: 1, refCount: true })
    )

    // Debounced stream - waits 150ms of silence before emitting
    this.debouncedMutations$ = this.mutations$.pipe(
      debounceTime(150),
      shareReplay({ bufferSize: 1, refCount: true })
    )

    // Node-specific events
    this.nodeEvents$ = this.mutations$.pipe(
      filter(e => e.type.startsWith('node:')),
      shareReplay({ bufferSize: 1, refCount: true })
    )

    // Edge-specific events
    this.edgeEvents$ = this.mutations$.pipe(
      filter(e => e.type.startsWith('edge:')),
      shareReplay({ bufferSize: 1, refCount: true })
    )

    // Selection events
    this.selectionEvents$ = this.mutations$.pipe(
      filter((e): e is SelectionChangeEvent => e.type === 'selection:change'),
      shareReplay({ bufferSize: 1, refCount: true })
    )

    // Structural events (add/delete/reset) that require layout recalculation
    this.structuralEvents$ = this.mutations$.pipe(
      filter(e =>
        e.type.includes('add') ||
        e.type.includes('delete') ||
        e.type === 'graph:reset' ||
        e.type === 'graph:sync' ||
        e.type === 'collapse:toggle'
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    )
  }

  static getInstance(): GraphStreamHub {
    if (!GraphStreamHub.instance) {
      GraphStreamHub.instance = new GraphStreamHub()
    }
    return GraphStreamHub.instance
  }

  // ============================================================================
  // Mutation Emitters
  // ============================================================================

  emitNodeAdd(card: StoryCard): void {
    this.mutationSubject.next({
      type: 'node:add',
      payload: card,
      timestamp: Date.now(),
    })
  }

  emitNodeUpdate(cardId: string, updates: Partial<StoryCard>): void {
    this.mutationSubject.next({
      type: 'node:update',
      payload: { cardId, updates },
      timestamp: Date.now(),
    })
  }

  emitNodeDelete(cardId: string): void {
    this.mutationSubject.next({
      type: 'node:delete',
      payload: { cardId },
      timestamp: Date.now(),
    })
  }

  emitNodeBatchAdd(cards: StoryCard[]): void {
    this.mutationSubject.next({
      type: 'node:batch-add',
      payload: cards,
      timestamp: Date.now(),
    })
  }

  emitNodeBatchUpdate(updates: Array<{ cardId: string; updates: Partial<StoryCard> }>): void {
    this.mutationSubject.next({
      type: 'node:batch-update',
      payload: updates,
      timestamp: Date.now(),
    })
  }

  emitNodeBatchDelete(cardIds: string[]): void {
    this.mutationSubject.next({
      type: 'node:batch-delete',
      payload: { cardIds },
      timestamp: Date.now(),
    })
  }

  emitEdgeAdd(choice: Choice): void {
    this.mutationSubject.next({
      type: 'edge:add',
      payload: choice,
      timestamp: Date.now(),
    })
  }

  emitEdgeUpdate(choiceId: string, updates: Partial<Choice>): void {
    this.mutationSubject.next({
      type: 'edge:update',
      payload: { choiceId, updates },
      timestamp: Date.now(),
    })
  }

  emitEdgeDelete(choiceId: string): void {
    this.mutationSubject.next({
      type: 'edge:delete',
      payload: { choiceId },
      timestamp: Date.now(),
    })
  }

  emitEdgeBatchAdd(choices: Choice[]): void {
    this.mutationSubject.next({
      type: 'edge:batch-add',
      payload: choices,
      timestamp: Date.now(),
    })
  }

  emitEdgeBatchUpdate(updates: Array<{ choiceId: string; updates: Partial<Choice> }>): void {
    this.mutationSubject.next({
      type: 'edge:batch-update',
      payload: updates,
      timestamp: Date.now(),
    })
  }

  emitEdgeBatchDelete(choiceIds: string[]): void {
    this.mutationSubject.next({
      type: 'edge:batch-delete',
      payload: { choiceIds },
      timestamp: Date.now(),
    })
  }

  emitGraphReset(
    cards: StoryCard[],
    choices: Choice[],
    characters: Character[],
    firstCardId: string | null,
    currentCardId: string | null
  ): void {
    this.mutationSubject.next({
      type: 'graph:reset',
      payload: { cards, choices, characters, firstCardId, currentCardId },
      timestamp: Date.now(),
    })
  }

  emitGraphSync(
    cards: StoryCard[],
    choices: Choice[],
    characters: Character[],
    firstCardId: string | null,
    currentCardId: string | null,
    collapsedNodes: Set<string>
  ): void {
    this.mutationSubject.next({
      type: 'graph:sync',
      payload: { cards, choices, characters, firstCardId, currentCardId, collapsedNodes },
      timestamp: Date.now(),
    })
  }

  emitSelectionChange(cardId: string | null): void {
    this.mutationSubject.next({
      type: 'selection:change',
      payload: { cardId },
      timestamp: Date.now(),
    })
  }

  emitCollapseToggle(nodeId: string, collapsed: boolean): void {
    this.mutationSubject.next({
      type: 'collapse:toggle',
      payload: { nodeId, collapsed },
      timestamp: Date.now(),
    })
  }

  // ============================================================================
  // State Accessors
  // ============================================================================

  getCurrentState(): GraphStateSnapshot {
    return this.stateSubject.getValue()
  }

  getCards(): StoryCard[] {
    return Array.from(this.stateSubject.getValue().cards.values())
  }

  getChoices(): Choice[] {
    return Array.from(this.stateSubject.getValue().choices.values())
  }

  getCharacters(): Character[] {
    return Array.from(this.stateSubject.getValue().characters.values())
  }

  // ============================================================================
  // Utility Streams
  // ============================================================================

  /**
   * Creates a filtered stream for a specific card ID
   */
  watchCard(cardId: string): Observable<StoryCard | null> {
    return this.state$.pipe(
      map(state => state.cards.get(cardId) ?? null),
      distinctUntilChanged()
    )
  }

  /**
   * Creates a filtered stream for a specific choice ID
   */
  watchChoice(choiceId: string): Observable<Choice | null> {
    return this.state$.pipe(
      map(state => state.choices.get(choiceId) ?? null),
      distinctUntilChanged()
    )
  }

  /**
   * Creates a stream that emits when specific mutation types occur
   */
  onMutationTypes(...types: GraphMutationType[]): Observable<GraphMutationEvent> {
    const typeSet = new Set(types)
    return this.mutations$.pipe(
      filter(e => typeSet.has(e.type))
    )
  }

  /**
   * Resets the hub state (useful for testing or cleanup)
   */
  reset(): void {
    this.stateSubject.next(createInitialSnapshot())
  }
}

// Export singleton instance getter
export const getGraphStreamHub = () => GraphStreamHub.getInstance()

// Export types for external use
export type { GraphStreamHub }
