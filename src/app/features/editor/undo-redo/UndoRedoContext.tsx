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
import { useEditor } from '@/contexts/EditorContext'

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

  // Initialize state when editor data loads
  useEffect(() => {
    if (!isInitialized.current && storyCards.length > 0) {
      const snapshot = getSnapshot()
      undoRedo.initializeState(snapshot)
      isInitialized.current = true
    }
  }, [storyCards, getSnapshot, undoRedo])

  const recordAction = useCallback(
    (
      actionType: ActionType,
      affectedCard?: { id: string; title: string; imageUrl?: string | null }
    ) => {
      const snapshot = getSnapshot()
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
          editorApplySnapshot(result.snapshot)
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
          editorApplySnapshot(result.snapshot)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undoRedo, editorApplySnapshot])

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
      editorApplySnapshot(snapshot)
    }
  }, [undoRedo, editorApplySnapshot])

  // Wrapped undo that applies the snapshot to the editor
  const wrappedUndo = useCallback(() => {
    const result = undoRedo.undo()
    if (result) {
      editorApplySnapshot(result.snapshot)
    }
  }, [undoRedo, editorApplySnapshot])

  // Wrapped redo that applies the snapshot to the editor
  const wrappedRedo = useCallback(() => {
    const result = undoRedo.redo()
    if (result) {
      editorApplySnapshot(result.snapshot)
    }
  }, [undoRedo, editorApplySnapshot])

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
