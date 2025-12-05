// Shared types for sync service modules

// Event types for sync status updates
export type SyncEventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'item_synced'
  | 'item_failed'
  | 'connectivity_changed'

// Sync event data - using a simple union that's easier to work with
export interface SyncEventData {
  // From connectivity_changed
  isOnline?: boolean
  // From sync_failed, item_failed
  error?: string
  // From sync_started, sync_completed
  count?: number
  // From item_synced, item_failed
  item?: unknown
  entityType?: string
}

export interface SyncEvent {
  type: SyncEventType
  timestamp: number
  data?: SyncEventData
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
  SyncData,
} from '../indexeddb'
