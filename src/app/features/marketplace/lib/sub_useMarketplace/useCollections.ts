'use client'

import { useCallback } from 'react'
import { CharacterAsset, CuratedCollection } from '@/lib/types'

interface UseCollectionsOptions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useCollections({ setLoading, setError }: UseCollectionsOptions) {
  // Get collections
  const getCollections = useCallback(async (): Promise<CuratedCollection[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/marketplace/collections')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch collections')
      return data.collections
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collections')
      return []
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  // Get collection by slug
  const getCollection = useCallback(async (
    slug: string
  ): Promise<{ collection: CuratedCollection; assets: CharacterAsset[] } | null> => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/marketplace/collections/${slug}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch collection')
      return { collection: data.collection, assets: data.assets }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch collection')
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  return {
    getCollections,
    getCollection,
  }
}
