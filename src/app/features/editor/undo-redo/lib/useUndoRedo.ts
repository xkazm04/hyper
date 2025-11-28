'use client'

import { useCallback, useRef, useState } from 'react'
import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'
import {
  ActionType,
  EditorSnapshot,
  HistoryEntry,
  UndoRedoState,
} from './types'

const MAX_HISTORY_SIZE = 50
const ACTION_LABELS: Record<ActionType, string> = {
  ADD_CARD: 'Add card',
  UPDATE_CARD: 'Edit card',
  DELETE_CARD: 'Delete card',
  ADD_CHOICE: 'Add choice',
  UPDATE_CHOICE: 'Edit choice',
  DELETE_CHOICE: 'Delete choice',
  ADD_CHARACTER: 'Add character',
  UPDATE_CHARACTER: 'Edit character',
  DELETE_CHARACTER: 'Delete character',
}

interface UndoRedoResult {
  entry: HistoryEntry
  snapshot: EditorSnapshot
}

export interface UseUndoRedoReturn {
  canUndo: boolean
  canRedo: boolean
  undoEntry: HistoryEntry | null
  redoEntry: HistoryEntry | null
  lastAction: HistoryEntry | null
  undo: () => UndoRedoResult | null
  redo: () => UndoRedoResult | null
  pushState: (
    snapshot: EditorSnapshot,
    actionType: ActionType,
    affectedCard?: { id: string; title: string; imageUrl?: string | null }
  ) => void
  initializeState: (snapshot: EditorSnapshot) => void
  clearHistory: () => void
}

export function useUndoRedo(): UseUndoRedoReturn {
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    present: null,
    future: [],
    maxHistorySize: MAX_HISTORY_SIZE,
  })

  const [lastAction, setLastAction] = useState<HistoryEntry | null>(null)
  const isInitialized = useRef(false)

  const initializeState = useCallback((snapshot: EditorSnapshot) => {
    if (!isInitialized.current) {
      setState({
        past: [],
        present: snapshot,
        future: [],
        maxHistorySize: MAX_HISTORY_SIZE,
      })
      isInitialized.current = true
    }
  }, [])

  const pushState = useCallback(
    (
      snapshot: EditorSnapshot,
      actionType: ActionType,
      affectedCard?: { id: string; title: string; imageUrl?: string | null }
    ) => {
      setState((prev) =>
        produce(prev, (draft) => {
          if (draft.present) {
            const entry: HistoryEntry = {
              id: uuidv4(),
              timestamp: Date.now(),
              actionType,
              actionLabel: ACTION_LABELS[actionType],
              snapshot: draft.present,
              affectedCardId: affectedCard?.id,
              affectedCardTitle: affectedCard?.title,
              affectedCardImageUrl: affectedCard?.imageUrl ?? undefined,
            }
            draft.past.push(entry)

            // Trim history if exceeds max size
            if (draft.past.length > draft.maxHistorySize) {
              draft.past.shift()
            }
          }

          draft.present = snapshot
          // Clear redo stack on new action
          draft.future = []
        })
      )

      // Track last action for toast
      const actionEntry: HistoryEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        actionType,
        actionLabel: ACTION_LABELS[actionType],
        snapshot,
        affectedCardId: affectedCard?.id,
        affectedCardTitle: affectedCard?.title,
        affectedCardImageUrl: affectedCard?.imageUrl ?? undefined,
      }
      setLastAction(actionEntry)
    },
    []
  )

  const undo = useCallback((): UndoRedoResult | null => {
    // Access state synchronously before updating
    let previousEntry: HistoryEntry | undefined
    let canPerformUndo = false

    setState((prev) => {
      if (prev.past.length === 0 || !prev.present) return prev

      canPerformUndo = true
      previousEntry = prev.past[prev.past.length - 1]

      return produce(prev, (draft) => {
        const poppedEntry = draft.past.pop()!
        const currentEntry: HistoryEntry = {
          id: uuidv4(),
          timestamp: Date.now(),
          actionType: poppedEntry.actionType,
          actionLabel: poppedEntry.actionLabel,
          snapshot: draft.present!,
          affectedCardId: poppedEntry.affectedCardId,
          affectedCardTitle: poppedEntry.affectedCardTitle,
          affectedCardImageUrl: poppedEntry.affectedCardImageUrl,
        }

        draft.future.unshift(currentEntry)
        draft.present = poppedEntry.snapshot
      })
    })

    if (canPerformUndo && previousEntry) {
      const result: UndoRedoResult = {
        entry: previousEntry,
        snapshot: previousEntry.snapshot,
      }
      setLastAction({
        ...previousEntry,
        actionLabel: `Undo: ${previousEntry.actionLabel}`,
      })
      return result
    }

    return null
  }, [])

  const redo = useCallback((): UndoRedoResult | null => {
    // Access state synchronously before updating
    let nextEntry: HistoryEntry | undefined
    let canPerformRedo = false

    setState((prev) => {
      if (prev.future.length === 0 || !prev.present) return prev

      canPerformRedo = true
      nextEntry = prev.future[0]

      return produce(prev, (draft) => {
        const shiftedEntry = draft.future.shift()!
        const currentEntry: HistoryEntry = {
          id: uuidv4(),
          timestamp: Date.now(),
          actionType: shiftedEntry.actionType,
          actionLabel: shiftedEntry.actionLabel,
          snapshot: draft.present!,
          affectedCardId: shiftedEntry.affectedCardId,
          affectedCardTitle: shiftedEntry.affectedCardTitle,
          affectedCardImageUrl: shiftedEntry.affectedCardImageUrl,
        }

        draft.past.push(currentEntry)
        draft.present = shiftedEntry.snapshot
      })
    })

    if (canPerformRedo && nextEntry) {
      const result: UndoRedoResult = {
        entry: nextEntry,
        snapshot: nextEntry.snapshot,
      }
      setLastAction({
        ...nextEntry,
        actionLabel: `Redo: ${nextEntry.actionLabel}`,
      })
      return result
    }

    return null
  }, [])

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      past: [],
      future: [],
    }))
    setLastAction(null)
    isInitialized.current = false
  }, [])

  return {
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undoEntry: state.past.length > 0 ? state.past[state.past.length - 1] : null,
    redoEntry: state.future.length > 0 ? state.future[0] : null,
    lastAction,
    undo,
    redo,
    pushState,
    initializeState,
    clearHistory,
  }
}
