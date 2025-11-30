'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react'
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
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

// Helper to get localStorage key for collapsed nodes
const getCollapsedNodesKey = (stackId: string) => `hyper_collapsed_nodes_${stackId}`

export function EditorProvider({ children }: { children: ReactNode }) {
  const [storyStack, setStoryStackInternal] = useState<StoryStack | null>(null)
  const [storyCards, setStoryCards] = useState<StoryCard[]>([])
  const [currentCardId, setCurrentCardIdInternal] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null)
  const [characterCards, setCharacterCards] = useState<CharacterCard[]>([])
  const [currentCharacterCardId, setCurrentCharacterCardId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [collapsedNodes, setCollapsedNodesInternal] = useState<Set<string>>(new Set())

  // Ref to track if we should emit to stream (prevents double emissions)
  const isInitializedRef = useRef(false)

  const currentCard = storyCards.find(card => card.id === currentCardId) || null
  const currentCharacter = characters.find(char => char.id === currentCharacterId) || null
  const currentCharacterCard = characterCards.find(card => card.id === currentCharacterCardId) || null

  // Load collapsed nodes from localStorage when storyStack changes
  const setStoryStack = useCallback((stack: StoryStack) => {
    setStoryStackInternal(stack)
    // Load collapsed nodes from localStorage
    if (typeof window !== 'undefined' && stack?.id) {
      try {
        const stored = localStorage.getItem(getCollapsedNodesKey(stack.id))
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
  }, [])

  // Persist collapsed nodes to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && storyStack?.id) {
      try {
        localStorage.setItem(
          getCollapsedNodesKey(storyStack.id),
          JSON.stringify(Array.from(collapsedNodes))
        )
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [collapsedNodes, storyStack?.id])

  // Toggle collapsed state for a node
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

  // Check if a node is collapsed
  const isNodeCollapsed = useCallback((nodeId: string) => {
    return collapsedNodes.has(nodeId)
  }, [collapsedNodes])

  // Set collapsed nodes directly
  const setCollapsedNodes = useCallback((nodes: Set<string>) => {
    setCollapsedNodesInternal(nodes)
  }, [])

  // Wrap setCurrentCardId to emit to stream
  const setCurrentCardId = useCallback((cardId: string | null) => {
    setCurrentCardIdInternal(cardId)
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitSelectionChange(cardId)
    }
  }, [])

  const addCard = useCallback((card: StoryCard) => {
    setStoryCards(prev => [...prev, card])
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitNodeAdd(card)
    }
  }, [])

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
  }, [])

  const deleteCard = useCallback((cardId: string) => {
    setStoryCards(prev => prev.filter(card => card.id !== cardId))
    if (currentCardId === cardId) {
      setCurrentCardIdInternal(null)
    }
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitNodeDelete(cardId)
    }
  }, [currentCardId])

  const addChoice = useCallback((choice: Choice) => {
    setChoices(prev => [...prev, choice])
    // Invalidate layout cache when choices change (affects graph structure)
    const stackId = storyStack?.id
    if (stackId) {
      invalidateSessionLayoutCache(stackId)
    }
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitEdgeAdd(choice)
    }
  }, [storyStack])

  const updateChoice = useCallback((choiceId: string, updates: Partial<Choice>) => {
    setChoices(prev =>
      prev.map(choice =>
        choice.id === choiceId ? { ...choice, ...updates, updatedAt: new Date().toISOString() } : choice
      )
    )
    // Invalidate layout cache if targetCardId or orderIndex changes (affects graph structure)
    const stackId = storyStack?.id
    if (stackId && (updates.targetCardId !== undefined || updates.orderIndex !== undefined)) {
      invalidateSessionLayoutCache(stackId)
    }
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitEdgeUpdate(choiceId, updates)
    }
  }, [storyStack])

  const deleteChoice = useCallback((choiceId: string) => {
    setChoices(prev => prev.filter(choice => choice.id !== choiceId))
    // Invalidate layout cache when choices change (affects graph structure)
    const stackId = storyStack?.id
    if (stackId) {
      invalidateSessionLayoutCache(stackId)
    }
    if (isInitializedRef.current) {
      const hub = getGraphStreamHub()
      hub.emitEdgeDelete(choiceId)
    }
  }, [storyStack])

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
    if (currentCharacterId === characterId) {
      setCurrentCharacterId(null)
    }
  }, [currentCharacterId])

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
    if (currentCharacterCardId === characterCardId) {
      setCurrentCharacterCardId(null)
    }
  }, [currentCharacterCardId])

  const getSnapshot = useCallback((): EditorSnapshot => {
    return {
      storyCards,
      choices,
      characters,
      characterCards,
      currentCardId,
      currentCharacterId,
      currentCharacterCardId,
      collapsedNodes,
    }
  }, [storyCards, choices, characters, characterCards, currentCardId, currentCharacterId, currentCharacterCardId, collapsedNodes])

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setStoryCards(snapshot.storyCards)
    setChoices(snapshot.choices)
    setCharacters(snapshot.characters)
    setCharacterCards(snapshot.characterCards)
    setCurrentCardIdInternal(snapshot.currentCardId)
    setCurrentCharacterId(snapshot.currentCharacterId)
    setCurrentCharacterCardId(snapshot.currentCharacterCardId)
    setCollapsedNodesInternal(snapshot.collapsedNodes)
  }, [])

  // Emit graph sync event when story data changes
  // This allows GraphStreamHub subscribers to react to data changes
  useEffect(() => {
    // Skip if not initialized or no story stack
    if (!storyStack) return

    // Mark as initialized after first sync
    if (!isInitializedRef.current) {
      isInitializedRef.current = true
    }

    const hub = getGraphStreamHub()
    hub.emitGraphSync(
      storyCards,
      choices,
      characters,
      storyStack.firstCardId ?? null,
      currentCardId,
      collapsedNodes
    )
  }, [storyStack, storyCards, choices, characters, currentCardId, collapsedNodes])

  return (
    <EditorContext.Provider
      value={{
        storyStack,
        storyCards,
        currentCard,
        currentCardId,
        choices,
        characters,
        currentCharacter,
        currentCharacterId,
        characterCards,
        currentCharacterCard,
        currentCharacterCardId,
        collapsedNodes,
        toggleNodeCollapsed,
        isNodeCollapsed,
        setCollapsedNodes,
        setStoryStack,
        setStoryCards,
        setCurrentCardId,
        addCard,
        updateCard,
        deleteCard,
        setChoices,
        addChoice,
        updateChoice,
        deleteChoice,
        setCharacters,
        setCurrentCharacterId,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        setCharacterCards,
        setCurrentCharacterCardId,
        addCharacterCard,
        updateCharacterCard,
        deleteCharacterCard,
        getSnapshot,
        applySnapshot,
        isSaving,
        setIsSaving,
      }}
    >
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}
