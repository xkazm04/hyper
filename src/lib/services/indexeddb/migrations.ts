import { IDBPDatabase } from 'idb'
import { StoryDBSchema } from './types'

/**
 * Run database migrations during upgrade
 */
export function runMigrations(db: IDBPDatabase<StoryDBSchema>): void {
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
}
