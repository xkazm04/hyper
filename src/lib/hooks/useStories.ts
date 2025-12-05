'use client'

import { useState, useEffect, useCallback } from 'react'
import { StoryService } from '@/lib/services/story/index'
import { StoryStack, CreateStoryStackInput, UpdateStoryStackInput } from '@/lib/types'
import { useAuth } from '@/lib/auth/AuthContext'

export function useStories() {
  const { user } = useAuth()
  const [stories, setStories] = useState<StoryStack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const storyService = new StoryService()

  const loadStories = useCallback(async () => {
    if (!user) {
      setStories([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await storyService.getStoryStacks(user.id)
      setStories(data)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to load stories:', err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadStories()
  }, [loadStories])

  const createStory = async (input: CreateStoryStackInput): Promise<StoryStack> => {
    try {
      const newStory = await storyService.createStoryStack(input)
      setStories(prev => [newStory, ...prev])
      return newStory
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const updateStory = async (id: string, input: UpdateStoryStackInput): Promise<StoryStack> => {
    try {
      const updatedStory = await storyService.updateStoryStack(id, input)
      setStories(prev => prev.map(s => s.id === id ? updatedStory : s))
      return updatedStory
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const deleteStory = async (id: string): Promise<void> => {
    try {
      await storyService.deleteStoryStack(id)
      setStories(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      setError(err as Error)
      throw err
    }
  }

  const refresh = () => {
    loadStories()
  }

  return {
    stories,
    loading,
    error,
    createStory,
    updateStory,
    deleteStory,
    refresh,
  }
}
