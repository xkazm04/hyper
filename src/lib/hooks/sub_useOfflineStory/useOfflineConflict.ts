'use client'

import { v4 as uuidv4 } from 'uuid'
import {
  StoryStack,
  StoryCard,
  Choice,
  CreateStoryStackInput,
  CreateStoryCardInput,
  CreateChoiceInput,
} from '@/lib/types'
import { OfflineStorage } from './useOfflineStorage'

/**
 * Conflict resolution and offline entity creation
 * Handles creating temporary entities when offline
 */
export function useOfflineConflict(storage: OfflineStorage) {
  // Create temporary story stack for offline use
  const createTempStack = async (input: CreateStoryStackInput): Promise<StoryStack> => {
    const tempId = uuidv4()
    const tempStack: StoryStack = {
      id: tempId,
      ownerId: '', // Will be set on sync
      name: input.name,
      description: input.description || null,
      isPublished: false,
      publishedAt: null,
      slug: null,
      firstCardId: null,
      artStyleId: null,
      customArtStylePrompt: null,
      artStyleSource: 'preset',
      extractedStyleImageUrl: null,
      previewTheme: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await storage.saveStack(tempStack)
    return tempStack
  }

  // Create temporary story card for offline use
  const createTempCard = async (
    input: CreateStoryCardInput,
    existingCards: StoryCard[]
  ): Promise<StoryCard> => {
    const tempId = uuidv4()

    // Calculate order index
    let orderIndex = input.orderIndex || 0
    if (orderIndex === 0 && existingCards.length > 0) {
      orderIndex = Math.max(...existingCards.map(c => c.orderIndex)) + 1
    }

    const tempCard: StoryCard = {
      id: tempId,
      storyStackId: input.storyStackId,
      title: input.title || 'Untitled Card',
      content: input.content || '',
      script: '',
      imageUrl: input.imageUrl || null,
      imagePrompt: input.imagePrompt || null,
      message: input.message || null,
      speaker: input.speaker || null,
      speakerType: input.speakerType || null,
      orderIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await storage.saveCards([tempCard])
    return tempCard
  }

  // Create temporary choice for offline use
  const createTempChoice = async (
    input: CreateChoiceInput,
    existingChoices: Choice[]
  ): Promise<Choice> => {
    const tempId = uuidv4()

    // Calculate order index
    let orderIndex = input.orderIndex || 0
    if (orderIndex === 0 && existingChoices.length > 0) {
      orderIndex = Math.max(...existingChoices.map(c => c.orderIndex)) + 1
    }

    const tempChoice: Choice = {
      id: tempId,
      storyCardId: input.storyCardId,
      label: input.label,
      targetCardId: input.targetCardId,
      orderIndex,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await storage.saveChoiceList([tempChoice])
    return tempChoice
  }

  // Update existing entity offline
  const updateStackOffline = async (
    id: string,
    input: Partial<StoryStack>
  ): Promise<StoryStack | null> => {
    const existing = await storage.getStack(id)
    if (existing) {
      const updated: StoryStack = {
        ...existing,
        ...input,
        updatedAt: new Date().toISOString(),
      }
      await storage.saveStack(updated)
      return updated
    }
    return null
  }

  const updateCardOffline = async (
    id: string,
    storyStackId: string,
    input: Partial<StoryCard>
  ): Promise<StoryCard | null> => {
    const cards = await storage.getCards(storyStackId)
    const existing = cards.find(c => c.id === id)
    if (existing) {
      const updated: StoryCard = {
        ...existing,
        ...input,
        updatedAt: new Date().toISOString(),
      }
      await storage.saveCards([updated])
      return updated
    }
    return null
  }

  const updateChoiceOffline = async (
    id: string,
    storyCardId: string,
    input: Partial<Choice>
  ): Promise<Choice | null> => {
    const choices = await storage.getChoiceList(storyCardId)
    const existing = choices.find(c => c.id === id)
    if (existing) {
      const updated: Choice = {
        ...existing,
        ...input,
        updatedAt: new Date().toISOString(),
      }
      await storage.saveChoiceList([updated])
      return updated
    }
    return null
  }

  return {
    // Temp entity creation
    createTempStack,
    createTempCard,
    createTempChoice,
    // Offline updates
    updateStackOffline,
    updateCardOffline,
    updateChoiceOffline,
  }
}

export type OfflineConflict = ReturnType<typeof useOfflineConflict>
