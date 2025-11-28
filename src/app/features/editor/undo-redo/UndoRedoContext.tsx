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

interface UndoRedoContextValue extends UseUndoRedoReturn {
  recordAction: (
    actionType: ActionType,
    affectedCard?: { id: string; title: string; imageUrl?: string | null }
  ) => void
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

  const contextValue: UndoRedoContextValue = {
    ...undoRedo,
    recordAction,
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
