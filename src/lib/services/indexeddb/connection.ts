import { openDB, IDBPDatabase } from 'idb'
import { StoryDBSchema, DB_NAME, DB_VERSION } from './types'
import { runMigrations } from './migrations'

// Singleton database instance
let dbInstance: IDBPDatabase<StoryDBSchema> | null = null

/**
 * Get or create the IndexedDB database instance
 */
export async function getDB(): Promise<IDBPDatabase<StoryDBSchema>> {
  if (dbInstance) return dbInstance

  dbInstance = await openDB<StoryDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      runMigrations(db)
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

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window
}
