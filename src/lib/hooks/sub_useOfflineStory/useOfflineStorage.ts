'use client'

import {
  saveStoryStack,
  saveStoryCards,
  saveChoices,
  getStoryStackFromDB,
  getAllStoryStacksFromDB,
  getStoryCardsFromDB,
  getChoicesFromDB,
  getAllChoicesForStack,
  deleteStoryStackFromDB,
  deleteStoryCardFromDB,
  deleteChoiceFromDB,
  deleteStoryCardsForStack,
  deleteChoicesForCard,
  isIndexedDBAvailable,
} from '@/lib/services/indexeddb'
import { StoryStack, StoryCard, Choice } from '@/lib/types'

/**
 * Storage operations for offline story data using IndexedDB
 */
export function useOfflineStorage() {
  const isAvailable = isIndexedDBAvailable()

  // Story Stack Storage
  const saveStack = async (stack: StoryStack) => {
    if (isAvailable) {
      await saveStoryStack(stack)
    }
  }

  const getStack = async (id: string): Promise<StoryStack | null> => {
    if (isAvailable) {
      const stack = await getStoryStackFromDB(id)
      return stack ?? null
    }
    return null
  }

  const getAllStacks = async (userId?: string): Promise<StoryStack[]> => {
    if (isAvailable) {
      return getAllStoryStacksFromDB(userId)
    }
    return []
  }

  const deleteStack = async (id: string) => {
    if (isAvailable) {
      await deleteStoryStackFromDB(id)
      await deleteStoryCardsForStack(id)
    }
  }

  // Story Card Storage
  const saveCards = async (cards: StoryCard[]) => {
    if (isAvailable) {
      await saveStoryCards(cards)
    }
  }

  const getCards = async (storyStackId: string): Promise<StoryCard[]> => {
    if (isAvailable) {
      return getStoryCardsFromDB(storyStackId)
    }
    return []
  }

  const deleteCard = async (id: string) => {
    if (isAvailable) {
      await deleteStoryCardFromDB(id)
      await deleteChoicesForCard(id)
    }
  }

  // Choice Storage
  const saveChoiceList = async (choices: Choice[]) => {
    if (isAvailable) {
      await saveChoices(choices)
    }
  }

  const getChoiceList = async (storyCardId: string): Promise<Choice[]> => {
    if (isAvailable) {
      return getChoicesFromDB(storyCardId)
    }
    return []
  }

  const getAllChoices = async (storyStackId: string): Promise<Choice[]> => {
    if (isAvailable) {
      return getAllChoicesForStack(storyStackId)
    }
    return []
  }

  const deleteChoice = async (id: string) => {
    if (isAvailable) {
      await deleteChoiceFromDB(id)
    }
  }

  return {
    isAvailable,
    // Stack operations
    saveStack,
    getStack,
    getAllStacks,
    deleteStack,
    // Card operations
    saveCards,
    getCards,
    deleteCard,
    // Choice operations
    saveChoiceList,
    getChoiceList,
    getAllChoices,
    deleteChoice,
  }
}

export type OfflineStorage = ReturnType<typeof useOfflineStorage>
