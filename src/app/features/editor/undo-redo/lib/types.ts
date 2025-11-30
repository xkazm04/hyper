import { EditorSnapshot } from '@/contexts/EditorContext'

export type { EditorSnapshot }

export type ActionType =
  | 'ADD_CARD'
  | 'UPDATE_CARD'
  | 'DELETE_CARD'
  | 'ADD_CHOICE'
  | 'UPDATE_CHOICE'
  | 'DELETE_CHOICE'
  | 'ADD_CHARACTER'
  | 'UPDATE_CHARACTER'
  | 'DELETE_CHARACTER'
  | 'UPDATE_IMAGE'
  | 'BULK_UPDATE'

// Diff summary for a single change
export interface DiffChange {
  field: string
  label: string
  oldValue?: string | number | boolean | null
  newValue?: string | number | boolean | null
  type: 'add' | 'update' | 'delete'
}

// Extended diff summary for history display
export interface DiffSummary {
  changes: DiffChange[]
  entityType: 'card' | 'choice' | 'character' | 'characterCard'
  entityName: string
  totalChanges: number
}

export interface HistoryEntry {
  id: string
  timestamp: number
  actionType: ActionType
  actionLabel: string
  snapshot: EditorSnapshot
  // For card preview in toast
  affectedCardId?: string
  affectedCardTitle?: string
  affectedCardImageUrl?: string
  // Diff summary for history panel
  diffSummary?: DiffSummary
}

export interface UndoRedoState {
  past: HistoryEntry[]
  present: EditorSnapshot | null
  future: HistoryEntry[]
  maxHistorySize: number
  // Current position in the timeline (for UI highlighting)
  currentIndex: number
}
