import { v4 as uuidv4 } from 'uuid'
import { StoryService } from './story'
import {
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  clearCompletedSyncItems,
  setLastSyncTime,
  getLastSyncTime,
  saveStoryStack,
  saveStoryCards,
  saveChoices,
  deleteStoryStackFromDB,
  deleteStoryCardsForStack,
  deleteStoryCardFromDB,
  deleteChoicesForCard,
  deleteChoiceFromDB,
  SyncQueueItem,
  EntityType,
  SyncOperation,
  getPendingSyncCount,
} from './indexeddb'
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

// Singleton sync service
class SyncService {
  private storyService: StoryService
  private listeners: Set<(event: SyncEvent) => void> = new Set()
  private _isOnline: boolean = true
  private _isSyncing: boolean = false
  private syncIntervalId: number | null = null

  constructor() {
    this.storyService = new StoryService()

    // Initialize online status
    if (typeof window !== 'undefined') {
      this._isOnline = navigator.onLine

      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  // Event subscription
  subscribe(listener: (event: SyncEvent) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(event: SyncEvent): void {
    this.listeners.forEach(listener => listener(event))
  }

  // Online/offline handlers
  private handleOnline = async (): Promise<void> => {
    this._isOnline = true
    this.emit({
      type: 'connectivity_changed',
      timestamp: Date.now(),
      data: { isOnline: true },
    })

    // Trigger sync when coming back online
    await this.sync()
  }

  private handleOffline = (): void => {
    this._isOnline = false
    this.emit({
      type: 'connectivity_changed',
      timestamp: Date.now(),
      data: { isOnline: false },
    })
  }

  // Getters
  get isOnline(): boolean {
    return this._isOnline
  }

  get isSyncing(): boolean {
    return this._isSyncing
  }

  // Get current sync status
  async getStatus(): Promise<SyncStatus> {
    const pendingCount = await getPendingSyncCount()
    const lastSyncTime = await getLastSyncTime()

    return {
      isOnline: this._isOnline,
      isSyncing: this._isSyncing,
      pendingCount,
      lastSyncTime: lastSyncTime || null,
      lastError: null,
    }
  }

  // Queue operations for offline sync
  async queueStoryStackCreate(input: CreateStoryStackInput, tempId: string): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'storyStack',
      entityId: tempId,
      operation: 'create',
      data: input,
      timestamp: Date.now(),
    })
  }

  async queueStoryStackUpdate(id: string, input: UpdateStoryStackInput): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'storyStack',
      entityId: id,
      operation: 'update',
      data: input,
      timestamp: Date.now(),
    })
  }

  async queueStoryStackDelete(id: string): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'storyStack',
      entityId: id,
      operation: 'delete',
      timestamp: Date.now(),
    })
  }

  async queueStoryCardCreate(input: CreateStoryCardInput, tempId: string): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'storyCard',
      entityId: tempId,
      operation: 'create',
      data: input,
      timestamp: Date.now(),
    })
  }

  async queueStoryCardUpdate(id: string, input: UpdateStoryCardInput): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'storyCard',
      entityId: id,
      operation: 'update',
      data: input,
      timestamp: Date.now(),
    })
  }

  async queueStoryCardDelete(id: string): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'storyCard',
      entityId: id,
      operation: 'delete',
      timestamp: Date.now(),
    })
  }

  async queueChoiceCreate(input: CreateChoiceInput, tempId: string): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'choice',
      entityId: tempId,
      operation: 'create',
      data: input,
      timestamp: Date.now(),
    })
  }

  async queueChoiceUpdate(id: string, input: UpdateChoiceInput): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'choice',
      entityId: id,
      operation: 'update',
      data: input,
      timestamp: Date.now(),
    })
  }

  async queueChoiceDelete(id: string): Promise<void> {
    await addToSyncQueue({
      id: uuidv4(),
      entityType: 'choice',
      entityId: id,
      operation: 'delete',
      timestamp: Date.now(),
    })
  }

  // Main sync function
  async sync(): Promise<void> {
    if (!this._isOnline || this._isSyncing) {
      return
    }

    this._isSyncing = true
    this.emit({
      type: 'sync_started',
      timestamp: Date.now(),
    })

    try {
      const pendingItems = await getPendingSyncItems()

      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item)
          await removeSyncItem(item.id)

          this.emit({
            type: 'item_synced',
            timestamp: Date.now(),
            data: { item },
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          // Max 3 retries
          if (item.retryCount >= 3) {
            await updateSyncItemStatus(item.id, 'failed', errorMessage)
          } else {
            await updateSyncItemStatus(item.id, 'pending', errorMessage)
          }

          this.emit({
            type: 'item_failed',
            timestamp: Date.now(),
            data: { item, error: errorMessage },
          })
        }
      }

      await setLastSyncTime(Date.now())
      await clearCompletedSyncItems()

      this.emit({
        type: 'sync_completed',
        timestamp: Date.now(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      this.emit({
        type: 'sync_failed',
        timestamp: Date.now(),
        data: { error: errorMessage },
      })
    } finally {
      this._isSyncing = false
    }
  }

  // Process individual sync item
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId, operation, data } = item

    switch (entityType) {
      case 'storyStack':
        await this.processStoryStackSync(entityId, operation, data)
        break
      case 'storyCard':
        await this.processStoryCardSync(entityId, operation, data)
        break
      case 'choice':
        await this.processChoiceSync(entityId, operation, data)
        break
    }
  }

  private async processStoryStackSync(
    id: string,
    operation: SyncOperation,
    data?: any
  ): Promise<void> {
    switch (operation) {
      case 'create':
        const newStack = await this.storyService.createStoryStack(data)
        // Update local with real ID
        await saveStoryStack(newStack)
        // Delete temp record
        await deleteStoryStackFromDB(id)
        break
      case 'update':
        const updatedStack = await this.storyService.updateStoryStack(id, data)
        await saveStoryStack(updatedStack)
        break
      case 'delete':
        await this.storyService.deleteStoryStack(id)
        await deleteStoryStackFromDB(id)
        await deleteStoryCardsForStack(id)
        break
    }
  }

  private async processStoryCardSync(
    id: string,
    operation: SyncOperation,
    data?: any
  ): Promise<void> {
    switch (operation) {
      case 'create':
        const newCard = await this.storyService.createStoryCard(data)
        // Update local with real ID
        await saveStoryCards([newCard])
        // Delete temp record
        await deleteStoryCardFromDB(id)
        break
      case 'update':
        const updatedCard = await this.storyService.updateStoryCard(id, data)
        await saveStoryCards([updatedCard])
        break
      case 'delete':
        await this.storyService.deleteStoryCard(id)
        await deleteStoryCardFromDB(id)
        await deleteChoicesForCard(id)
        break
    }
  }

  private async processChoiceSync(
    id: string,
    operation: SyncOperation,
    data?: any
  ): Promise<void> {
    switch (operation) {
      case 'create':
        const newChoice = await this.storyService.createChoice(data)
        // Update local with real ID
        await saveChoices([newChoice])
        // Delete temp record
        await deleteChoiceFromDB(id)
        break
      case 'update':
        const updatedChoice = await this.storyService.updateChoice(id, data)
        await saveChoices([updatedChoice])
        break
      case 'delete':
        await this.storyService.deleteChoice(id)
        await deleteChoiceFromDB(id)
        break
    }
  }

  // Start automatic sync interval
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncIntervalId) {
      this.stopAutoSync()
    }

    this.syncIntervalId = window.setInterval(() => {
      if (this._isOnline) {
        this.sync()
      }
    }, intervalMs)
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncIntervalId) {
      window.clearInterval(this.syncIntervalId)
      this.syncIntervalId = null
    }
  }

  // Cleanup
  destroy(): void {
    this.stopAutoSync()

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }

    this.listeners.clear()
  }
}

// Export singleton instance
export const syncService = new SyncService()

// Export class for testing
export { SyncService }
