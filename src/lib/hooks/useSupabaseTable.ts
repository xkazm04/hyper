'use client'

import {
  useTableQuery,
  useTableMutation,
  useTableItemQuery,
  CRUDService,
} from './sub_useSupabaseTable'

// Re-export types for backward compatibility
export type { CRUDService } from './sub_useSupabaseTable'

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
 * Composes useTableQuery and useTableMutation sub-hooks
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

  // Use query sub-hook for data fetching
  const query = useTableQuery(service, { autoLoad })

  // Use mutation sub-hook for CRUD operations
  const mutation = useTableMutation(service, query.data, query.setData, {
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
  })

  // Combine errors from both hooks
  const error = query.error || mutation.error

  const clearError = () => {
    query.clearError()
    mutation.setError(null)
  }

  return {
    data: query.data,
    loading: query.loading,
    error,
    create: mutation.create,
    update: mutation.update,
    deleteItem: mutation.deleteItem,
    refresh: query.refresh,
    clearError,
    isCreating: mutation.isCreating,
    isUpdating: mutation.isUpdating,
    isDeleting: mutation.isDeleting,
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
  return useTableItemQuery(service, id)
}
