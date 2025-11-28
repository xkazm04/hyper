// Shared types for sync service modules

// Event types for sync status updates
export type SyncEventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'item_synced'
  | 'item_failed'
  | 'connectivity_changed'

export interface SyncEvent {
  type: SyncEventType
  timestamp: number
  data?: any
}

// Sync status
export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingCount: number
  lastSyncTime: number | null
  lastError: string | null
}

// Re-export types from lib/types
export type {
  StoryStack,
  StoryCard,
  Choice,
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
} from '@/lib/types'

// Re-export indexeddb types
export type {
  SyncQueueItem,
  EntityType,
  SyncOperation,
} from '../indexeddb'
