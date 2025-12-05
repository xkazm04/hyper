'use client'

import { useState, useEffect } from 'react'
import { syncService, SyncStatus, SyncEvent } from '@/lib/services/sync/index'

/**
 * Hook to get the current sync status
 * @returns Current sync status and event handlers
 */
export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  })
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null)

  useEffect(() => {
    // Get initial status
    syncService.getStatus().then(setStatus)

    // Subscribe to sync events
    const unsubscribe = syncService.subscribe((event) => {
      setLastEvent(event)

      // Update status on relevant events
      if (event.type === 'connectivity_changed') {
        setStatus(prev => ({
          ...prev,
          isOnline: event.data?.isOnline ?? prev.isOnline,
        }))
      }

      if (event.type === 'sync_started') {
        setStatus(prev => ({
          ...prev,
          isSyncing: true,
        }))
      }

      if (
        event.type === 'sync_completed' ||
        event.type === 'sync_failed' ||
        event.type === 'item_synced' ||
        event.type === 'item_failed'
      ) {
        syncService.getStatus().then(setStatus)
      }
    })

    return unsubscribe
  }, [])

  const triggerSync = () => {
    syncService.sync()
  }

  return {
    ...status,
    lastEvent,
    triggerSync,
  }
}
