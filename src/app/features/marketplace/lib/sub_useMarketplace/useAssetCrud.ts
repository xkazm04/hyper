'use client'

import { useCallback } from 'react'
import { CharacterAsset, CreateCharacterAssetInput, UpdateCharacterAssetInput } from '@/lib/types'

interface UseAssetCrudOptions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export function useAssetCrud({ setLoading, setError }: UseAssetCrudOptions) {
  const getAsset = useCallback(async (id: string): Promise<CharacterAsset | null> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/assets/${id}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch asset')
      return data.asset
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch asset'); return null }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const createAsset = useCallback(async (input: CreateCharacterAssetInput): Promise<CharacterAsset | null> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/marketplace/assets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create asset')
      return data.asset
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create asset'); return null }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const updateAsset = useCallback(async (id: string, input: UpdateCharacterAssetInput): Promise<CharacterAsset | null> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/assets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update asset')
      return data.asset
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to update asset'); return null }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const deleteAsset = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/assets/${id}`, { method: 'DELETE' })
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Failed to delete asset') }
      return true
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete asset'); return false }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const submitForReview = useCallback(async (id: string): Promise<CharacterAsset | null> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/assets/${id}/submit`, { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to submit for review')
      return data.asset
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to submit for review'); return null }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const downloadAsset = useCallback(async (id: string, storyStackId?: string): Promise<CharacterAsset | null> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch(`/api/marketplace/assets/${id}/download`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storyStackId }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to download asset')
      return data.asset
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to download asset'); return null }
    finally { setLoading(false) }
  }, [setLoading, setError])

  const getMyAssets = useCallback(async (): Promise<CharacterAsset[]> => {
    setLoading(true); setError(null)
    try {
      const response = await fetch('/api/marketplace/my-assets')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch your assets')
      return data.assets
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to fetch your assets'); return [] }
    finally { setLoading(false) }
  }, [setLoading, setError])

  return { getAsset, createAsset, updateAsset, deleteAsset, submitForReview, downloadAsset, getMyAssets }
}
