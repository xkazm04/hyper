'use client'

import { useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { useUndoRedoContext } from '../UndoRedoContext'
import { StoryCard, Choice, Character } from '@/lib/types'
import { ActionType } from './types'

export function useUndoRedoActions() {
  const {
    addCard: editorAddCard,
    updateCard: editorUpdateCard,
    deleteCard: editorDeleteCard,
    addChoice: editorAddChoice,
    updateChoice: editorUpdateChoice,
    deleteChoice: editorDeleteChoice,
    addCharacter: editorAddCharacter,
    updateCharacter: editorUpdateCharacter,
    deleteCharacter: editorDeleteCharacter,
    storyCards,
    choices,
    characters,
  } = useEditor()

  const { recordAction } = useUndoRedoContext()

  const addCard = useCallback(
    (card: StoryCard) => {
      // Record current state before action
      recordAction('ADD_CARD', {
        id: card.id,
        title: card.title,
        imageUrl: card.imageUrl,
      })
      editorAddCard(card)
    },
    [editorAddCard, recordAction]
  )

  const updateCard = useCallback(
    (cardId: string, updates: Partial<StoryCard>) => {
      const card = storyCards.find((c) => c.id === cardId)
      if (card) {
        recordAction('UPDATE_CARD', {
          id: cardId,
          title: updates.title || card.title,
          imageUrl: updates.imageUrl ?? card.imageUrl,
        })
      }
      editorUpdateCard(cardId, updates)
    },
    [editorUpdateCard, recordAction, storyCards]
  )

  const deleteCard = useCallback(
    (cardId: string) => {
      const card = storyCards.find((c) => c.id === cardId)
      if (card) {
        recordAction('DELETE_CARD', {
          id: cardId,
          title: card.title,
          imageUrl: card.imageUrl,
        })
      }
      editorDeleteCard(cardId)
    },
    [editorDeleteCard, recordAction, storyCards]
  )

  const addChoice = useCallback(
    (choice: Choice) => {
      const card = storyCards.find((c) => c.id === choice.storyCardId)
      recordAction('ADD_CHOICE', card ? {
        id: card.id,
        title: card.title,
        imageUrl: card.imageUrl,
      } : undefined)
      editorAddChoice(choice)
    },
    [editorAddChoice, recordAction, storyCards]
  )

  const updateChoice = useCallback(
    (choiceId: string, updates: Partial<Choice>) => {
      const choice = choices.find((c) => c.id === choiceId)
      const card = choice ? storyCards.find((c) => c.id === choice.storyCardId) : null
      recordAction('UPDATE_CHOICE', card ? {
        id: card.id,
        title: card.title,
        imageUrl: card.imageUrl,
      } : undefined)
      editorUpdateChoice(choiceId, updates)
    },
    [editorUpdateChoice, recordAction, choices, storyCards]
  )

  const deleteChoice = useCallback(
    (choiceId: string) => {
      const choice = choices.find((c) => c.id === choiceId)
      const card = choice ? storyCards.find((c) => c.id === choice.storyCardId) : null
      recordAction('DELETE_CHOICE', card ? {
        id: card.id,
        title: card.title,
        imageUrl: card.imageUrl,
      } : undefined)
      editorDeleteChoice(choiceId)
    },
    [editorDeleteChoice, recordAction, choices, storyCards]
  )

  const addCharacter = useCallback(
    (character: Character) => {
      recordAction('ADD_CHARACTER', {
        id: character.id,
        title: character.name,
        imageUrl: character.avatarUrl,
      })
      editorAddCharacter(character)
    },
    [editorAddCharacter, recordAction]
  )

  const updateCharacter = useCallback(
    (characterId: string, updates: Partial<Character>) => {
      const character = characters.find((c) => c.id === characterId)
      if (character) {
        recordAction('UPDATE_CHARACTER', {
          id: characterId,
          title: updates.name || character.name,
          imageUrl: updates.avatarUrl ?? character.avatarUrl,
        })
      }
      editorUpdateCharacter(characterId, updates)
    },
    [editorUpdateCharacter, recordAction, characters]
  )

  const deleteCharacter = useCallback(
    (characterId: string) => {
      const character = characters.find((c) => c.id === characterId)
      if (character) {
        recordAction('DELETE_CHARACTER', {
          id: characterId,
          title: character.name,
          imageUrl: character.avatarUrl,
        })
      }
      editorDeleteCharacter(characterId)
    },
    [editorDeleteCharacter, recordAction, characters]
  )

  return {
    addCard,
    updateCard,
    deleteCard,
    addChoice,
    updateChoice,
    deleteChoice,
    addCharacter,
    updateCharacter,
    deleteCharacter,
  }
}
