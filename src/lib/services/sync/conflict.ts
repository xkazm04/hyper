// Conflict resolution utilities for sync operations
// This module handles conflict detection and resolution strategies

import type { SyncQueueItem } from '../indexeddb'

export type ConflictResolutionStrategy = 'local_wins' | 'remote_wins' | 'merge' | 'manual'

export interface ConflictInfo {
  itemId: string
  entityType: string
  localTimestamp: number
  remoteTimestamp?: number
  strategy: ConflictResolutionStrategy
}

export class ConflictService {
  private defaultStrategy: ConflictResolutionStrategy = 'local_wins'

  setDefaultStrategy(strategy: ConflictResolutionStrategy): void {
    this.defaultStrategy = strategy
  }

  getDefaultStrategy(): ConflictResolutionStrategy {
    return this.defaultStrategy
  }

  /**
   * Detect if there's a conflict between local and remote versions
   * Currently returns false as conflict detection requires server-side support
   */
  async detectConflict(item: SyncQueueItem): Promise<boolean> {
    // Future implementation: compare local timestamp with server version
    // For now, we assume no conflicts (local always wins)
    return false
  }

  /**
   * Resolve a conflict based on the configured strategy
   */
  async resolveConflict(
    item: SyncQueueItem,
    strategy?: ConflictResolutionStrategy
  ): Promise<'use_local' | 'use_remote' | 'merge'> {
    const resolveStrategy = strategy || this.defaultStrategy

    switch (resolveStrategy) {
      case 'local_wins':
        return 'use_local'
      case 'remote_wins':
        return 'use_remote'
      case 'merge':
        return 'merge'
      case 'manual':
        // In manual mode, default to local for now
        // Future: emit event for user to decide
        return 'use_local'
      default:
        return 'use_local'
    }
  }

  /**
   * Get conflict info for a sync item
   */
  getConflictInfo(item: SyncQueueItem): ConflictInfo {
    return {
      itemId: item.id,
      entityType: item.entityType,
      localTimestamp: item.timestamp,
      strategy: this.defaultStrategy,
    }
  }
}
