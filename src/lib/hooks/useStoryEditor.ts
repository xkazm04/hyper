'use client'

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { StoryService } from '@/lib/services/story/index'
import { StoryStack, StoryCard, CreateStoryCardInput, Choice } from '@/lib/types'

// Query key factory for consistent cache keys
export const storyEditorKeys = {
  all: ['storyEditor'] as const,
  story: (storyId: string) => [...storyEditorKeys.all, 'story', storyId] as const,
  data: (storyId: string) => [...storyEditorKeys.all, 'data', storyId] as const,
}

// Combined data type for parallel fetch result
interface StoryEditorData {
  story: StoryStack
  cards: StoryCard[]
  choices: Choice[]
}

// Fetch function that runs queries in parallel
async function fetchStoryEditorData(storyId: string, storyService: StoryService): Promise<StoryEditorData> {
  // Execute all fetches concurrently using Promise.all
  const [storyData, cardsData] = await Promise.all([
    storyService.getStoryStack(storyId),
    storyService.getStoryCards(storyId),
  ])

  if (!storyData) {
    throw new Error('Story not found')
  }

  // Fetch choices for all cards in parallel
  const choicePromises = cardsData.map(card => storyService.getChoices(card.id))
  const choicesArrays = await Promise.all(choicePromises)
  const allChoices = choicesArrays.flat()

  return {
    story: storyData,
    cards: cardsData,
    choices: allChoices,
  }
}

export function useStoryEditor(storyId: string) {
  const queryClient = useQueryClient()
  const storyService = new StoryService()

  // Main query that fetches all data in parallel
  const {
    data,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: storyEditorKeys.data(storyId),
    queryFn: () => fetchStoryEditorData(storyId, storyService),
    enabled: !!storyId,
  })

  // Create card mutation
  const createCardMutation = useMutation({
    mutationFn: async (input: Omit<CreateStoryCardInput, 'storyStackId'>): Promise<StoryCard> => {
      const newCard = await storyService.createStoryCard({
        ...input,
        storyStackId: storyId,
        orderIndex: data?.cards.length ?? 0,
      })
      return newCard
    },
    onSuccess: (newCard) => {
      // Optimistically update the cache with the new card
      queryClient.setQueryData<StoryEditorData>(
        storyEditorKeys.data(storyId),
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            cards: [...oldData.cards, newCard],
          }
        }
      )
    },
  })

  const createCard = useCallback(
    async (input: Omit<CreateStoryCardInput, 'storyStackId'>): Promise<StoryCard> => {
      return createCardMutation.mutateAsync(input)
    },
    [createCardMutation]
  )

  const refresh = useCallback(() => {
    refetch()
  }, [refetch])

  // Invalidate cache (useful for external updates)
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: storyEditorKeys.data(storyId) })
  }, [queryClient, storyId])

  return {
    story: data?.story ?? null,
    cards: data?.cards ?? [],
    choices: data?.choices ?? [],
    loading,
    error: error as Error | null,
    createCard,
    refresh,
    invalidateCache,
  }
}
