'use client'

import { useState, useCallback } from 'react'
import { toast } from '@/lib/utils/toast'
import { CRUDService } from './types'

export interface UseTableMutationOptions<T> {
  optimisticCreate?: (input: any) => Partial<T>
  optimisticUpdate?: boolean
  optimisticDelete?: boolean
}

export interface UseTableMutationResult<T, TCreate, TUpdate> {
  create: (input: TCreate) => Promise<T>
  update: (id: string, input: TUpdate) => Promise<T>
  deleteItem: (id: string) => Promise<void>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
}

/**
 * Hook for table mutation operations (create, update, delete)
 */
export function useTableMutation<T extends { id: string }, TCreate, TUpdate>(
  service: CRUDService<T, TCreate, TUpdate>,
  data: T[],
  setData: React.Dispatch<React.SetStateAction<T[]>>,
  options: UseTableMutationOptions<T> = {}
): UseTableMutationResult<T, TCreate, TUpdate> {
  const {
    optimisticCreate,
    optimisticUpdate = false,
    optimisticDelete = false
  } = options

  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCallback(async (input: TCreate): Promise<T> => {
    if (!service.create) {
      throw new Error('Service does not implement create method')
    }

    if (isCreating) {
      throw new Error('Create operation already in progress')
    }

    setIsCreating(true)

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
        setData(prev => prev.map(item => item.id === tempId ? newItem : item))
      } else {
        setData(prev => [newItem, ...prev])
      }

      setError(null)
      toast.success('Item created successfully')
      return newItem
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create item'

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
  }, [service, optimisticCreate, data, isCreating, setData])

  const update = useCallback(async (id: string, input: TUpdate): Promise<T> => {
    if (!service.update) {
      throw new Error('Service does not implement update method')
    }

    if (isUpdating) {
      throw new Error('Update operation already in progress')
    }

    setIsUpdating(true)

    const previousData = [...data]

    if (optimisticUpdate) {
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
      setData(previousData)
      setError(errorMessage)
      toast.error('Failed to update item', errorMessage)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [service, data, optimisticUpdate, isUpdating, setData])

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    if (!service.delete) {
      throw new Error('Service does not implement delete method')
    }

    if (isDeleting) {
      throw new Error('Delete operation already in progress')
    }

    setIsDeleting(true)

    const previousData = [...data]

    if (optimisticDelete) {
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
      setData(previousData)
      setError(errorMessage)
      toast.error('Failed to delete item', errorMessage)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }, [service, data, optimisticDelete, isDeleting, setData])

  return {
    create,
    update,
    deleteItem,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    setError,
  }
}
