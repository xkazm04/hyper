import { v4 as uuidv4 } from 'uuid'
import {
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  clearCompletedSyncItems,
  setLastSyncTime,
  getLastSyncTime,
  getPendingSyncCount,
  SyncQueueItem,
} from '../indexeddb'
import type {
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
} from './types'
import { SyncStatus } from './types'

export class QueueService {
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

  // Queue management
  async getPendingItems(): Promise<SyncQueueItem[]> {
    return getPendingSyncItems()
  }

  async updateItemStatus(id: string, status: 'pending' | 'failed', error?: string): Promise<void> {
    await updateSyncItemStatus(id, status, error)
  }

  async removeItem(id: string): Promise<void> {
    await removeSyncItem(id)
  }

  async clearCompleted(): Promise<void> {
    await clearCompletedSyncItems()
  }

  async setLastSync(timestamp: number): Promise<void> {
    await setLastSyncTime(timestamp)
  }

  async getLastSync(): Promise<number | null> {
    const time = await getLastSyncTime()
    return time ?? null
  }

  async getPendingCount(): Promise<number> {
    return getPendingSyncCount()
  }

  async getStatus(isOnline: boolean, isSyncing: boolean): Promise<SyncStatus> {
    const pendingCount = await this.getPendingCount()
    const lastSyncTime = await this.getLastSync()

    return {
      isOnline,
      isSyncing,
      pendingCount,
      lastSyncTime: lastSyncTime || null,
      lastError: null,
    }
  }
}
