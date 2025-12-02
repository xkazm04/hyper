export { UndoRedoProvider, useUndoRedoContext } from './UndoRedoContext'
export { UndoRedoToast } from './components/UndoRedoToast'
export { HistoryPanel } from './components/HistoryPanel'
export { HistoryEntryItem } from './components/HistoryEntryItem'
export { useUndoRedo } from './lib/useUndoRedo'
export { useUndoRedoActions } from './lib/useUndoRedoActions'
export {
  formatDiffSummary,
  formatDiffChange,
  formatRelativeTime,
  getActionIcon,
  getActionColorClass,
  generateDiffSummary,
} from './lib/diffUtils'
export {
  validateSnapshot,
  normalizeSnapshot,
  logSnapshotValidationErrors,
  createEmptySnapshot,
} from './lib/snapshotValidator'
export type {
  ActionType,
  EditorSnapshot,
  HistoryEntry,
  UndoRedoState,
  DiffChange,
  DiffSummary,
} from './lib/types'
export type {
  SnapshotValidationResult,
  SnapshotValidationError,
} from './lib/snapshotValidator'
