import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { StoryStack, StoryCard, Choice } from '@/lib/types'

// Database schema interface
interface StoryDBSchema extends DBSchema {
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

const DB_NAME = 'hyper-story-db'
const DB_VERSION = 1

// Singleton database instance
let dbInstance: IDBPDatabase<StoryDBSchema> | null = null

/**
 * Get or create the IndexedDB database instance
 */
export async function getDB(): Promise<IDBPDatabase<StoryDBSchema>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<StoryDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Story stacks store
      if (!db.objectStoreNames.contains('storyStacks')) {
        const storyStacksStore = db.createObjectStore('storyStacks', { keyPath: 'id' })
        storyStacksStore.createIndex('by-owner', 'ownerId')
        storyStacksStore.createIndex('by-updated', 'updatedAt')
      }

      // Story cards store
      if (!db.objectStoreNames.contains('storyCards')) {
        const storyCardsStore = db.createObjectStore('storyCards', { keyPath: 'id' })
        storyCardsStore.createIndex('by-stack', 'storyStackId')
        storyCardsStore.createIndex('by-order', ['storyStackId', 'orderIndex'])
      }

      // Choices store
      if (!db.objectStoreNames.contains('choices')) {
        const choicesStore = db.createObjectStore('choices', { keyPath: 'id' })
        choicesStore.createIndex('by-card', 'storyCardId')
        choicesStore.createIndex('by-order', ['storyCardId', 'orderIndex'])
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
        syncQueueStore.createIndex('by-timestamp', 'timestamp')
        syncQueueStore.createIndex('by-status', 'status')
      }

      // Metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' })
      }
    },
  })

  return dbInstance
}

/**
 * Close the database connection
 */
export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

// =============================================================================
// Story Stack Operations
// =============================================================================

export async function saveStoryStack(stack: StoryStack): Promise<void> {
  const db = await getDB()
  await db.put('storyStacks', stack)
}

export async function getStoryStackFromDB(id: string): Promise<StoryStack | undefined> {
  const db = await getDB()
  return db.get('storyStacks', id)
}

export async function getAllStoryStacksFromDB(ownerId?: string): Promise<StoryStack[]> {
  const db = await getDB()

  if (ownerId) {
    return db.getAllFromIndex('storyStacks', 'by-owner', ownerId)
  }

  return db.getAll('storyStacks')
}

export async function deleteStoryStackFromDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('storyStacks', id)
}

// =============================================================================
// Story Card Operations
// =============================================================================

export async function saveStoryCard(card: StoryCard): Promise<void> {
  const db = await getDB()
  await db.put('storyCards', card)
}

export async function saveStoryCards(cards: StoryCard[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('storyCards', 'readwrite')
  await Promise.all([
    ...cards.map(card => tx.store.put(card)),
    tx.done
  ])
}

export async function getStoryCardFromDB(id: string): Promise<StoryCard | undefined> {
  const db = await getDB()
  return db.get('storyCards', id)
}

export async function getStoryCardsFromDB(storyStackId: string): Promise<StoryCard[]> {
  const db = await getDB()
  const cards = await db.getAllFromIndex('storyCards', 'by-stack', storyStackId)
  // Sort by orderIndex
  return cards.sort((a, b) => a.orderIndex - b.orderIndex)
}

export async function deleteStoryCardFromDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('storyCards', id)
}

export async function deleteStoryCardsForStack(storyStackId: string): Promise<void> {
  const db = await getDB()
  const cards = await db.getAllFromIndex('storyCards', 'by-stack', storyStackId)
  const tx = db.transaction('storyCards', 'readwrite')
  await Promise.all([
    ...cards.map(card => tx.store.delete(card.id)),
    tx.done
  ])
}

// =============================================================================
// Choice Operations
// =============================================================================

export async function saveChoice(choice: Choice): Promise<void> {
  const db = await getDB()
  await db.put('choices', choice)
}

export async function saveChoices(choices: Choice[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('choices', 'readwrite')
  await Promise.all([
    ...choices.map(choice => tx.store.put(choice)),
    tx.done
  ])
}

export async function getChoiceFromDB(id: string): Promise<Choice | undefined> {
  const db = await getDB()
  return db.get('choices', id)
}

export async function getChoicesFromDB(storyCardId: string): Promise<Choice[]> {
  const db = await getDB()
  const choices = await db.getAllFromIndex('choices', 'by-card', storyCardId)
  // Sort by orderIndex
  return choices.sort((a, b) => a.orderIndex - b.orderIndex)
}

export async function getAllChoicesForStack(storyStackId: string): Promise<Choice[]> {
  const db = await getDB()
  const cards = await getStoryCardsFromDB(storyStackId)
  const cardIds = new Set(cards.map(c => c.id))

  const allChoices = await db.getAll('choices')
  return allChoices.filter(choice => cardIds.has(choice.storyCardId))
    .sort((a, b) => a.orderIndex - b.orderIndex)
}

export async function deleteChoiceFromDB(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('choices', id)
}

export async function deleteChoicesForCard(storyCardId: string): Promise<void> {
  const db = await getDB()
  const choices = await db.getAllFromIndex('choices', 'by-card', storyCardId)
  const tx = db.transaction('choices', 'readwrite')
  await Promise.all([
    ...choices.map(choice => tx.store.delete(choice.id)),
    tx.done
  ])
}

// =============================================================================
// Sync Queue Operations
// =============================================================================

export async function addToSyncQueue(item: Omit<SyncQueueItem, 'status' | 'retryCount'>): Promise<void> {
  const db = await getDB()
  const queueItem: SyncQueueItem = {
    ...item,
    status: 'pending',
    retryCount: 0,
  }
  await db.put('syncQueue', queueItem)
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  const items = await db.getAllFromIndex('syncQueue', 'by-status', 'pending')
  // Sort by timestamp (oldest first)
  return items.sort((a, b) => a.timestamp - b.timestamp)
}

export async function getFailedSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB()
  return db.getAllFromIndex('syncQueue', 'by-status', 'failed')
}

export async function updateSyncItemStatus(
  id: string,
  status: SyncStatus,
  errorMessage?: string
): Promise<void> {
  const db = await getDB()
  const item = await db.get('syncQueue', id)
  if (item) {
    item.status = status
    if (errorMessage) {
      item.errorMessage = errorMessage
    }
    if (status === 'failed') {
      item.retryCount++
    }
    await db.put('syncQueue', item)
  }
}

export async function removeSyncItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('syncQueue', id)
}

export async function clearCompletedSyncItems(): Promise<void> {
  const db = await getDB()
  const items = await db.getAllFromIndex('syncQueue', 'by-status', 'completed')
  const tx = db.transaction('syncQueue', 'readwrite')
  await Promise.all([
    ...items.map(item => tx.store.delete(item.id)),
    tx.done
  ])
}

export async function getSyncQueueCount(): Promise<number> {
  const db = await getDB()
  return db.count('syncQueue')
}

export async function getPendingSyncCount(): Promise<number> {
  const db = await getDB()
  return db.countFromIndex('syncQueue', 'by-status', 'pending')
}

// =============================================================================
// Metadata Operations
// =============================================================================

export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await getDB()
  await db.put('metadata', {
    key,
    value,
    updatedAt: Date.now(),
  })
}

export async function getMetadata<T = any>(key: string): Promise<T | undefined> {
  const db = await getDB()
  const entry = await db.get('metadata', key)
  return entry?.value as T | undefined
}

export async function deleteMetadata(key: string): Promise<void> {
  const db = await getDB()
  await db.delete('metadata', key)
}

// =============================================================================
// Utility Operations
// =============================================================================

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['storyStacks', 'storyCards', 'choices', 'syncQueue', 'metadata'],
    'readwrite'
  )

  await Promise.all([
    tx.objectStore('storyStacks').clear(),
    tx.objectStore('storyCards').clear(),
    tx.objectStore('choices').clear(),
    tx.objectStore('syncQueue').clear(),
    tx.objectStore('metadata').clear(),
    tx.done,
  ])
}

/**
 * Get the last sync timestamp
 */
export async function getLastSyncTime(): Promise<number | undefined> {
  return getMetadata<number>('lastSyncTime')
}

/**
 * Set the last sync timestamp
 */
export async function setLastSyncTime(timestamp: number): Promise<void> {
  await setMetadata('lastSyncTime', timestamp)
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}
