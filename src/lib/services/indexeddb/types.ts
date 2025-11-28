import { DBSchema } from 'idb'
import { StoryStack, StoryCard, Choice } from '@/lib/types'

// Database schema interface
export interface StoryDBSchema extends DBSchema {
  storyStacks: {
    key: string
    value: StoryStack
    indexes: { 'by-owner': string; 'by-updated': string }
  }
  storyCards: {
    key: string
    value: StoryCard
    indexes: { 'by-stack': string; 'by-order': [string, number] }
  }
  choices: {
    key: string
    value: Choice
    indexes: { 'by-card': string; 'by-order': [string, number] }
  }
  syncQueue: {
    key: string
    value: SyncQueueItem
    indexes: { 'by-timestamp': number; 'by-status': SyncStatus }
  }
  metadata: {
    key: string
    value: MetadataEntry
  }
}

// Sync queue types
export type SyncStatus = 'pending' | 'in_progress' | 'failed' | 'completed'
export type SyncOperation = 'create' | 'update' | 'delete'
export type EntityType = 'storyStack' | 'storyCard' | 'choice'

export interface SyncQueueItem {
  id: string
  entityType: EntityType
  entityId: string
  operation: SyncOperation
  data?: any
  timestamp: number
  status: SyncStatus
  retryCount: number
  errorMessage?: string
}

export interface MetadataEntry {
  key: string
  value: any
  updatedAt: number
}

export const DB_NAME = 'hyper-story-db'
export const DB_VERSION = 1
