'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { StoryStack, StoryCard, Choice } from '@/lib/types'

interface EditorContextType {
  // Story data
  storyStack: StoryStack | null
  storyCards: StoryCard[]
  currentCard: StoryCard | null
  currentCardId: string | null
  choices: Choice[]
  
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
  const [isSaving, setIsSaving] = useState(false)

  const currentCard = storyCards.find(card => card.id === currentCardId) || null

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

  return (
    <EditorContext.Provider
      value={{
        storyStack,
        storyCards,
        currentCard,
        currentCardId,
        choices,
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
