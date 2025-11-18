'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/lib/utils/toast'

/**
 * Base interface that all service classes should implement
 */
export interface CRUDService<T, TCreate, TUpdate> {
  getAll?: () => Promise<T[]>
  getOne?: (id: string) => Promise<T>
  create?: (input: TCreate) => Promise<T>
  update?: (id: string, input: TUpdate) => Promise<T>
  delete?: (id: string) => Promise<void>
}

export interface UseSupabaseTableOptions<T> {
  autoLoad?: boolean
  optimisticCreate?: (input: any) => Partial<T>
  optimisticUpdate?: boolean
  optimisticDelete?: boolean
}

export interface UseSupabaseTableResult<T, TCreate, TUpdate> {
  data: T[]
  loading: boolean
  error: string | null
  create: (input: TCreate) => Promise<T>
  update: (id: string, input: TUpdate) => Promise<T>
  deleteItem: (id: string) => Promise<void>
  refresh: () => Promise<void>
  clearError: () => void
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

/**
 * Generic hook for Supabase table operations
 *
 * @example
 * const stackService = new StackService()
 * const stacks = useSupabaseTable(stackService, {
 *   autoLoad: true,
 *   optimisticCreate: (input) => ({ id: `temp-${Date.now()}`, ...input }),
 *   optimisticDelete: true
 * })
 */
export function useSupabaseTable<T extends { id: string }, TCreate, TUpdate>(
  service: CRUDService<T, TCreate, TUpdate>,
  options: UseSupabaseTableOptions<T> = {}
): UseSupabaseTableResult<T, TCreate, TUpdate> {
  const {
    autoLoad = true,
    optimisticCreate,
    optimisticUpdate = false,
    optimisticDelete = false
  } = options

  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(autoLoad)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const create = useCallback(async (input: TCreate): Promise<T> => {
    if (!service.create) {
      throw new Error('Service does not implement create method')
    }

    // Prevent duplicate requests
    if (isCreating) {
      throw new Error('Create operation already in progress')
    }

    setIsCreating(true)

    // Optimistic update - create temporary item immediately
    let tempId: string | null = null
    let previousData: T[] = []

    if (optimisticCreate) {
      tempId = `temp-${Date.now()}`
      previousData = [...data]
      const optimisticItem = {
        id: tempId,
        ...optimisticCreate(input),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as unknown as T

      setData(prev => [optimisticItem, ...prev])
    }

    try {
      const newItem = await service.create(input)

      if (tempId) {
        // Replace temp with real item
        setData(prev => prev.map(item => item.id === tempId ? newItem : item))
      } else {
        // Add to beginning
        setData(prev => [newItem, ...prev])
      }

      setError(null)
      toast.success('Item created successfully')
      return newItem
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create item'

      // Rollback optimistic update on error
      if (tempId && previousData.length > 0) {
        setData(previousData)
      } else if (tempId) {
        setData(prev => prev.filter(item => item.id !== tempId))
      }

      setError(errorMessage)
      toast.error('Failed to create item', errorMessage)
      throw err
    } finally {
      setIsCreating(false)
    }
  }, [service, optimisticCreate, data, isCreating])

  const update = useCallback(async (id: string, input: TUpdate): Promise<T> => {
    if (!service.update) {
      throw new Error('Service does not implement update method')
    }

    // Prevent duplicate requests
    if (isUpdating) {
      throw new Error('Update operation already in progress')
    }

    setIsUpdating(true)

    // Store previous state for rollback
    const previousData = [...data]

    if (optimisticUpdate) {
      // Optimistic update - update immediately
      setData(prev => prev.map(item =>
        item.id === id
          ? { ...item, ...input, updatedAt: new Date().toISOString() } as T
          : item
      ))
    }

    try {
      const updated = await service.update(id, input)
      setData(prev => prev.map(item => item.id === id ? updated : item))
      setError(null)
      toast.success('Item updated successfully')
      return updated
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update item'

      // Rollback optimistic update on error
      setData(previousData)

      setError(errorMessage)
      toast.error('Failed to update item', errorMessage)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [service, data, optimisticUpdate, isUpdating])

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    if (!service.delete) {
      throw new Error('Service does not implement delete method')
    }

    // Prevent duplicate requests
    if (isDeleting) {
      throw new Error('Delete operation already in progress')
    }

    setIsDeleting(true)

    // Store previous state for rollback
    const previousData = [...data]

    if (optimisticDelete) {
      // Optimistic delete - remove immediately
      setData(prev => prev.filter(item => item.id !== id))
    }

    try {
      await service.delete(id)

      if (!optimisticDelete) {
        setData(prev => prev.filter(item => item.id !== id))
      }

      setError(null)
      toast.success('Item deleted successfully')
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete item'

      // Rollback optimistic delete on error
      setData(previousData)

      setError(errorMessage)
      toast.error('Failed to delete item', errorMessage)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [service, data, optimisticDelete, isDeleting])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    data,
    loading,
    error,
    create,
    update,
    deleteItem,
    refresh: loadData,
    clearError,
    isCreating,
    isUpdating,
    isDeleting,
  }
}

/**
 * Hook for fetching a single item by ID
 */
export interface UseSupabaseItemResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  clearError: () => void
}

export function useSupabaseItem<T, TCreate, TUpdate>(
  service: CRUDService<T, TCreate, TUpdate>,
  id: string | null
): UseSupabaseItemResult<T> {
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
