'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { StoryStack, StoryCard, Choice, Character } from '@/lib/types'

export interface EditorSnapshot {
  storyCards: StoryCard[]
  choices: Choice[]
  characters: Character[]
  currentCardId: string | null
  currentCharacterId: string | null
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
  const [currentCardId, setCurrentCardId] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [collapsedNodes, setCollapsedNodesInternal] = useState<Set<string>>(new Set())

  const currentCard = storyCards.find(card => card.id === currentCardId) || null
  const currentCharacter = characters.find(char => char.id === currentCharacterId) || null

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

  const addCard = useCallback((card: StoryCard) => {
    setStoryCards(prev => [...prev, card])
  }, [])

  const updateCard = useCallback((cardId: string, updates: Partial<StoryCard>) => {
    setStoryCards(prev =>
      prev.map(card =>
        card.id === cardId ? { ...card, ...updates, updatedAt: new Date().toISOString() } : card
      )
    )
  }, [])

  const deleteCard = useCallback((cardId: string) => {
    setStoryCards(prev => prev.filter(card => card.id !== cardId))
    if (currentCardId === cardId) {
      setCurrentCardId(null)
    }
  }, [currentCardId])

  const addChoice = useCallback((choice: Choice) => {
    setChoices(prev => [...prev, choice])
  }, [])

  const updateChoice = useCallback((choiceId: string, updates: Partial<Choice>) => {
    setChoices(prev =>
      prev.map(choice =>
        choice.id === choiceId ? { ...choice, ...updates, updatedAt: new Date().toISOString() } : choice
      )
    )
  }, [])

  const deleteChoice = useCallback((choiceId: string) => {
    setChoices(prev => prev.filter(choice => choice.id !== choiceId))
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
    if (currentCharacterId === characterId) {
      setCurrentCharacterId(null)
    }
  }, [currentCharacterId])

  const getSnapshot = useCallback((): EditorSnapshot => {
    return {
      storyCards,
      choices,
      characters,
      currentCardId,
      currentCharacterId,
      collapsedNodes,
    }
  }, [storyCards, choices, characters, currentCardId, currentCharacterId, collapsedNodes])

  const applySnapshot = useCallback((snapshot: EditorSnapshot) => {
    setStoryCards(snapshot.storyCards)
    setChoices(snapshot.choices)
    setCharacters(snapshot.characters)
    setCurrentCardId(snapshot.currentCardId)
    setCurrentCharacterId(snapshot.currentCharacterId)
    setCollapsedNodesInternal(snapshot.collapsedNodes)
  }, [])

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
