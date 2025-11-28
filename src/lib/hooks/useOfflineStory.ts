'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
} from '@/lib/types'
import {
  useOfflineStorage,
  useOfflineSync,
  useOfflineQueue,
  useOfflineConflict,
} from './sub_useOfflineStory'

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

// =============================================================================
// Story Stack Hooks
// =============================================================================

/**
 * Hook to fetch all story stacks with offline support
 */
export function useStoryStacks(userId?: string) {
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)

  return useQuery({
    queryKey: storyKeys.list(userId || 'all'),
    queryFn: () => sync.fetchStacksWithSync(userId),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to fetch a single story stack with offline support
 */
export function useStoryStack(id: string) {
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)

  return useQuery({
    queryKey: storyKeys.detail(id),
    queryFn: () => sync.fetchStackWithSync(id),
    enabled: !!id,
  })
}

/**
 * Hook to create a story stack with offline support
 */
export function useCreateStoryStack() {
  const queryClient = useQueryClient()
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()
  const conflict = useOfflineConflict(storage)

  return useMutation({
    mutationFn: async (input: CreateStoryStackInput) => {
      if (sync.isOnline) {
        return sync.createStackOnline(input)
      }

      // Create offline with temp ID
      const tempStack = await conflict.createTempStack(input)
      await queue.queueStackCreate(input, tempStack.id)
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()
  const conflict = useOfflineConflict(storage)

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateStoryStackInput }) => {
      if (sync.isOnline) {
        return sync.updateStackOnline(id, input)
      }

      // Update offline
      const updated = await conflict.updateStackOffline(id, input)
      if (updated) {
        await queue.queueStackUpdate(id, input)
        return updated
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()

  return useMutation({
    mutationFn: async (id: string) => {
      if (sync.isOnline) {
        await sync.deleteStackOnline(id)
      } else {
        await queue.queueStackDelete(id)
        await storage.deleteStack(id)
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)

  return useQuery({
    queryKey: storyKeys.cards(storyStackId),
    queryFn: () => sync.fetchCardsWithSync(storyStackId),
    enabled: !!storyStackId,
  })
}

/**
 * Hook to create a story card with offline support
 */
export function useCreateStoryCard() {
  const queryClient = useQueryClient()
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()
  const conflict = useOfflineConflict(storage)

  return useMutation({
    mutationFn: async (input: CreateStoryCardInput) => {
      if (sync.isOnline) {
        return sync.createCardOnline(input)
      }

      // Get existing cards for order calculation
      const existingCards = await storage.getCards(input.storyStackId)
      const tempCard = await conflict.createTempCard(input, existingCards)
      await queue.queueCardCreate(input, tempCard.id)
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()
  const conflict = useOfflineConflict(storage)

  return useMutation({
    mutationFn: async ({ id, storyStackId, input }: {
      id: string
      storyStackId: string
      input: UpdateStoryCardInput
    }) => {
      if (sync.isOnline) {
        return sync.updateCardOnline(id, input)
      }

      // Update offline
      const updated = await conflict.updateCardOffline(id, storyStackId, input)
      if (updated) {
        await queue.queueCardUpdate(id, input)
        return updated
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()

  return useMutation({
    mutationFn: async ({ id, storyStackId }: { id: string; storyStackId: string }) => {
      if (sync.isOnline) {
        await sync.deleteCardOnline(id)
      } else {
        await queue.queueCardDelete(id)
      }
      await storage.deleteCard(id)
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)

  return useQuery({
    queryKey: storyKeys.choices(storyCardId),
    queryFn: () => sync.fetchChoicesWithSync(storyCardId),
    enabled: !!storyCardId,
  })
}

/**
 * Hook to fetch all choices for a stack with offline support
 */
export function useAllChoicesForStack(storyStackId: string) {
  const storage = useOfflineStorage()

  return useQuery({
    queryKey: storyKeys.allChoices(storyStackId),
    queryFn: () => storage.getAllChoices(storyStackId),
    enabled: !!storyStackId,
  })
}

/**
 * Hook to create a choice with offline support
 */
export function useCreateChoice() {
  const queryClient = useQueryClient()
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()
  const conflict = useOfflineConflict(storage)

  return useMutation({
    mutationFn: async (input: CreateChoiceInput) => {
      if (sync.isOnline) {
        return sync.createChoiceOnline(input)
      }

      // Get existing choices for order calculation
      const existingChoices = await storage.getChoiceList(input.storyCardId)
      const tempChoice = await conflict.createTempChoice(input, existingChoices)
      await queue.queueChoiceCreate(input, tempChoice.id)
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()
  const conflict = useOfflineConflict(storage)

  return useMutation({
    mutationFn: async ({ id, storyCardId, input }: {
      id: string
      storyCardId: string
      input: UpdateChoiceInput
    }) => {
      if (sync.isOnline) {
        return sync.updateChoiceOnline(id, input)
      }

      // Update offline
      const updated = await conflict.updateChoiceOffline(id, storyCardId, input)
      if (updated) {
        await queue.queueChoiceUpdate(id, input)
        return updated
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
  const storage = useOfflineStorage()
  const sync = useOfflineSync(storage)
  const queue = useOfflineQueue()

  return useMutation({
    mutationFn: async ({ id, storyCardId }: { id: string; storyCardId: string }) => {
      if (sync.isOnline) {
        await sync.deleteChoiceOnline(id)
      } else {
        await queue.queueChoiceDelete(id)
      }
      await storage.deleteChoice(id)
      return { id, storyCardId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: storyKeys.choices(data.storyCardId) })
    },
  })
}
