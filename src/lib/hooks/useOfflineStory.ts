'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { v4 as uuidv4 } from 'uuid'
import { StoryService } from '@/lib/services/story'
import { syncService } from '@/lib/services/sync'
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
import {
  StoryStack,
  StoryCard,
  Choice,
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
} from '@/lib/types'

// Query keys
export const storyKeys = {
  all: ['stories'] as const,
  lists: () => [...storyKeys.all, 'list'] as const,
  list: (filters: string) => [...storyKeys.lists(), { filters }] as const,
  details: () => [...storyKeys.all, 'detail'] as const,
  detail: (id: string) => [...storyKeys.details(), id] as const,
  cards: (stackId: string) => [...storyKeys.detail(stackId), 'cards'] as const,
  choices: (cardId: string) => ['choices', cardId] as const,
  allChoices: (stackId: string) => [...storyKeys.detail(stackId), 'allChoices'] as const,
}

const storyService = new StoryService()

// =============================================================================
// Story Stack Hooks
// =============================================================================

/**
 * Hook to fetch all story stacks with offline support
 */
export function useStoryStacks(userId?: string) {
  return useQuery({
    queryKey: storyKeys.list(userId || 'all'),
    queryFn: async () => {
      // Try to get from network first
      if (syncService.isOnline) {
        try {
          const stacks = await storyService.getStoryStacks(userId)

          // Cache in IndexedDB
          if (isIndexedDBAvailable()) {
            for (const stack of stacks) {
              await saveStoryStack(stack)
            }
          }

          return stacks
        } catch (error) {
          // Fall through to offline cache
          console.warn('Failed to fetch from network, using offline cache:', error)
        }
      }

      // Fall back to IndexedDB
      if (isIndexedDBAvailable()) {
        return getAllStoryStacksFromDB(userId)
      }

      return []
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch a single story stack with offline support
 */
export function useStoryStack(id: string) {
  return useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: async () => {
      // Try to get from network first
      if (syncService.isOnline) {
        try {
          const stack = await storyService.getStoryStack(id)

          // Cache in IndexedDB
          if (stack && isIndexedDBAvailable()) {
            await saveStoryStack(stack)
          }

          return stack
        } catch (error) {
          console.warn('Failed to fetch from network, using offline cache:', error)
        }
      }

      // Fall back to IndexedDB
      if (isIndexedDBAvailable()) {
        return getStoryStackFromDB(id) || null
      }

      return null
    },
    enabled: !!id,
  })
}

/**
 * Hook to create a story stack with offline support
 */
export function useCreateStoryStack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateStoryStackInput) => {
      if (syncService.isOnline) {
        // Create online
        const stack = await storyService.createStoryStack(input)

        // Cache in IndexedDB
        if (isIndexedDBAvailable()) {
          await saveStoryStack(stack)
        }

        return stack
      }

      // Create offline with temp ID
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save to IndexedDB
      if (isIndexedDBAvailable()) {
        await saveStoryStack(tempStack)
        await syncService.queueStoryStackCreate(input, tempId)
      }

      return tempStack
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
    },
  })
}

/**
 * Hook to update a story stack with offline support
 */
export function useUpdateStoryStack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStoryStackInput }) => {
      if (syncService.isOnline) {
        // Update online
        const stack = await storyService.updateStoryStack(id, input)

        // Cache in IndexedDB
        if (isIndexedDBAvailable()) {
          await saveStoryStack(stack)
        }

        return stack
      }

      // Update offline
      if (isIndexedDBAvailable()) {
        const existing = await getStoryStackFromDB(id)
        if (existing) {
          const updated: StoryStack = {
            ...existing,
            ...input,
            updatedAt: new Date().toISOString(),
          }
          await saveStoryStack(updated)
          await syncService.queueStoryStackUpdate(id, input)
          return updated
        }
      }

      throw new Error('Story stack not found')
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
    },
  })
}

/**
 * Hook to delete a story stack with offline support
 */
export function useDeleteStoryStack() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (syncService.isOnline) {
        // Delete online
        await storyService.deleteStoryStack(id)
      } else {
        // Queue for sync
        await syncService.queueStoryStackDelete(id)
      }

      // Delete from IndexedDB
      if (isIndexedDBAvailable()) {
        await deleteStoryStackFromDB(id)
        await deleteStoryCardsForStack(id)
      }

      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: storyKeys.lists() })
    },
  })
}

// =============================================================================
// Story Card Hooks
// =============================================================================

/**
 * Hook to fetch story cards with offline support
 */
export function useStoryCards(storyStackId: string) {
  return useQuery({
    queryKey: storyKeys.cards(storyStackId),
    queryFn: async () => {
      // Try to get from network first
      if (syncService.isOnline) {
        try {
          const cards = await storyService.getStoryCards(storyStackId)

          // Cache in IndexedDB
          if (isIndexedDBAvailable()) {
            await saveStoryCards(cards)
          }

          return cards
        } catch (error) {
          console.warn('Failed to fetch from network, using offline cache:', error)
        }
      }

      // Fall back to IndexedDB
      if (isIndexedDBAvailable()) {
        return getStoryCardsFromDB(storyStackId)
      }

      return []
    },
    enabled: !!storyStackId,
  })
}

/**
 * Hook to create a story card with offline support
 */
export function useCreateStoryCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateStoryCardInput) => {
      if (syncService.isOnline) {
        // Create online
        const card = await storyService.createStoryCard(input)

        // Cache in IndexedDB
        if (isIndexedDBAvailable()) {
          await saveStoryCards([card])
        }

        return card
      }

      // Create offline with temp ID
      const tempId = uuidv4()

      // Get max order index from cache
      let orderIndex = input.orderIndex || 0
      if (orderIndex === 0 && isIndexedDBAvailable()) {
        const existingCards = await getStoryCardsFromDB(input.storyStackId)
        orderIndex = existingCards.length > 0
          ? Math.max(...existingCards.map(c => c.orderIndex)) + 1
          : 0
      }

      const tempCard: StoryCard = {
        id: tempId,
        storyStackId: input.storyStackId,
        title: input.title || 'Untitled Card',
        content: input.content || '',
        script: '',
        imageUrl: input.imageUrl || null,
        imagePrompt: input.imagePrompt || null,
        orderIndex,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save to IndexedDB
      if (isIndexedDBAvailable()) {
        await saveStoryCards([tempCard])
        await syncService.queueStoryCardCreate(input, tempId)
      }

      return tempCard
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.cards(data.storyStackId) })
    },
  })
}

/**
 * Hook to update a story card with offline support
 */
export function useUpdateStoryCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, storyStackId, input }: {
      id: string
      storyStackId: string
      input: UpdateStoryCardInput
    }) => {
      if (syncService.isOnline) {
        // Update online
        const card = await storyService.updateStoryCard(id, input)

        // Cache in IndexedDB
        if (isIndexedDBAvailable()) {
          await saveStoryCards([card])
        }

        return card
      }

      // Update offline
      if (isIndexedDBAvailable()) {
        const cards = await getStoryCardsFromDB(storyStackId)
        const existing = cards.find(c => c.id === id)
        if (existing) {
          const updated: StoryCard = {
            ...existing,
            ...input,
            updatedAt: new Date().toISOString(),
          }
          await saveStoryCards([updated])
          await syncService.queueStoryCardUpdate(id, input)
          return updated
        }
      }

      throw new Error('Story card not found')
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.cards(data.storyStackId) })
    },
  })
}

/**
 * Hook to delete a story card with offline support
 */
export function useDeleteStoryCard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, storyStackId }: { id: string; storyStackId: string }) => {
      if (syncService.isOnline) {
        // Delete online
        await storyService.deleteStoryCard(id)
      } else {
        // Queue for sync
        await syncService.queueStoryCardDelete(id)
      }

      // Delete from IndexedDB
      if (isIndexedDBAvailable()) {
        await deleteStoryCardFromDB(id)
        await deleteChoicesForCard(id)
      }

      return { id, storyStackId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.cards(data.storyStackId) })
    },
  })
}

// =============================================================================
// Choice Hooks
// =============================================================================

/**
 * Hook to fetch choices for a card with offline support
 */
export function useChoices(storyCardId: string) {
  return useQuery({
    queryKey: storyKeys.choices(storyCardId),
    queryFn: async () => {
      // Try to get from network first
      if (syncService.isOnline) {
        try {
          const choices = await storyService.getChoices(storyCardId)

          // Cache in IndexedDB
          if (isIndexedDBAvailable()) {
            await saveChoices(choices)
          }

          return choices
        } catch (error) {
          console.warn('Failed to fetch from network, using offline cache:', error)
        }
      }

      // Fall back to IndexedDB
      if (isIndexedDBAvailable()) {
        return getChoicesFromDB(storyCardId)
      }

      return []
    },
    enabled: !!storyCardId,
  })
}

/**
 * Hook to fetch all choices for a stack with offline support
 */
export function useAllChoicesForStack(storyStackId: string) {
  return useQuery({
    queryKey: storyKeys.allChoices(storyStackId),
    queryFn: async () => {
      if (isIndexedDBAvailable()) {
        return getAllChoicesForStack(storyStackId)
      }
      return []
    },
    enabled: !!storyStackId,
  })
}

/**
 * Hook to create a choice with offline support
 */
export function useCreateChoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateChoiceInput) => {
      if (syncService.isOnline) {
        // Create online
        const choice = await storyService.createChoice(input)

        // Cache in IndexedDB
        if (isIndexedDBAvailable()) {
          await saveChoices([choice])
        }

        return choice
      }

      // Create offline with temp ID
      const tempId = uuidv4()

      // Get max order index from cache
      let orderIndex = input.orderIndex || 0
      if (orderIndex === 0 && isIndexedDBAvailable()) {
        const existingChoices = await getChoicesFromDB(input.storyCardId)
        orderIndex = existingChoices.length > 0
          ? Math.max(...existingChoices.map(c => c.orderIndex)) + 1
          : 0
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

      // Save to IndexedDB
      if (isIndexedDBAvailable()) {
        await saveChoices([tempChoice])
        await syncService.queueChoiceCreate(input, tempId)
      }

      return tempChoice
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.choices(data.storyCardId) })
    },
  })
}

/**
 * Hook to update a choice with offline support
 */
export function useUpdateChoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, storyCardId, input }: {
      id: string
      storyCardId: string
      input: UpdateChoiceInput
    }) => {
      if (syncService.isOnline) {
        // Update online
        const choice = await storyService.updateChoice(id, input)

        // Cache in IndexedDB
        if (isIndexedDBAvailable()) {
          await saveChoices([choice])
        }

        return choice
      }

      // Update offline
      if (isIndexedDBAvailable()) {
        const choices = await getChoicesFromDB(storyCardId)
        const existing = choices.find(c => c.id === id)
        if (existing) {
          const updated: Choice = {
            ...existing,
            ...input,
            updatedAt: new Date().toISOString(),
          }
          await saveChoices([updated])
          await syncService.queueChoiceUpdate(id, input)
          return updated
        }
      }

      throw new Error('Choice not found')
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.choices(data.storyCardId) })
    },
  })
}

/**
 * Hook to delete a choice with offline support
 */
export function useDeleteChoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, storyCardId }: { id: string; storyCardId: string }) => {
      if (syncService.isOnline) {
        // Delete online
        await storyService.deleteChoice(id)
      } else {
        // Queue for sync
        await syncService.queueChoiceDelete(id)
      }

      // Delete from IndexedDB
      if (isIndexedDBAvailable()) {
        await deleteChoiceFromDB(id)
      }

      return { id, storyCardId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.choices(data.storyCardId) })
    },
  })
}
