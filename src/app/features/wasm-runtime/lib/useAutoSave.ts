'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Configuration options for the useAutoSave hook
 */
export interface AutoSaveOptions<T> {
  /** Debounce delay in milliseconds (default: 500) */
  debounceMs?: number
  /** Whether to automatically restore state on mount (default: true) */
  restoreOnMount?: boolean
  /** Custom serializer function (default: JSON.stringify) */
  serialize?: (state: T) => string
  /** Custom deserializer function (default: JSON.parse) */
  deserialize?: (data: string) => T
  /** Callback when state is saved */
  onSave?: (state: T) => void
  /** Callback when state is restored */
  onRestore?: (state: T) => void
  /** Callback when an error occurs */
  onError?: (error: Error, operation: 'save' | 'restore') => void
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean
}

/**
 * Return type for the useAutoSave hook
 */
export interface AutoSaveResult<T> {
  /** Whether the initial state was restored from localStorage */
  isRestored: boolean
  /** Manually trigger a save */
  save: () => void
  /** Manually restore state from localStorage */
  restore: () => T | null
  /** Clear saved state from localStorage */
  clear: () => void
  /** Check if there is saved state */
  hasSavedState: () => boolean
  /** Get the last save timestamp */
  lastSaveTime: number | null
}

/**
 * A reusable hook for auto-saving state to localStorage
 *
 * This hook serializes state to localStorage on change and restores it on mount.
 * It provides consistent behavior for persistence across the application.
 *
 * @param key - The localStorage key to save under
 * @param state - The state object to persist
 * @param options - Configuration options
 * @returns AutoSaveResult with utilities for manual control
 *
 * @example
 * ```tsx
 * const [formData, setFormData] = useState({ name: '', email: '' })
 *
 * const { isRestored, clear } = useAutoSave('form-draft', formData, {
 *   debounceMs: 1000,
 *   onSave: () => console.log('Draft saved'),
 *   onRestore: (data) => setFormData(data),
 * })
 * ```
 */
export function useAutoSave<T>(
  key: string | null,
  state: T,
  options: AutoSaveOptions<T> = {}
): AutoSaveResult<T> {
  const {
    debounceMs = 500,
    restoreOnMount = true,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onSave,
    onRestore,
    onError,
    enabled = true,
  } = options

  const [isRestored, setIsRestored] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stateRef = useRef(state)
  const isFirstRender = useRef(true)
  const keyRef = useRef(key)

  // Keep stateRef updated
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Keep keyRef updated
  useEffect(() => {
    keyRef.current = key
  }, [key])

  /**
   * Saves the current state to localStorage
   */
  const saveToStorage = useCallback((stateToSave: T) => {
    if (!keyRef.current || !enabled) return

    try {
      const timestamp = Date.now()
      const saveData = {
        state: stateToSave,
        timestamp,
        version: 1,
      }
      localStorage.setItem(keyRef.current, serialize(saveData))
      setLastSaveTime(timestamp)
      onSave?.(stateToSave)
    } catch (error) {
      console.warn(`useAutoSave: Failed to save state for key "${keyRef.current}":`, error)
      onError?.(error instanceof Error ? error : new Error('Save failed'), 'save')
    }
  }, [enabled, serialize, onSave, onError])

  /**
   * Manually trigger a save
   */
  const save = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    saveToStorage(stateRef.current)
  }, [saveToStorage])

  /**
   * Restore state from localStorage
   */
  const restore = useCallback((): T | null => {
    if (!keyRef.current) return null

    try {
      const saved = localStorage.getItem(keyRef.current)
      if (!saved) return null

      const parsed = deserialize(saved)

      // Handle both wrapped format (with timestamp) and raw format
      const restoredState = parsed.state !== undefined ? parsed.state : parsed

      if (parsed.timestamp) {
        setLastSaveTime(parsed.timestamp)
      }

      onRestore?.(restoredState)
      setIsRestored(true)
      return restoredState
    } catch (error) {
      console.warn(`useAutoSave: Failed to restore state for key "${keyRef.current}":`, error)
      onError?.(error instanceof Error ? error : new Error('Restore failed'), 'restore')
      return null
    }
  }, [deserialize, onRestore, onError])

  /**
   * Clear saved state from localStorage
   */
  const clear = useCallback(() => {
    if (!keyRef.current) return

    try {
      localStorage.removeItem(keyRef.current)
      setLastSaveTime(null)
    } catch (error) {
      console.warn(`useAutoSave: Failed to clear state for key "${keyRef.current}":`, error)
    }
  }, [])

  /**
   * Check if there is saved state
   */
  const hasSavedState = useCallback((): boolean => {
    if (!keyRef.current) return false

    try {
      return localStorage.getItem(keyRef.current) !== null
    } catch {
      return false
    }
  }, [])

  // Restore state on mount (if enabled)
  useEffect(() => {
    if (restoreOnMount && key && enabled && isFirstRender.current) {
      restore()
    }
  }, [key, restoreOnMount, enabled, restore])

  // Auto-save on state changes (with debounce)
  useEffect(() => {
    // Skip the first render to avoid saving initial state before restore
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!key || !enabled) return

    // Clear any pending save
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Schedule a new save
    debounceTimerRef.current = setTimeout(() => {
      saveToStorage(state)
      debounceTimerRef.current = null
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [key, state, enabled, debounceMs, saveToStorage])

  // Cleanup on unmount - save immediately
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        // Perform a final save before unmount
        if (keyRef.current && enabled) {
          try {
            const timestamp = Date.now()
            const saveData = {
              state: stateRef.current,
              timestamp,
              version: 1,
            }
            localStorage.setItem(keyRef.current, serialize(saveData))
          } catch (error) {
            console.warn('useAutoSave: Failed to save on unmount:', error)
          }
        }
      }
    }
  }, [enabled, serialize])

  return {
    isRestored,
    save,
    restore,
    clear,
    hasSavedState,
    lastSaveTime,
  }
}

/**
 * A simplified version of useAutoSave that restores state into a setState function
 *
 * @param key - The localStorage key to save under
 * @param state - The current state
 * @param setState - The state setter function
 * @param options - Configuration options (without onRestore)
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0)
 * useAutoSaveState('counter', count, setCount)
 * ```
 */
export function useAutoSaveState<T>(
  key: string | null,
  state: T,
  setState: (state: T) => void,
  options: Omit<AutoSaveOptions<T>, 'onRestore'> = {}
): AutoSaveResult<T> {
  return useAutoSave(key, state, {
    ...options,
    onRestore: setState,
  })
}

export default useAutoSave
