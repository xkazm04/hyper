'use client'

import { useCallback } from 'react'
import { AssetReview, MarketplaceApiKey } from '@/lib/types'

interface UseAssetReviewsOptions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useAssetReviews({ setLoading, setError }: UseAssetReviewsOptions) {
  const getReviews = useCallback(async (assetId: string): Promise<AssetReview[]> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/assets/${assetId}/reviews`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch reviews')
      return data.reviews
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch reviews'); return [] }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const createReview = useCallback(async (assetId: string, rating: number, reviewText?: string): Promise<AssetReview | null> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/assets/${assetId}/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, reviewText }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create review')
      return data.review
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create review'); return null }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const getApiKeys = useCallback(async (): Promise<MarketplaceApiKey[]> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/marketplace/api-keys')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch API keys')
      return data.apiKeys
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch API keys'); return [] }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const createApiKey = useCallback(async (name: string, scopes?: string[], rateLimit?: number): Promise<{ apiKey: MarketplaceApiKey; rawKey: string } | null> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/marketplace/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, scopes, rateLimit }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create API key')
      return { apiKey: data.apiKey, rawKey: data.rawKey }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create API key'); return null }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const revokeApiKey = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/api-keys/${id}`, { method: 'DELETE' })
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to revoke API key') }
      return true
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to revoke API key'); return false }
    finally { setLoading(false) }
  }, [setLoading, setError])

  return { getReviews, createReview, getApiKeys, createApiKey, revokeApiKey }
}
