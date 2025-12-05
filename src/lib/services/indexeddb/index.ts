// Re-export types
export type {
  StoryDBSchema,
  SyncStatus,
  SyncOperation,
  EntityType,
  SyncQueueItem,
  MetadataEntry,
  SyncData,
  MetadataValue,
} from './types'

// Re-export connection utilities
export { getDB, closeDB, isIndexedDBAvailable } from './connection'

// Re-export all operations
export {
  // Story Stack Operations
  saveStoryStack,
  getStoryStackFromDB,
  getAllStoryStacksFromDB,
  deleteStoryStackFromDB,
  // Story Card Operations
  saveStoryCard,
  saveStoryCards,
  getStoryCardFromDB,
  getStoryCardsFromDB,
  deleteStoryCardFromDB,
  deleteStoryCardsForStack,
  // Choice Operations
  saveChoice,
  saveChoices,
  getChoiceFromDB,
  getChoicesFromDB,
  getAllChoicesForStack,
  deleteChoiceFromDB,
  deleteChoicesForCard,
  // Sync Queue Operations
  addToSyncQueue,
  getPendingSyncItems,
  getFailedSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  clearCompletedSyncItems,
  getSyncQueueCount,
  getPendingSyncCount,
  // Metadata Operations
  setMetadata,
  getMetadata,
  deleteMetadata,
  // Utility Operations
  clearAllData,
  getLastSyncTime,
  setLastSyncTime,
} from './operations'
