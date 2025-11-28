// Barrel file for sync service modules
// Preserves backward compatibility with original sync.ts exports

import { QueueService } from './queue'
import { OperationsService } from './operations'
import { ConflictService } from './conflict'
import type {
  SyncEvent,
  SyncEventType,
  SyncStatus,
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
} from './types'

// Re-export sub-services for direct access
export { QueueService } from './queue'
export { OperationsService } from './operations'
export { ConflictService } from './conflict'

// Re-export types
export type { SyncEvent, SyncEventType, SyncStatus } from './types'

/**
 * SyncService - Unified facade for all sync operations
 * Maintains backward compatibility with original sync.ts API
 */
class SyncService {
  private queueService: QueueService
  private operationsService: OperationsService
  private conflictService: ConflictService
  private listeners: Set<(event: SyncEvent) => void> = new Set()
  private _isOnline: boolean = true
  private _isSyncing: boolean = false
  private syncIntervalId: number | null = null

  constructor() {
    this.queueService = new QueueService()
    this.operationsService = new OperationsService()
    this.conflictService = new ConflictService()

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
    return this.queueService.getStatus(this._isOnline, this._isSyncing)
  }

  // Queue operations
  async queueStoryStackCreate(input: CreateStoryStackInput, tempId: string): Promise<void> {
    return this.queueService.queueStoryStackCreate(input, tempId)
  }

  async queueStoryStackUpdate(id: string, input: UpdateStoryStackInput): Promise<void> {
    return this.queueService.queueStoryStackUpdate(id, input)
  }

  async queueStoryStackDelete(id: string): Promise<void> {
    return this.queueService.queueStoryStackDelete(id)
  }

  async queueStoryCardCreate(input: CreateStoryCardInput, tempId: string): Promise<void> {
    return this.queueService.queueStoryCardCreate(input, tempId)
  }

  async queueStoryCardUpdate(id: string, input: UpdateStoryCardInput): Promise<void> {
    return this.queueService.queueStoryCardUpdate(id, input)
  }

  async queueStoryCardDelete(id: string): Promise<void> {
    return this.queueService.queueStoryCardDelete(id)
  }

  async queueChoiceCreate(input: CreateChoiceInput, tempId: string): Promise<void> {
    return this.queueService.queueChoiceCreate(input, tempId)
  }

  async queueChoiceUpdate(id: string, input: UpdateChoiceInput): Promise<void> {
    return this.queueService.queueChoiceUpdate(id, input)
  }

  async queueChoiceDelete(id: string): Promise<void> {
    return this.queueService.queueChoiceDelete(id)
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
      const pendingItems = await this.queueService.getPendingItems()

      for (const item of pendingItems) {
        try {
          await this.operationsService.processSyncItem(item)
          await this.queueService.removeItem(item.id)

          this.emit({
            type: 'item_synced',
            timestamp: Date.now(),
            data: { item },
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          // Max 3 retries
          if (item.retryCount >= 3) {
            await this.queueService.updateItemStatus(item.id, 'failed', errorMessage)
          } else {
            await this.queueService.updateItemStatus(item.id, 'pending', errorMessage)
          }

          this.emit({
            type: 'item_failed',
            timestamp: Date.now(),
            data: { item, error: errorMessage },
          })
        }
      }

      await this.queueService.setLastSync(Date.now())
      await this.queueService.clearCompleted()

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
