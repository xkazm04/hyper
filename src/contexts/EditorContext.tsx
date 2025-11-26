'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { StoryStack, StoryCard, Choice, Character } from '@/lib/types'

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

  // UI state
  isSaving: boolean
  setIsSaving: (saving: boolean) => void
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export function EditorProvider({ children }: { children: ReactNode }) {
  const [storyStack, setStoryStack] = useState<StoryStack | null>(null)
  const [storyCards, setStoryCards] = useState<StoryCard[]>([])
  const [currentCardId, setCurrentCardId] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const currentCard = storyCards.find(card => card.id === currentCardId) || null
  const currentCharacter = characters.find(char => char.id === currentCharacterId) || null

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
