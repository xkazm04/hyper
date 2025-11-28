'use client'

import { useState } from 'react'
import { useAssets } from './sub_useMarketplace/useAssets'
import { useCollections } from './sub_useMarketplace/useCollections'
import { useSearch } from './sub_useMarketplace/useSearch'
import { useEarnings } from './sub_useMarketplace/useEarnings'

export function useMarketplace() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assets = useAssets({ setLoading, setError })
  const collections = useCollections({ setLoading, setError })
  const search = useSearch({ setLoading, setError })
  const earnings = useEarnings({ setLoading, setError })

  return {
    loading,
    error,
    // Search
    searchAssets: search.searchAssets,
    // Assets
    getAsset: assets.getAsset,
    createAsset: assets.createAsset,
    updateAsset: assets.updateAsset,
    deleteAsset: assets.deleteAsset,
    submitForReview: assets.submitForReview,
    downloadAsset: assets.downloadAsset,
    getMyAssets: assets.getMyAssets,
    // Collections
    getCollections: collections.getCollections,
    getCollection: collections.getCollection,
    // Reviews
    getReviews: assets.getReviews,
    createReview: assets.createReview,
    // API Keys
    getApiKeys: assets.getApiKeys,
    createApiKey: assets.createApiKey,
    revokeApiKey: assets.revokeApiKey,
    // Earnings
    getEarnings: earnings.getEarnings,
    getPayouts: earnings.getPayouts,
    requestPayout: earnings.requestPayout,
    cancelPayout: earnings.cancelPayout,
  }
}
