'use client'

import { useRef, useCallback, useEffect } from 'react'

interface UseAutoSaveOptions {
  delay?: number
  onSave: () => Promise<void>
  onSaveComplete?: () => void
  enabled?: boolean
}

/**
 * Hook for debounced auto-save functionality
 * Triggers save after specified delay of inactivity
 */
export function useAutoSave({ delay = 500, onSave, onSaveComplete, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isSavingRef = useRef(false)
  const pendingSaveRef = useRef(false)

  const clearPendingSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
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
      // Notify that save completed successfully
      onSaveComplete?.()
    } finally {
      isSavingRef.current = false

      // If a save was requested while we were saving, do it now
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false
        triggerSave()
      }
    }
  }, [onSave, onSaveComplete, enabled])

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
  }
}

/**
 * Hook to track if a value has changed from its initial value
 */
export function useHasChanged<T>(currentValue: T, initialValue: T): boolean {
  return currentValue !== initialValue
}
