'use client'

import { useCallback } from 'react'
import { MarketplaceSearchOptions, MarketplaceSearchResult } from '@/lib/types'

interface UseSearchOptions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useSearch({ setLoading, setError }: UseSearchOptions) {
  // Search assets
  const searchAssets = useCallback(async (
    options: MarketplaceSearchOptions = {}
  ): Promise<MarketplaceSearchResult | null> => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (options.query) params.set('query', options.query)
      if (options.assetType) params.set('assetType', options.assetType)
      if (options.category) params.set('category', options.category)
      if (options.tags?.length) params.set('tags', options.tags.join(','))
      if (options.licenseType) params.set('licenseType', options.licenseType)
      if (options.isFree !== undefined) params.set('isFree', String(options.isFree))
      if (options.isFeatured) params.set('isFeatured', 'true')
      if (options.isCurated) params.set('isCurated', 'true')
      if (options.sortBy) params.set('sortBy', options.sortBy)
      if (options.sortOrder) params.set('sortOrder', options.sortOrder)
      if (options.page) params.set('page', String(options.page))
      if (options.pageSize) params.set('pageSize', String(options.pageSize))

      const response = await fetch(`/api/marketplace/assets?${params}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to search assets')
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search assets')
      return null
    } finally {
      setLoading(false)
    }
  }, [setLoading, setError])

  return {
    searchAssets,
  }
}
