'use client'

import { syncService } from '@/lib/services/sync'
import { StoryService } from '@/lib/services/story'
import { StoryStack, StoryCard, Choice } from '@/lib/types'
import { OfflineStorage } from './useOfflineStorage'

const storyService = new StoryService()

/**
 * Sync operations for online/offline story data
 */
export function useOfflineSync(storage: OfflineStorage) {
  const isOnline = syncService.isOnline

  // Fetch with network-first strategy
  const fetchStacksWithSync = async (userId?: string): Promise<StoryStack[]> => {
    if (isOnline) {
      try {
        const stacks = await storyService.getStoryStacks(userId)
        // Cache in IndexedDB
        for (const stack of stacks) {
          await storage.saveStack(stack)
        }
        return stacks
      } catch (error) {
        console.warn('Failed to fetch from network, using offline cache:', error)
      }
    }
    return storage.getAllStacks(userId)
  }

  const fetchStackWithSync = async (id: string): Promise<StoryStack | null> => {
    if (isOnline) {
      try {
        const stack = await storyService.getStoryStack(id)
        if (stack) {
          await storage.saveStack(stack)
        }
        return stack
      } catch (error) {
        console.warn('Failed to fetch from network, using offline cache:', error)
      }
    }
    return storage.getStack(id)
  }

  const fetchCardsWithSync = async (storyStackId: string): Promise<StoryCard[]> => {
    if (isOnline) {
      try {
        const cards = await storyService.getStoryCards(storyStackId)
        await storage.saveCards(cards)
        return cards
      } catch (error) {
        console.warn('Failed to fetch from network, using offline cache:', error)
      }
    }
    return storage.getCards(storyStackId)
  }

  const fetchChoicesWithSync = async (storyCardId: string): Promise<Choice[]> => {
    if (isOnline) {
      try {
        const choices = await storyService.getChoices(storyCardId)
        await storage.saveChoiceList(choices)
        return choices
      } catch (error) {
        console.warn('Failed to fetch from network, using offline cache:', error)
      }
    }
    return storage.getChoiceList(storyCardId)
  }

  // Online CRUD operations
  const createStackOnline = async (input: Parameters<typeof storyService.createStoryStack>[0]) => {
    const stack = await storyService.createStoryStack(input)
    await storage.saveStack(stack)
    return stack
  }

  const updateStackOnline = async (id: string, input: Parameters<typeof storyService.updateStoryStack>[1]) => {
    const stack = await storyService.updateStoryStack(id, input)
    await storage.saveStack(stack)
    return stack
  }

  const deleteStackOnline = async (id: string) => {
    await storyService.deleteStoryStack(id)
    await storage.deleteStack(id)
  }

  const createCardOnline = async (input: Parameters<typeof storyService.createStoryCard>[0]) => {
    const card = await storyService.createStoryCard(input)
    await storage.saveCards([card])
    return card
  }

  const updateCardOnline = async (id: string, input: Parameters<typeof storyService.updateStoryCard>[1]) => {
    const card = await storyService.updateStoryCard(id, input)
    await storage.saveCards([card])
    return card
  }

  const deleteCardOnline = async (id: string) => {
    await storyService.deleteStoryCard(id)
  }

  const createChoiceOnline = async (input: Parameters<typeof storyService.createChoice>[0]) => {
    const choice = await storyService.createChoice(input)
    await storage.saveChoiceList([choice])
    return choice
  }

  const updateChoiceOnline = async (id: string, input: Parameters<typeof storyService.updateChoice>[1]) => {
    const choice = await storyService.updateChoice(id, input)
    await storage.saveChoiceList([choice])
    return choice
  }

  const deleteChoiceOnline = async (id: string) => {
    await storyService.deleteChoice(id)
  }

  return {
    isOnline,
    // Fetch with sync
    fetchStacksWithSync,
    fetchStackWithSync,
    fetchCardsWithSync,
    fetchChoicesWithSync,
    // Online operations
    createStackOnline,
    updateStackOnline,
    deleteStackOnline,
    createCardOnline,
    updateCardOnline,
    deleteCardOnline,
    createChoiceOnline,
    updateChoiceOnline,
    deleteChoiceOnline,
  }
}

export type OfflineSync = ReturnType<typeof useOfflineSync>
