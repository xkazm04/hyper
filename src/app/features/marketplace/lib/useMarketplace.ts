'use client'

import { useCallback } from 'react'
import {
  CharacterAsset,
  CreateCharacterAssetInput,
  UpdateCharacterAssetInput,
  CuratedCollection,
  MarketplaceSearchOptions,
  MarketplaceSearchResult,
  CreatorBalance,
  CreatorEarning,
  PayoutRequest,
  AssetReview,
  MarketplaceApiKey,
} from '@/lib/types'
import { useMarketplaceApi } from './useMarketplaceApi'

// ─────────────────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────────────────

interface AssetResponse {
  asset: CharacterAsset
}

interface AssetsResponse {
  assets: CharacterAsset[]
}

interface CollectionsResponse {
  collections: CuratedCollection[]
}

interface CollectionResponse {
  collection: CuratedCollection
  assets: CharacterAsset[]
}

interface ReviewsResponse {
  reviews: AssetReview[]
}

interface ReviewResponse {
  review: AssetReview
}

interface ApiKeysResponse {
  apiKeys: MarketplaceApiKey[]
}

interface CreateApiKeyResponse {
  apiKey: MarketplaceApiKey
  rawKey: string
}

interface EarningsResponse {
  earnings: CreatorEarning[]
  balance: CreatorBalance
}

interface PayoutsResponse {
  payouts: PayoutRequest[]
}

interface PayoutResponse {
  payout: PayoutRequest
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build search params from MarketplaceSearchOptions
 */
function buildSearchParams(
  options: MarketplaceSearchOptions
): Record<string, string | number | boolean | undefined> {
  return {
    query: options.query,
    assetType: options.assetType,
    category: options.category,
    tags: options.tags?.join(','),
    licenseType: options.licenseType,
    isFree: options.isFree,
    isFeatured: options.isFeatured ? true : undefined,
    isCurated: options.isCurated ? true : undefined,
    sortBy: options.sortBy,
    sortOrder: options.sortOrder,
    page: options.page,
    pageSize: options.pageSize,
  }
}

/**
 * Unified marketplace hook that provides all CRUD operations for assets,
 * collections, search, reviews, API keys, and earnings.
 *
 * Uses the centralized useMarketplaceApi hook for consistent fetch logic,
 * error handling, and loading state management.
 */
export function useMarketplace() {
  const { loading, error, get, post, patch, del } = useMarketplaceApi()

  // ─────────────────────────────────────────────────────────────────────────────
  // ASSET CRUD OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const getAsset = useCallback(
    async (id: string): Promise<CharacterAsset | null> => {
      const { data } = await get<AssetResponse>(`/api/marketplace/assets/${id}`, {
        errorMessage: 'Failed to fetch asset',
      })
      return data?.asset ?? null
    },
    [get]
  )

  const createAsset = useCallback(
    async (input: CreateCharacterAssetInput): Promise<CharacterAsset | null> => {
      const { data } = await post<AssetResponse, CreateCharacterAssetInput>(
        '/api/marketplace/assets',
        input,
        { errorMessage: 'Failed to create asset' }
      )
      return data?.asset ?? null
    },
    [post]
  )

  const updateAsset = useCallback(
    async (id: string, input: UpdateCharacterAssetInput): Promise<CharacterAsset | null> => {
      const { data } = await patch<AssetResponse, UpdateCharacterAssetInput>(
        `/api/marketplace/assets/${id}`,
        input,
        { errorMessage: 'Failed to update asset' }
      )
      return data?.asset ?? null
    },
    [patch]
  )

  const deleteAsset = useCallback(
    async (id: string): Promise<boolean> => {
      const { success } = await del(`/api/marketplace/assets/${id}`, {
        errorMessage: 'Failed to delete asset',
      })
      return success
    },
    [del]
  )

  const submitForReview = useCallback(
    async (id: string): Promise<CharacterAsset | null> => {
      const { data } = await post<AssetResponse>(`/api/marketplace/assets/${id}/submit`, undefined, {
        errorMessage: 'Failed to submit for review',
      })
      return data?.asset ?? null
    },
    [post]
  )

  const downloadAsset = useCallback(
    async (id: string, storyStackId?: string): Promise<CharacterAsset | null> => {
      const { data } = await post<AssetResponse>(
        `/api/marketplace/assets/${id}/download`,
        { storyStackId },
        { errorMessage: 'Failed to download asset' }
      )
      return data?.asset ?? null
    },
    [post]
  )

  const getMyAssets = useCallback(async (): Promise<CharacterAsset[]> => {
    const { data } = await get<AssetsResponse>('/api/marketplace/my-assets', {
      errorMessage: 'Failed to fetch your assets',
    })
    return data?.assets ?? []
  }, [get])

  // ─────────────────────────────────────────────────────────────────────────────
  // SEARCH OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const searchAssets = useCallback(
    async (options: MarketplaceSearchOptions = {}): Promise<MarketplaceSearchResult | null> => {
      const { data } = await get<MarketplaceSearchResult>('/api/marketplace/assets', {
        params: buildSearchParams(options),
        errorMessage: 'Failed to search assets',
      })
      return data
    },
    [get]
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // COLLECTION OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const getCollections = useCallback(async (): Promise<CuratedCollection[]> => {
    const { data } = await get<CollectionsResponse>('/api/marketplace/collections', {
      errorMessage: 'Failed to fetch collections',
    })
    return data?.collections ?? []
  }, [get])

  const getCollection = useCallback(
    async (
      slug: string
    ): Promise<{ collection: CuratedCollection; assets: CharacterAsset[] } | null> => {
      const { data } = await get<CollectionResponse>(`/api/marketplace/collections/${slug}`, {
        errorMessage: 'Failed to fetch collection',
      })
      if (!data) return null
      return { collection: data.collection, assets: data.assets }
    },
    [get]
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // REVIEW OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const getReviews = useCallback(
    async (assetId: string): Promise<AssetReview[]> => {
      const { data } = await get<ReviewsResponse>(`/api/marketplace/assets/${assetId}/reviews`, {
        errorMessage: 'Failed to fetch reviews',
      })
      return data?.reviews ?? []
    },
    [get]
  )

  const createReview = useCallback(
    async (assetId: string, rating: number, reviewText?: string): Promise<AssetReview | null> => {
      const { data } = await post<ReviewResponse>(
        `/api/marketplace/assets/${assetId}/reviews`,
        { rating, reviewText },
        { errorMessage: 'Failed to create review' }
      )
      return data?.review ?? null
    },
    [post]
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // API KEY OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const getApiKeys = useCallback(async (): Promise<MarketplaceApiKey[]> => {
    const { data } = await get<ApiKeysResponse>('/api/marketplace/api-keys', {
      errorMessage: 'Failed to fetch API keys',
    })
    return data?.apiKeys ?? []
  }, [get])

  const createApiKey = useCallback(
    async (
      name: string,
      scopes?: string[],
      rateLimit?: number
    ): Promise<{ apiKey: MarketplaceApiKey; rawKey: string } | null> => {
      const { data } = await post<CreateApiKeyResponse>(
        '/api/marketplace/api-keys',
        { name, scopes, rateLimit },
        { errorMessage: 'Failed to create API key' }
      )
      if (!data) return null
      return { apiKey: data.apiKey, rawKey: data.rawKey }
    },
    [post]
  )

  const revokeApiKey = useCallback(
    async (id: string): Promise<boolean> => {
      const { success } = await del(`/api/marketplace/api-keys/${id}`, {
        errorMessage: 'Failed to revoke API key',
      })
      return success
    },
    [del]
  )

  // ─────────────────────────────────────────────────────────────────────────────
  // EARNINGS OPERATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const getEarnings = useCallback(async (): Promise<{
    earnings: CreatorEarning[]
    balance: CreatorBalance
  } | null> => {
    const { data } = await get<EarningsResponse>('/api/marketplace/earnings', {
      errorMessage: 'Failed to fetch earnings',
    })
    if (!data) return null
    return { earnings: data.earnings, balance: data.balance }
  }, [get])

  const getPayouts = useCallback(async (): Promise<PayoutRequest[]> => {
    const { data } = await get<PayoutsResponse>('/api/marketplace/payouts', {
      errorMessage: 'Failed to fetch payouts',
    })
    return data?.payouts ?? []
  }, [get])

  const requestPayout = useCallback(
    async (
      amount: number,
      payoutMethod: string,
      payoutDetails?: Record<string, unknown>
    ): Promise<PayoutRequest | null> => {
      const { data } = await post<PayoutResponse>(
        '/api/marketplace/payouts',
        { amount, payoutMethod, payoutDetails },
        { errorMessage: 'Failed to request payout' }
      )
      return data?.payout ?? null
    },
    [post]
  )

  const cancelPayout = useCallback(
    async (id: string): Promise<boolean> => {
      const { success } = await del(`/api/marketplace/payouts/${id}`, {
        errorMessage: 'Failed to cancel payout',
      })
      return success
    },
    [del]
  )

  return {
    // State
    loading,
    error,

    // Assets
    getAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    submitForReview,
    downloadAsset,
    getMyAssets,

    // Search
    searchAssets,

    // Collections
    getCollections,
    getCollection,

    // Reviews
    getReviews,
    createReview,

    // API Keys
    getApiKeys,
    createApiKey,
    revokeApiKey,

    // Earnings
    getEarnings,
    getPayouts,
    requestPayout,
    cancelPayout,
  }
}
