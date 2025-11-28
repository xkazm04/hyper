'use client'

import { useState, useEffect, useCallback } from 'react'
import { CRUDService } from './types'

export interface UseTableQueryOptions {
  autoLoad?: boolean
}

export interface UseTableQueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  clearError: () => void
  setData: React.Dispatch<React.SetStateAction<T[]>>
}

/**
 * Hook for querying table data (getAll)
 */
export function useTableQuery<T extends { id: string }, TCreate, TUpdate>(
  service: CRUDService<T, TCreate, TUpdate>,
  options: UseTableQueryOptions = {}
): UseTableQueryResult<T> {
  const { autoLoad = true } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!service.getAll) {
      console.warn('Service does not implement getAll method')
      return
    }

    try {
      setLoading(true)
      const result = await service.getAll()
      setData(result)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [service])

  useEffect(() => {
    if (autoLoad) {
      loadData()
    }
  }, [autoLoad, loadData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    refresh: loadData,
    clearError,
    setData,
  }
}

export interface UseTableItemQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  clearError: () => void
}

/**
 * Hook for fetching a single item by ID
 */
export function useTableItemQuery<T, TCreate, TUpdate>(
  service: CRUDService<T, TCreate, TUpdate>,
  id: string | null
): UseTableItemQueryResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!id) {
      setData(null)
      setLoading(false)
      return
    }

    if (!service.getOne) {
      console.warn('Service does not implement getOne method')
      return
    }

    try {
      setLoading(true)
      const result = await service.getOne(id)
      setData(result)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load item')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [service, id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    refresh: loadData,
    clearError,
  }
}
