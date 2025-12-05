'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef, useMemo } from 'react'
import { StoryStack, StoryCard, Choice, Character, CharacterCard } from '@/lib/types'
import { getGraphStreamHub } from '@/app/features/editor/story/sub_StoryGraph/lib/graphStreamHub'
import { invalidateSessionLayoutCache } from '@/app/features/editor/story/sub_StoryGraph/lib/layoutCache'


export interface EditorSnapshot {
  storyCards: StoryCard[]
  choices: Choice[]
  characters: Character[]
  characterCards: CharacterCard[]
  currentCardId: string | null
  currentCharacterId: string | null
  currentCharacterCardId: string | null
  collapsedNodes: Set<string>
}

/**
 * Pending operation status
 */
export type OperationStatus = 'pending' | 'success' | 'failed'

/**
 * A pending operation that tracks optimistic updates
 */
export interface PendingOperation {
  id: string
  entityId: string
  type: 'add_card' | 'update_card' | 'delete_card' | 'add_choice' | 'update_choice' | 'delete_choice' |
        'add_character' | 'update_character' | 'delete_character' |
        'add_character_card' | 'update_character_card' | 'delete_character_card'
  status: OperationStatus
  timestamp: number
  error?: string
}

/**
 * Optimistic operations state
 */
export interface OptimisticState {
  /** All pending operations */
  pendingOperations: PendingOperation[]
  /** IDs of entities that have pending operations */
  pendingEntityIds: Set<string>
  /** IDs of entities with failed operations */
  failedEntityIds: Set<string>
}

interface EditorContextType {
  // Story data
  storyStack: StoryStack | null
  storyCards: StoryCard[]
  currentCard: StoryCard | null
  currentCardId: string | null
  choices: Choice[]
  characters: Character[]
  currentCharacter: Character | null
  currentCharacterId: string | null
  characterCards: CharacterCard[]
  currentCharacterCard: CharacterCard | null
  currentCharacterCardId: string | null

  // Pre-computed graph indices for O(1) lookups
  graphIndices: GraphIndices
  getChoicesForCard: (cardId: string) => Choice[]
  getPredecessors: (cardId: string) => { cardId: string; choiceLabel: string }[]
  getSuccessors: (cardId: string) => { cardId: string; choiceLabel: string }[]

  // Collapsed nodes state (for story graph)
  collapsedNodes: Set<string>
  toggleNodeCollapsed: (nodeId: string) => void
  isNodeCollapsed: (nodeId: string) => boolean
  setCollapsedNodes: (nodes: Set<string>) => void

  // Actions
  setStoryStack: (stack: StoryStack) => void
  setStoryCards: (cards: StoryCard[]) => void
  setCurrentCardId: (cardId: string | null) => void
  addCard: (card: StoryCard) => void
  updateCard: (cardId: string, updates: Partial<StoryCard>) => void
  deleteCard: (cardId: string) => void
  setChoices: (choices: Choice[]) => void
  addChoice: (choice: Choice) => void
  updateChoice: (choiceId: string, updates: Partial<Choice>) => void
  deleteChoice: (choiceId: string) => void
  setCharacters: (characters: Character[]) => void
  setCurrentCharacterId: (characterId: string | null) => void
  addCharacter: (character: Character) => void
  updateCharacter: (characterId: string, updates: Partial<Character>) => void
  deleteCharacter: (characterId: string) => void
  setCharacterCards: (characterCards: CharacterCard[]) => void
  setCurrentCharacterCardId: (characterCardId: string | null) => void
  addCharacterCard: (characterCard: CharacterCard) => void
  updateCharacterCard: (characterCardId: string, updates: Partial<CharacterCard>) => void
  deleteCharacterCard: (characterCardId: string) => void

  // Snapshot for undo/redo
  getSnapshot: () => EditorSnapshot
  applySnapshot: (snapshot: EditorSnapshot) => void

  // UI state
  isSaving: boolean
  setIsSaving: (saving: boolean) => void

  // Optimistic operations state
  optimisticState: OptimisticState
  /** Start tracking a pending operation */
  startOperation: (entityId: string, type: PendingOperation['type']) => string
  /** Mark an operation as completed successfully */
  completeOperation: (operationId: string) => void
  /** Mark an operation as failed, triggering rollback */
  failOperation: (operationId: string, error: string) => void
  /** Clear a failed operation after user acknowledgment */
  clearFailedOperation: (operationId: string) => void
  /** Check if an entity has a pending operation */
  hasPendingOperation: (entityId: string) => boolean
  /** Check if an entity has a failed operation */
  hasFailedOperation: (entityId: string) => boolean
  /** Get all failed operations */
  getFailedOperations: () => PendingOperation[]
}

/**
 * Pre-computed graph indices for O(1) lookups
 */
interface GraphIndices {
  choicesByCardId: Map<string, Choice[]>
  predecessorsByCardId: Map<string, { cardId: string; choiceLabel: string }[]>
  successorsByCardId: Map<string, { cardId: string; choiceLabel: string }[]>
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

// Helper to get localStorage key for collapsed nodes
const getCollapsedNodesKey = (stackId: string) => `hyper_collapsed_nodes_${stackId}`

// Empty indices for initial state
const EMPTY_GRAPH_INDICES: GraphIndices = {
  choicesByCardId: new Map(),
  predecessorsByCardId: new Map(),
  successorsByCardId: new Map(),
}

/**
 * Builds pre-computed graph indices from choices array
 */
function buildGraphIndices(choices: Choice[]): GraphIndices {
  const choicesByCardId = new Map<string, Choice[]>()
  const predecessorsByCardId = new Map<string, { cardId: string; choiceLabel: string }[]>()
  const successorsByCardId = new Map<string, { cardId: string; choiceLabel: string }[]>()

  for (const choice of choices) {
    const existing = choicesByCardId.get(choice.storyCardId)
    if (existing) {
      existing.push(choice)
    } else {
      choicesByCardId.set(choice.storyCardId, [choice])
    }

    if (choice.targetCardId) {
      const successors = successorsByCardId.get(choice.storyCardId)
      if (successors) {
        successors.push({ cardId: choice.targetCardId, choiceLabel: choice.label })
      } else {
        successorsByCardId.set(choice.storyCardId, [{ cardId: choice.targetCardId, choiceLabel: choice.label }])
      }

      const predecessors = predecessorsByCardId.get(choice.targetCardId)
      if (predecessors) {
        predecessors.push({ cardId: choice.storyCardId, choiceLabel: choice.label })
      } else {
        predecessorsByCardId.set(choice.targetCardId, [{ cardId: choice.storyCardId, choiceLabel: choice.label }])
      }
    }
  }

  choicesByCardId.forEach((cardChoices) => {
    cardChoices.sort((a, b) => a.orderIndex - b.orderIndex)
  })

  return { choicesByCardId, predecessorsByCardId, successorsByCardId }
}

// ============================================================================
// Card State Slice
// ============================================================================
function useCardState(isInitializedRef: React.MutableRefObject<boolean>) {
  const [storyCards, setStoryCards] = useState<StoryCard[]>([])
  const [currentCardId, setCurrentCardIdInternal] = useState<string | null>(null)

  // Memoize currentCard
  const currentCard = useMemo(() => {
    return storyCards.find(card => card.id === currentCardId) || null
  }, [storyCards, currentCardId])

  const setCurrentCardId = useCallback((cardId: string | null) => {
    setCurrentCardIdInternal(cardId)
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitSelectionChange(cardId)
    }
  }, [isInitializedRef])

  const addCard = useCallback((card: StoryCard) => {
    setStoryCards(prev => [...prev, card])
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitNodeAdd(card)
    }
  }, [isInitializedRef])

  const updateCard = useCallback((cardId: string, updates: Partial<StoryCard>) => {
    setStoryCards(prev =>
      prev.map(card =>
        card.id === cardId ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card
      )
    )
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitNodeUpdate(cardId, updates)
    }
  }, [isInitializedRef])

  const deleteCard = useCallback((cardId: string) => {
    setStoryCards(prev => prev.filter(card => card.id !== cardId))
    setCurrentCardIdInternal(prev => prev === cardId ? null : prev)
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitNodeDelete(cardId)
    }
  }, [isInitializedRef])

  return {
    storyCards,
    currentCard,
    currentCardId,
    setStoryCards,
    setCurrentCardId,
    setCurrentCardIdInternal,
    addCard,
    updateCard,
    deleteCard,
  }
}

// ============================================================================
// Choice State Slice
// ============================================================================
function useChoiceState(
  isInitializedRef: React.MutableRefObject<boolean>,
  storyStackRef: React.MutableRefObject<StoryStack | null>
) {
  const [choices, setChoices] = useState<Choice[]>([])

  // Pre-computed graph indices - memoized
  const graphIndices = useMemo(() => {
    if (choices.length === 0) return EMPTY_GRAPH_INDICES
    return buildGraphIndices(choices)
  }, [choices])

  const getChoicesForCard = useCallback((cardId: string): Choice[] => {
    return graphIndices.choicesByCardId.get(cardId) || []
  }, [graphIndices])

  const getPredecessors = useCallback((cardId: string) => {
    return graphIndices.predecessorsByCardId.get(cardId) || []
  }, [graphIndices])

  const getSuccessors = useCallback((cardId: string) => {
    return graphIndices.successorsByCardId.get(cardId) || []
  }, [graphIndices])

  const addChoice = useCallback((choice: Choice) => {
    setChoices(prev => [...prev, choice])
    const stackId = storyStackRef.current?.id
    if (stackId) {
      invalidateSessionLayoutCache(stackId)
    }
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitEdgeAdd(choice)
    }
  }, [isInitializedRef, storyStackRef])

  const updateChoice = useCallback((choiceId: string, updates: Partial<Choice>) => {
    setChoices(prev =>
      prev.map(choice =>
        choice.id === choiceId ? { ...choice, ...updates, updatedAt: new Date().toISOString() } : choice
      )
    )
    const stackId = storyStackRef.current?.id
    if (stackId && (updates.targetCardId !== undefined || updates.orderIndex !== undefined)) {
      invalidateSessionLayoutCache(stackId)
    }
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitEdgeUpdate(choiceId, updates)
    }
  }, [isInitializedRef, storyStackRef])

  const deleteChoice = useCallback((choiceId: string) => {
    setChoices(prev => prev.filter(choice => choice.id !== choiceId))
    const stackId = storyStackRef.current?.id
    if (stackId) {
      invalidateSessionLayoutCache(stackId)
    }
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitEdgeDelete(choiceId)
    }
  }, [isInitializedRef, storyStackRef])

  return {
    choices,
    graphIndices,
    setChoices,
    addChoice,
    updateChoice,
    deleteChoice,
    getChoicesForCard,
    getPredecessors,
    getSuccessors,
  }
}

// ============================================================================
// Character State Slice
// ============================================================================
function useCharacterState() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [currentCharacterId, setCurrentCharacterIdInternal] = useState<string | null>(null)
  const [characterCards, setCharacterCards] = useState<CharacterCard[]>([])
  const [currentCharacterCardId, setCurrentCharacterCardIdInternal] = useState<string | null>(null)

  // Memoize derived state
  const currentCharacter = useMemo(() => {
    return characters.find(char => char.id === currentCharacterId) || null
  }, [characters, currentCharacterId])

  const currentCharacterCard = useMemo(() => {
    return characterCards.find(card => card.id === currentCharacterCardId) || null
  }, [characterCards, currentCharacterCardId])

  const setCurrentCharacterId = useCallback((characterId: string | null) => {
    setCurrentCharacterIdInternal(characterId)
  }, [])

  const setCurrentCharacterCardId = useCallback((characterCardId: string | null) => {
    setCurrentCharacterCardIdInternal(characterCardId)
  }, [])

  const addCharacter = useCallback((character: Character) => {
    setCharacters(prev => [...prev, character])
  }, [])

  const updateCharacter = useCallback((characterId: string, updates: Partial<Character>) => {
    setCharacters(prev =>
      prev.map(character =>
        character.id === characterId ? { ...character, ...updates, updatedAt: new Date().toISOString() } : character
      )
    )
  }, [])

  const deleteCharacter = useCallback((characterId: string) => {
    setCharacters(prev => prev.filter(character => character.id !== characterId))
    setCurrentCharacterIdInternal(prev => prev === characterId ? null : prev)
  }, [])

  const addCharacterCard = useCallback((characterCard: CharacterCard) => {
    setCharacterCards(prev => [...prev, characterCard])
  }, [])

  const updateCharacterCard = useCallback((characterCardId: string, updates: Partial<CharacterCard>) => {
    setCharacterCards(prev =>
      prev.map(card =>
        card.id === characterCardId ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card
      )
    )
  }, [])

  const deleteCharacterCard = useCallback((characterCardId: string) => {
    setCharacterCards(prev => prev.filter(card => card.id !== characterCardId))
    setCurrentCharacterCardIdInternal(prev => prev === characterCardId ? null : prev)
  }, [])

  return {
    characters,
    currentCharacter,
    currentCharacterId,
    characterCards,
    currentCharacterCard,
    currentCharacterCardId,
    setCharacters,
    setCurrentCharacterId,
    setCurrentCharacterIdInternal,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    setCharacterCards,
    setCurrentCharacterCardId,
    setCurrentCharacterCardIdInternal,
    addCharacterCard,
    updateCharacterCard,
    deleteCharacterCard,
  }
}

// ============================================================================
// Collapsed Nodes State Slice
// ============================================================================
function useCollapsedNodesState(storyStackId: string | null) {
  const [collapsedNodes, setCollapsedNodesInternal] = useState<Set<string>>(new Set())

  // Load from localStorage when storyStackId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && storyStackId) {
      try {
        const stored = localStorage.getItem(getCollapsedNodesKey(storyStackId))
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setCollapsedNodesInternal(new Set(parsed))
          }
        } else {
          setCollapsedNodesInternal(new Set())
        }
      } catch {
        setCollapsedNodesInternal(new Set())
      }
    }
  }, [storyStackId])

  // Persist to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && storyStackId) {
      try {
        localStorage.setItem(
          getCollapsedNodesKey(storyStackId),
          JSON.stringify(Array.from(collapsedNodes))
        )
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [collapsedNodes, storyStackId])

  const toggleNodeCollapsed = useCallback((nodeId: string) => {
    setCollapsedNodesInternal(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

  const isNodeCollapsed = useCallback((nodeId: string) => {
    return collapsedNodes.has(nodeId)
  }, [collapsedNodes])

  const setCollapsedNodes = useCallback((nodes: Set<string>) => {
    setCollapsedNodesInternal(nodes)
  }, [])

  return {
    collapsedNodes,
    toggleNodeCollapsed,
    isNodeCollapsed,
    setCollapsedNodes,
    setCollapsedNodesInternal,
  }
}

// ============================================================================
// Optimistic Operations State Slice
// ============================================================================
let operationCounter = 0

function generateOperationId(): string {
  return `op_${Date.now()}_${++operationCounter}`
}

function useOptimisticOperationsState() {
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([])
  const [pendingEntityIds, setPendingEntityIds] = useState<Set<string>>(new Set())
  const [failedEntityIds, setFailedEntityIds] = useState<Set<string>>(new Set())

  // Refs for O(1) lookup without re-renders
  const pendingEntityIdsRef = useRef<Set<string>>(new Set())
  const failedEntityIdsRef = useRef<Set<string>>(new Set())
  const operationsMapRef = useRef<Map<string, PendingOperation>>(new Map())

  const startOperation = useCallback((
    entityId: string,
    type: PendingOperation['type']
  ): string => {
    const operationId = generateOperationId()
    const operation: PendingOperation = {
      id: operationId,
      entityId,
      type,
      status: 'pending',
      timestamp: Date.now(),
    }

    operationsMapRef.current.set(operationId, operation)
    pendingEntityIdsRef.current.add(entityId)

    setPendingOperations(prev => [...prev, operation])
    setPendingEntityIds(new Set(pendingEntityIdsRef.current))

    return operationId
  }, [])

  const completeOperation = useCallback((operationId: string) => {
    const operation = operationsMapRef.current.get(operationId)
    if (!operation) return

    operationsMapRef.current.delete(operationId)
    pendingEntityIdsRef.current.delete(operation.entityId)

    setPendingOperations(prev => prev.filter(op => op.id !== operationId))
    setPendingEntityIds(new Set(pendingEntityIdsRef.current))
  }, [])

  const failOperation = useCallback((operationId: string, error: string) => {
    const operation = operationsMapRef.current.get(operationId)
    if (!operation) return

    const failedOperation: PendingOperation = {
      ...operation,
      status: 'failed',
      error,
    }

    operationsMapRef.current.set(operationId, failedOperation)
    pendingEntityIdsRef.current.delete(operation.entityId)
    failedEntityIdsRef.current.add(operation.entityId)

    setPendingOperations(prev =>
      prev.map(op => op.id === operationId ? failedOperation : op)
    )
    setPendingEntityIds(new Set(pendingEntityIdsRef.current))
    setFailedEntityIds(new Set(failedEntityIdsRef.current))
  }, [])

  const clearFailedOperation = useCallback((operationId: string) => {
    const operation = operationsMapRef.current.get(operationId)
    if (!operation) return

    operationsMapRef.current.delete(operationId)
    failedEntityIdsRef.current.delete(operation.entityId)

    setPendingOperations(prev => prev.filter(op => op.id !== operationId))
    setFailedEntityIds(new Set(failedEntityIdsRef.current))
  }, [])

  const hasPendingOperation = useCallback((entityId: string): boolean => {
    return pendingEntityIdsRef.current.has(entityId)
  }, [])

  const hasFailedOperation = useCallback((entityId: string): boolean => {
    return failedEntityIdsRef.current.has(entityId)
  }, [])

  const getFailedOperations = useCallback((): PendingOperation[] => {
    return pendingOperations.filter(op => op.status === 'failed')
  }, [pendingOperations])

  const optimisticState = useMemo<OptimisticState>(() => ({
    pendingOperations,
    pendingEntityIds,
    failedEntityIds,
  }), [pendingOperations, pendingEntityIds, failedEntityIds])

  return {
    optimisticState,
    startOperation,
    completeOperation,
    failOperation,
    clearFailedOperation,
    hasPendingOperation,
    hasFailedOperation,
    getFailedOperations,
  }
}

// ============================================================================
// Main Provider
// ============================================================================
export function EditorProvider({ children }: { children: ReactNode }) {
  const [storyStack, setStoryStackInternal] = useState<StoryStack | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Ref to track if we should emit to stream
  const isInitializedRef = useRef(false)
  const storyStackRef = useRef<StoryStack | null>(null)

  // Keep storyStackRef in sync
  useEffect(() => {
    storyStackRef.current = storyStack
  }, [storyStack])

  // Use state slices
  const cardState = useCardState(isInitializedRef)
  const choiceState = useChoiceState(isInitializedRef, storyStackRef)
  const characterState = useCharacterState()
  const collapsedNodesState = useCollapsedNodesState(storyStack?.id ?? null)
  const optimisticOpsState = useOptimisticOperationsState()

  // Wrap setStoryStack to handle collapsed nodes loading
  const setStoryStack = useCallback((stack: StoryStack) => {
    setStoryStackInternal(stack)
  }, [])

  const getSnapshot = useCallback((): EditorSnapshot => {
    return {
      storyCards: cardState.storyCards,
      choices: choiceState.choices,
      characters: characterState.characters,
      characterCards: characterState.characterCards,
      currentCardId: cardState.currentCardId,
      currentCharacterId: characterState.currentCharacterId,
      currentCharacterCardId: characterState.currentCharacterCardId,
      collapsedNodes: collapsedNodesState.collapsedNodes,
    }
  }, [
    cardState.storyCards,
    choiceState.choices,
    characterState.characters,
    characterState.characterCards,
    cardState.currentCardId,
    characterState.currentCharacterId,
    characterState.currentCharacterCardId,
    collapsedNodesState.collapsedNodes,
  ])

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    cardState.setStoryCards(snapshot.storyCards)
    choiceState.setChoices(snapshot.choices)
    characterState.setCharacters(snapshot.characters)
    characterState.setCharacterCards(snapshot.characterCards)
    cardState.setCurrentCardIdInternal(snapshot.currentCardId)
    characterState.setCurrentCharacterIdInternal(snapshot.currentCharacterId)
    characterState.setCurrentCharacterCardIdInternal(snapshot.currentCharacterCardId)
    collapsedNodesState.setCollapsedNodesInternal(snapshot.collapsedNodes)
  }, [cardState, choiceState, characterState, collapsedNodesState])

  // Emit graph sync event when story data changes
  useEffect(() => {
    if (!storyStack) return

    if (!isInitializedRef.current) {
      isInitializedRef.current = true
    }

    const hub = getGraphStreamHub()
    hub.emitGraphSync(
      cardState.storyCards,
      choiceState.choices,
      characterState.characters,
      storyStack.firstCardId ?? null,
      cardState.currentCardId,
      collapsedNodesState.collapsedNodes
    )
  }, [
    storyStack,
    cardState.storyCards,
    choiceState.choices,
    characterState.characters,
    cardState.currentCardId,
    collapsedNodesState.collapsedNodes,
  ])

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<EditorContextType>(() => ({
    // Story data
    storyStack,
    storyCards: cardState.storyCards,
    currentCard: cardState.currentCard,
    currentCardId: cardState.currentCardId,
    choices: choiceState.choices,
    characters: characterState.characters,
    currentCharacter: characterState.currentCharacter,
    currentCharacterId: characterState.currentCharacterId,
    characterCards: characterState.characterCards,
    currentCharacterCard: characterState.currentCharacterCard,
    currentCharacterCardId: characterState.currentCharacterCardId,

    // Graph indices
    graphIndices: choiceState.graphIndices,
    getChoicesForCard: choiceState.getChoicesForCard,
    getPredecessors: choiceState.getPredecessors,
    getSuccessors: choiceState.getSuccessors,

    // Collapsed nodes
    collapsedNodes: collapsedNodesState.collapsedNodes,
    toggleNodeCollapsed: collapsedNodesState.toggleNodeCollapsed,
    isNodeCollapsed: collapsedNodesState.isNodeCollapsed,
    setCollapsedNodes: collapsedNodesState.setCollapsedNodes,

    // Actions
    setStoryStack,
    setStoryCards: cardState.setStoryCards,
    setCurrentCardId: cardState.setCurrentCardId,
    addCard: cardState.addCard,
    updateCard: cardState.updateCard,
    deleteCard: cardState.deleteCard,
    setChoices: choiceState.setChoices,
    addChoice: choiceState.addChoice,
    updateChoice: choiceState.updateChoice,
    deleteChoice: choiceState.deleteChoice,
    setCharacters: characterState.setCharacters,
    setCurrentCharacterId: characterState.setCurrentCharacterId,
    addCharacter: characterState.addCharacter,
    updateCharacter: characterState.updateCharacter,
    deleteCharacter: characterState.deleteCharacter,
    setCharacterCards: characterState.setCharacterCards,
    setCurrentCharacterCardId: characterState.setCurrentCharacterCardId,
    addCharacterCard: characterState.addCharacterCard,
    updateCharacterCard: characterState.updateCharacterCard,
    deleteCharacterCard: characterState.deleteCharacterCard,

    // Snapshot
    getSnapshot,
    applySnapshot,

    // UI state
    isSaving,
    setIsSaving,

    // Optimistic operations
    optimisticState: optimisticOpsState.optimisticState,
    startOperation: optimisticOpsState.startOperation,
    completeOperation: optimisticOpsState.completeOperation,
    failOperation: optimisticOpsState.failOperation,
    clearFailedOperation: optimisticOpsState.clearFailedOperation,
    hasPendingOperation: optimisticOpsState.hasPendingOperation,
    hasFailedOperation: optimisticOpsState.hasFailedOperation,
    getFailedOperations: optimisticOpsState.getFailedOperations,
  }), [
    storyStack,
    cardState,
    choiceState,
    characterState,
    collapsedNodesState,
    setStoryStack,
    getSnapshot,
    applySnapshot,
    isSaving,
    optimisticOpsState,
  ])

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  )
}

/**
 * Main hook for accessing all editor state.
 * For performance-critical components, consider using granular hooks instead:
 * - useCards() / useCurrentCard() / useStoryCards() - for card state only
 * - useChoices() / useGraphIndices() - for choice and graph state only
 * - useCharacters() / useCurrentCharacter() / useCharacterCardsOnly() - for character state only
 */
export function useEditor() {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}

// ============================================================================
// Selector Hooks for Fine-Grained Subscriptions
// ============================================================================

/**
 * Hook for components that only need story stack info
 */
export function useStoryStack() {
  const { storyStack, setStoryStack } = useEditor()
  return useMemo(() => ({ storyStack, setStoryStack }), [storyStack, setStoryStack])
}

/**
 * Hook for components that only need saving state
 */
export function useSavingState() {
  const { isSaving, setIsSaving } = useEditor()
  return useMemo(() => ({ isSaving, setIsSaving }), [isSaving, setIsSaving])
}

/**
 * Hook for components that only need collapsed nodes state
 */
export function useCollapsedNodes() {
  const { collapsedNodes, toggleNodeCollapsed, isNodeCollapsed, setCollapsedNodes } = useEditor()
  return useMemo(() => ({
    collapsedNodes,
    toggleNodeCollapsed,
    isNodeCollapsed,
    setCollapsedNodes,
  }), [collapsedNodes, toggleNodeCollapsed, isNodeCollapsed, setCollapsedNodes])
}

/**
 * Hook for components that only need snapshot functionality
 */
export function useEditorSnapshot() {
  const { getSnapshot, applySnapshot } = useEditor()
  return useMemo(() => ({ getSnapshot, applySnapshot }), [getSnapshot, applySnapshot])
}

/**
 * Hook for components that need optimistic operations state
 */
export function useOptimisticOperations() {
  const {
    optimisticState,
    startOperation,
    completeOperation,
    failOperation,
    clearFailedOperation,
    hasPendingOperation,
    hasFailedOperation,
    getFailedOperations,
  } = useEditor()
  return useMemo(() => ({
    optimisticState,
    startOperation,
    completeOperation,
    failOperation,
    clearFailedOperation,
    hasPendingOperation,
    hasFailedOperation,
    getFailedOperations,
  }), [
    optimisticState,
    startOperation,
    completeOperation,
    failOperation,
    clearFailedOperation,
    hasPendingOperation,
    hasFailedOperation,
    getFailedOperations,
  ])
}
