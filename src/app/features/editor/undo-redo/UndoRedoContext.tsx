'use client'

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react'
import { useUndoRedo, UseUndoRedoReturn } from './lib/useUndoRedo'
import { UndoRedoToast } from './components/UndoRedoToast'
import { ActionType } from './lib/types'
import { useEditor, EditorSnapshot } from '@/contexts/EditorContext'
import {
  validateSnapshot,
  normalizeSnapshot,
  logSnapshotValidationErrors,
} from './lib/snapshotValidator'

interface UndoRedoContextValue extends Omit<UseUndoRedoReturn, 'undo' | 'redo'> {
  recordAction: (
    actionType: ActionType,
    affectedCard?: { id: string; title: string; imageUrl?: string | null }
  ) => void
  jumpToHistoryIndex: (index: number) => void
  // Wrapped undo/redo that apply the snapshot to the editor
  undo: () => void
  redo: () => void
}

const UndoRedoContext = createContext<UndoRedoContextValue | undefined>(undefined)

interface UndoRedoProviderProps {
  children: ReactNode
}

export function UndoRedoProvider({ children }: UndoRedoProviderProps) {
  const {
    storyCards,
    getSnapshot,
    applySnapshot: editorApplySnapshot,
  } = useEditor()

  const undoRedo = useUndoRedo()
  const isInitialized = useRef(false)

  // Track the last known good snapshot for recovery
  const lastGoodSnapshotRef = useRef<EditorSnapshot | null>(null)

  /**
   * Safely applies a snapshot after validation.
   * If the snapshot is malformed, logs the error and reverts to the last known good state.
   *
   * @param snapshot - The snapshot to validate and apply
   * @param context - Context string for error logging (e.g., "undo", "redo", "jump")
   * @returns true if the snapshot was applied successfully, false if it was discarded
   */
  const safeApplySnapshot = useCallback(
    (snapshot: EditorSnapshot, context: string): boolean => {
      // Validate the snapshot structure
      const validation = validateSnapshot(snapshot)

      if (!validation.isValid) {
        // Log the validation errors for debugging
        logSnapshotValidationErrors(validation.errors, context)

        // Attempt to recover to the last known good state
        if (lastGoodSnapshotRef.current) {
          console.warn(
            `[Undo/Redo] Discarding malformed snapshot during ${context}. ` +
            `Reverting to last known good state.`
          )
          editorApplySnapshot(lastGoodSnapshotRef.current)
        } else {
          console.error(
            `[Undo/Redo] Cannot recover from malformed snapshot during ${context}: ` +
            `No last known good state available.`
          )
        }

        return false
      }

      // Normalize the snapshot (e.g., convert arrays to Sets)
      const normalizedSnapshot = normalizeSnapshot(snapshot)

      // Apply the validated and normalized snapshot
      editorApplySnapshot(normalizedSnapshot)

      // Update the last known good snapshot
      lastGoodSnapshotRef.current = normalizedSnapshot

      return true
    },
    [editorApplySnapshot]
  )

  // Initialize state when editor data loads
  useEffect(() => {
    if (!isInitialized.current && storyCards.length > 0) {
      const snapshot = getSnapshot()
      undoRedo.initializeState(snapshot)
      // Store the initial snapshot as the first known good state
      lastGoodSnapshotRef.current = snapshot
      isInitialized.current = true
    }
  }, [storyCards, getSnapshot, undoRedo])

  const recordAction = useCallback(
    (
      actionType: ActionType,
      affectedCard?: { id: string; title: string; imageUrl?: string | null }
    ) => {
      const snapshot = getSnapshot()
      // Update the last known good snapshot when recording a valid action
      lastGoodSnapshotRef.current = snapshot
      undoRedo.pushState(snapshot, actionType, affectedCard)
    },
    [getSnapshot, undoRedo]
  )

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Z (Undo)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        // Don't override undo in text inputs/textareas
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }

        e.preventDefault()
        const result = undoRedo.undo()
        if (result) {
          safeApplySnapshot(result.snapshot, 'undo (keyboard)')
        }
      }

      // Check for Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z (Redo)
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey)
      ) {
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return
        }

        e.preventDefault()
        const result = undoRedo.redo()
        if (result) {
          safeApplySnapshot(result.snapshot, 'redo (keyboard)')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undoRedo, safeApplySnapshot])

  const handleJumpToState = useCallback(() => {
    // Jump to the last affected card if available
    if (undoRedo.lastAction?.affectedCardId) {
      const snapshot = getSnapshot()
      editorApplySnapshot({
        ...snapshot,
        currentCardId: undoRedo.lastAction.affectedCardId,
      })
    }
  }, [undoRedo.lastAction, getSnapshot, editorApplySnapshot])

  // Jump to a specific history index and apply the snapshot
  const jumpToHistoryIndex = useCallback((index: number) => {
    const snapshot = undoRedo.jumpToIndex(index)
    if (snapshot) {
      safeApplySnapshot(snapshot, 'history jump')
    }
  }, [undoRedo, safeApplySnapshot])

  // Wrapped undo that applies the snapshot to the editor
  const wrappedUndo = useCallback(() => {
    const result = undoRedo.undo()
    if (result) {
      safeApplySnapshot(result.snapshot, 'undo')
    }
  }, [undoRedo, safeApplySnapshot])

  // Wrapped redo that applies the snapshot to the editor
  const wrappedRedo = useCallback(() => {
    const result = undoRedo.redo()
    if (result) {
      safeApplySnapshot(result.snapshot, 'redo')
    }
  }, [undoRedo, safeApplySnapshot])

  const contextValue: UndoRedoContextValue = {
    ...undoRedo,
    undo: wrappedUndo,
    redo: wrappedRedo,
    recordAction,
    jumpToHistoryIndex,
  }

  return (
    <UndoRedoContext.Provider value={contextValue}>
      {children}
      <UndoRedoToast
        action={undoRedo.lastAction}
        onJumpToState={handleJumpToState}
      />
    </UndoRedoContext.Provider>
  )
}

export function useUndoRedoContext() {
  const context = useContext(UndoRedoContext)
  if (context === undefined) {
    throw new Error('useUndoRedoContext must be used within an UndoRedoProvider')
  }
  return context
}
