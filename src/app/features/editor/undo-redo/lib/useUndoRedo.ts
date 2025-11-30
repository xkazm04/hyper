'use client'

import { useCallback, useRef, useState } from 'react'
import { produce } from 'immer'
import { v4 as uuidv4 } from 'uuid'
import {
  ActionType,
  EditorSnapshot,
  HistoryEntry,
  UndoRedoState,
  DiffSummary,
} from './types'
import { generateDiffSummary } from './diffUtils'

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
  UPDATE_IMAGE: 'Update image',
  BULK_UPDATE: 'Bulk update',
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
  // Full history access for the panel
  historyEntries: HistoryEntry[]
  futureEntries: HistoryEntry[]
  currentIndex: number
  totalEntries: number
  undo: () => UndoRedoResult | null
  redo: () => UndoRedoResult | null
  pushState: (
    snapshot: EditorSnapshot,
    actionType: ActionType,
    affectedCard?: { id: string; title: string; imageUrl?: string | null },
    diffSummary?: DiffSummary
  ) => void
  initializeState: (snapshot: EditorSnapshot) => void
  clearHistory: () => void
  jumpToIndex: (index: number) => EditorSnapshot | null
}

export function useUndoRedo(): UseUndoRedoReturn {
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    present: null,
    future: [],
    maxHistorySize: MAX_HISTORY_SIZE,
    currentIndex: 0,
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
        currentIndex: 0,
      })
      isInitialized.current = true
    }
  }, [])

  const pushState = useCallback(
    (
      snapshot: EditorSnapshot,
      actionType: ActionType,
      affectedCard?: { id: string; title: string; imageUrl?: string | null },
      providedDiffSummary?: DiffSummary
    ) => {
      let generatedDiffSummary: DiffSummary | undefined = providedDiffSummary

      setState((prev) =>
        produce(prev, (draft) => {
          if (draft.present) {
            // Generate diff summary if not provided
            if (!generatedDiffSummary) {
              generatedDiffSummary = generateDiffSummary(
                draft.present,
                snapshot,
                actionType,
                affectedCard?.id
              )
            }

            const entry: HistoryEntry = {
              id: uuidv4(),
              timestamp: Date.now(),
              actionType,
              actionLabel: ACTION_LABELS[actionType],
              snapshot: draft.present,
              affectedCardId: affectedCard?.id,
              affectedCardTitle: affectedCard?.title,
              affectedCardImageUrl: affectedCard?.imageUrl ?? undefined,
              diffSummary: generatedDiffSummary,
            }
            draft.past.push(entry)

            // Trim history if exceeds max size
            if (draft.past.length > draft.maxHistorySize) {
              draft.past.shift()
            }

            // Update current index to point to the latest state
            draft.currentIndex = draft.past.length
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
        diffSummary: generatedDiffSummary,
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
          diffSummary: poppedEntry.diffSummary,
        }

        draft.future.unshift(currentEntry)
        draft.present = poppedEntry.snapshot
        draft.currentIndex = draft.past.length
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
          diffSummary: shiftedEntry.diffSummary,
        }

        draft.past.push(currentEntry)
        draft.present = shiftedEntry.snapshot
        draft.currentIndex = draft.past.length
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
      currentIndex: 0,
    }))
    setLastAction(null)
    isInitialized.current = false
  }, [])

  // Jump to a specific index in history (0 = first action, -1 = before first action)
  // Returns the snapshot at that index, or null if invalid
  const jumpToIndex = useCallback((targetIndex: number): EditorSnapshot | null => {
    let resultSnapshot: EditorSnapshot | null = null

    setState((prev) => {
      // Combine all entries: past + present + future
      const allEntries = [...prev.past]
      const currentPresentIndex = prev.past.length

      // targetIndex should be between 0 (before any actions) and past.length (current state)
      // If jumping to past, we need to move entries from past to future
      // If jumping forward, we need to move entries from future to past

      if (targetIndex < 0 || targetIndex > currentPresentIndex + prev.future.length) {
        return prev // Invalid index
      }

      if (targetIndex === currentPresentIndex) {
        // Already at the target
        resultSnapshot = prev.present
        return prev
      }

      return produce(prev, (draft) => {
        if (targetIndex < currentPresentIndex) {
          // Moving backwards in history
          const stepsBack = currentPresentIndex - targetIndex

          for (let i = 0; i < stepsBack; i++) {
            if (draft.past.length === 0) break

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
              diffSummary: poppedEntry.diffSummary,
            }
            draft.future.unshift(currentEntry)
            draft.present = poppedEntry.snapshot
          }
        } else {
          // Moving forward in history (redo)
          const stepsForward = targetIndex - currentPresentIndex

          for (let i = 0; i < stepsForward; i++) {
            if (draft.future.length === 0) break

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
              diffSummary: shiftedEntry.diffSummary,
            }
            draft.past.push(currentEntry)
            draft.present = shiftedEntry.snapshot
          }
        }

        draft.currentIndex = draft.past.length
        resultSnapshot = draft.present
      })
    })

    return resultSnapshot
  }, [])

  // Combine past and future for full timeline display
  // Past entries are shown in order, then current state marker, then future
  const historyEntries = state.past
  const futureEntries = state.future
  const currentIndex = state.past.length
  const totalEntries = state.past.length + state.future.length + 1 // +1 for present

  return {
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undoEntry: state.past.length > 0 ? state.past[state.past.length - 1] : null,
    redoEntry: state.future.length > 0 ? state.future[0] : null,
    lastAction,
    historyEntries,
    futureEntries,
    currentIndex,
    totalEntries,
    undo,
    redo,
    pushState,
    initializeState,
    clearHistory,
    jumpToIndex,
  }
}
