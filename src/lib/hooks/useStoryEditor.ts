'use client'

import { useState, useEffect, useCallback } from 'react'
import { StoryService } from '@/lib/services/story'
import { StoryStack, StoryCard, CreateStoryCardInput } from '@/lib/types'

export function useStoryEditor(storyId: string) {
  const [story, setStory] = useState<StoryStack | null>(null)
  const [cards, setCards] = useState<StoryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const storyService = new StoryService()

  const loadStoryData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load story stack
      const storyData = await storyService.getStoryStack(storyId)
      if (!storyData) {
        throw new Error('Story not found')
      }
      setStory(storyData)
      
      // Load story cards
      const cardsData = await storyService.getStoryCards(storyId)
      setCards(cardsData)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load story data:', err)
    } finally {
      setLoading(false)
    }
  }, [storyId])

  useEffect(() => {
    loadStoryData()
  }, [loadStoryData])

  const createCard = async (input: Omit<CreateStoryCardInput, 'storyStackId'>): Promise<StoryCard> => {
    try {
      const newCard = await storyService.createStoryCard({
        ...input,
        storyStackId: storyId,
        orderIndex: cards.length,
      })
      setCards(prev => [...prev, newCard])
      return newCard
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const refresh = () => {
    loadStoryData()
  }

  return {
    story,
    cards,
    loading,
    error,
    createCard,
    refresh,
  }
}
