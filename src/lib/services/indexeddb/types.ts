import { DBSchema } from 'idb'
import {
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

// Typed sync data for different entity types and operations
export type SyncData =
  | CreateStoryStackInput
  | UpdateStoryStackInput
  | CreateStoryCardInput
  | UpdateStoryCardInput
  | CreateChoiceInput
  | UpdateChoiceInput

export interface SyncQueueItem {
  id: string
  entityType: EntityType
  entityId: string
  operation: SyncOperation
  data?: SyncData
  timestamp: number
  status: SyncStatus
  retryCount: number
  errorMessage?: string
}

export type MetadataValue = string | number | boolean | null | Record<string, unknown>

export interface MetadataEntry {
  key: string
  value: MetadataValue
  updatedAt: number
}

export const DB_NAME = 'hyper-story-db'
export const DB_VERSION = 1
