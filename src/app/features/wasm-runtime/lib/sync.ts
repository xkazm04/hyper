// WASM Runtime Sync Module
// Handles syncing data when online connection is available

import type { CompiledStoryBundle, SyncCapabilities } from './types'
import { debounce } from './utils'

export type SyncEventType =
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'update_available'
  | 'connectivity_changed'

export interface SyncEvent {
  type: SyncEventType
  timestamp: number
  data?: unknown
}

export type SyncEventListener = (event: SyncEvent) => void

/**
 * Manages synchronization between offline WASM runtime and online server
 */
export class WasmSyncManager {
  private stackId: string
  private bundle: CompiledStoryBundle
  private syncEndpoint: string
  private listeners: Set<SyncEventListener> = new Set()
  private isOnline: boolean = true
  private isSyncing: boolean = false
  private lastSyncTime: number | null = null
  private checkInterval: number | null = null
  private pendingSync: boolean = false

  constructor(stackId: string, bundle: CompiledStoryBundle, syncEndpoint?: string) {
    this.stackId = stackId
    this.bundle = bundle
    this.syncEndpoint = syncEndpoint || '/api/wasm/sync'

    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }
  }

  /**
   * Starts periodic sync checking
   */
  startAutoSync(intervalMs: number = 60000): void {
    if (this.checkInterval) {
      this.stopAutoSync()
    }

    this.checkInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.checkForUpdates()
      }
    }, intervalMs)

    // Check immediately
    if (this.isOnline) {
      this.checkForUpdates()
    }
  }

  /**
   * Stops periodic sync checking
   */
  stopAutoSync(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Checks for updates on the server
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.isOnline || this.isSyncing) {
      return false
    }

    try {
      const response = await fetch(
        `${this.syncEndpoint}?stackId=${this.stackId}&checksum=${this.bundle.checksum}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      if (data.hasUpdates) {
        this.emit({
          type: 'update_available',
          timestamp: Date.now(),
          data: {
            serverChecksum: data.checksum,
            serverUpdatedAt: data.updatedAt,
          },
        })
        this.pendingSync = true
        return true
      }

      return false
    } catch (error) {
      console.warn('Failed to check for updates:', error)
      return false
    }
  }

  /**
   * Fetches and applies the latest bundle from server
   */
  async syncFromServer(): Promise<CompiledStoryBundle | null> {
    if (!this.isOnline || this.isSyncing) {
      return null
    }

    this.isSyncing = true
    this.emit({ type: 'sync_started', timestamp: Date.now() })

    try {
      const response = await fetch(`${this.syncEndpoint}?stackId=${this.stackId}&full=true`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`)
      }

      const newBundle: CompiledStoryBundle = await response.json()

      this.bundle = newBundle
      this.lastSyncTime = Date.now()
      this.pendingSync = false

      this.emit({
        type: 'sync_completed',
        timestamp: Date.now(),
        data: { bundle: newBundle },
      })

      return newBundle
    } catch (error) {
      this.emit({
        type: 'sync_failed',
        timestamp: Date.now(),
        data: { error: error instanceof Error ? error.message : 'Sync failed' },
      })
      return null
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * Gets the current sync capabilities
   */
  getCapabilities(): SyncCapabilities {
    return {
      canSync: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingUpdates: this.pendingSync ? 1 : 0,
      syncEndpoint: this.syncEndpoint,
    }
  }

  /**
   * Gets the current bundle
   */
  getBundle(): CompiledStoryBundle {
    return this.bundle
  }

  /**
   * Updates the local bundle
   */
  updateBundle(bundle: CompiledStoryBundle): void {
    this.bundle = bundle
  }

  /**
   * Subscribes to sync events
   */
  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Emits a sync event
   */
  private emit(event: SyncEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('Sync event listener error:', error)
      }
    })
  }

  /**
   * Handles coming online
   */
  private handleOnline = (): void => {
    this.isOnline = true
    this.emit({
      type: 'connectivity_changed',
      timestamp: Date.now(),
      data: { isOnline: true },
    })

    // Check for updates when coming online
    this.checkForUpdates()
  }

  /**
   * Handles going offline
   */
  private handleOffline = (): void => {
    this.isOnline = false
    this.emit({
      type: 'connectivity_changed',
      timestamp: Date.now(),
      data: { isOnline: false },
    })
  }

  /**
   * Whether currently online
   */
  get online(): boolean {
    return this.isOnline
  }

  /**
   * Whether currently syncing
   */
  get syncing(): boolean {
    return this.isSyncing
  }

  /**
   * Whether there are pending updates
   */
  get hasPendingUpdates(): boolean {
    return this.pendingSync
  }

  /**
   * Destroys the sync manager
   */
  destroy(): void {
    this.stopAutoSync()

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline)
      window.removeEventListener('offline', this.handleOffline)
    }

    this.listeners.clear()
  }
}

/**
 * Creates a new sync manager instance
 */
export function createSyncManager(
  stackId: string,
  bundle: CompiledStoryBundle,
  syncEndpoint?: string
): WasmSyncManager {
  return new WasmSyncManager(stackId, bundle, syncEndpoint)
}

/**
 * Hook-like function for React components to use sync status
 */
export function useSyncStatus(
  syncManager: WasmSyncManager | null
): {
  isOnline: boolean
  isSyncing: boolean
  hasPendingUpdates: boolean
  lastSyncTime: number | null
} {
  if (!syncManager) {
    return {
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      hasPendingUpdates: false,
      lastSyncTime: null,
    }
  }

  const caps = syncManager.getCapabilities()
  return {
    isOnline: syncManager.online,
    isSyncing: syncManager.syncing,
    hasPendingUpdates: syncManager.hasPendingUpdates,
    lastSyncTime: caps.lastSyncTime,
  }
}
