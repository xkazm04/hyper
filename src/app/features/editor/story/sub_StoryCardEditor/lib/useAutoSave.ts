'use client'

import { useRef, useCallback, useEffect, useState } from 'react'
import { VersionConflictError } from './cardApi'

export type VersionConflictHandler = (error: VersionConflictError) => Promise<boolean>

interface UseAutoSaveOptions {
  delay?: number
  onSave: () => Promise<void>
  onSaveComplete?: () => void
  onVersionConflict?: VersionConflictHandler
  enabled?: boolean
}

export interface AutoSaveState {
  hasVersionConflict: boolean
  conflictMessage: string | null
}

/**
 * Hook for debounced auto-save functionality
 * Triggers save after specified delay of inactivity
 * Supports optimistic concurrency control with version conflict handling
 */
export function useAutoSave({
  delay = 500,
  onSave,
  onSaveComplete,
  onVersionConflict,
  enabled = true
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const pendingSaveRef = useRef(false)
  const [conflictState, setConflictState] = useState<AutoSaveState>({
    hasVersionConflict: false,
    conflictMessage: null,
  })

  const clearPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const clearConflict = useCallback(() => {
    setConflictState({ hasVersionConflict: false, conflictMessage: null })
  }, [])

  const triggerSave = useCallback(async () => {
    if (!enabled) return

    // If already saving, mark as pending
    if (isSavingRef.current) {
      pendingSaveRef.current = true
      return
    }

    isSavingRef.current = true
    try {
      await onSave()
      // Clear any previous conflict state on successful save
      setConflictState({ hasVersionConflict: false, conflictMessage: null })
      // Notify that save completed successfully
      onSaveComplete?.()
    } catch (error) {
      // Handle version conflict
      if (error instanceof VersionConflictError) {
        setConflictState({
          hasVersionConflict: true,
          conflictMessage: error.message,
        })

        // Allow the caller to handle the conflict (e.g., refresh the card)
        if (onVersionConflict) {
          const shouldRetry = await onVersionConflict(error)
          if (shouldRetry) {
            // Retry the save after conflict is resolved
            isSavingRef.current = false
            await triggerSave()
            return
          }
        }
      } else {
        // Re-throw other errors
        throw error
      }
    } finally {
      isSavingRef.current = false

      // If a save was requested while we were saving, do it now
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        triggerSave()
      }
    }
  }, [onSave, onSaveComplete, onVersionConflict, enabled])

  const scheduleSave = useCallback(() => {
    if (!enabled) return

    clearPendingSave()
    timeoutRef.current = setTimeout(triggerSave, delay)
  }, [delay, triggerSave, clearPendingSave, enabled])

  const saveImmediately = useCallback(async () => {
    if (!enabled) return

    clearPendingSave()
    await triggerSave()
  }, [triggerSave, clearPendingSave, enabled])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPendingSave()
    }
  }, [clearPendingSave])

  return {
    scheduleSave,
    saveImmediately,
    clearPendingSave,
    clearConflict,
    ...conflictState,
  }
}

/**
 * Hook to track if a value has changed from its initial value
 */
export function useHasChanged<T>(currentValue: T, initialValue: T): boolean {
  return currentValue !== initialValue
}
