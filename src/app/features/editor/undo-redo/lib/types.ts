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
}

export interface UndoRedoState {
  past: HistoryEntry[]
  present: EditorSnapshot | null
  future: HistoryEntry[]
  maxHistorySize: number
}
