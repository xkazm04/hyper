'use client'

import { useAssetCrud } from './useAssetCrud'
import { useAssetReviews } from './useAssetReviews'

interface UseAssetsOptions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useAssets({ setLoading, setError }: UseAssetsOptions) {
  const crud = useAssetCrud({ setLoading, setError })
  const reviews = useAssetReviews({ setLoading, setError })

  return {
    ...crud,
    ...reviews,
  }
}
