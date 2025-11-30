'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, Check, AlertCircle, Cloud, CloudOff } from 'lucide-react'
import { syncService, SyncEvent, SyncStatus as SyncStatusType } from '@/lib/services/sync'
import { cn } from '@/lib/utils'

interface SyncStatusProps {
  className?: string
  showDetails?: boolean
}

export function SyncStatus({ className, showDetails = false }: SyncStatusProps) {
  const [status, setStatus] = useState<SyncStatusType>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    lastError: null,
  })
  const [lastEvent, setLastEvent] = useState<SyncEvent | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)

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

      if (event.type === 'sync_completed' || event.type === 'sync_failed') {
        // Immediately set isSyncing to false, then fetch full status
        setStatus(prev => ({
          ...prev,
          isSyncing: false,
        }))
        syncService.getStatus().then(setStatus)
      }

      if (event.type === 'item_synced' || event.type === 'item_failed') {
        syncService.getStatus().then(setStatus)
      }
    })

    // Listen for service worker sync triggers
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage)
    }

    return () => {
      unsubscribe()
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage)
      }
    }
  }, [])

  const handleSWMessage = (event: MessageEvent) => {
    if (event.data && event.data.type === 'TRIGGER_SYNC') {
      syncService.sync()
    }
  }

  const handleManualSync = () => {
    syncService.sync()
  }

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return 'Never'

    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  // Determine icon and color based on status
  const getStatusIndicator = () => {
    if (!status.isOnline) {
      return {
        icon: <CloudOff className="h-4 w-4" />,
        color: 'text-yellow-500',
        label: 'Offline',
      }
    }

    if (status.isSyncing) {
      return {
        icon: <RefreshCw className="h-4 w-4 animate-spin" />,
        color: 'text-blue-500',
        label: 'Syncing...',
      }
    }

    if (status.pendingCount > 0) {
      return {
        icon: <Cloud className="h-4 w-4" />,
        color: 'text-orange-500',
        label: `${status.pendingCount} pending`,
      }
    }

    if (lastEvent?.type === 'sync_failed') {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        color: 'text-red-500',
        label: 'Sync failed',
      }
    }

    return {
      icon: <Check className="h-4 w-4" />,
      color: 'text-green-500',
      label: 'Synced',
    }
  }

  const indicator = getStatusIndicator()

  return (
    <div
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      data-testid="sync-status"
    >
      <button
        onClick={handleManualSync}
        disabled={status.isSyncing || !status.isOnline}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors',
          'bg-card/95 backdrop-blur-sm border border-border',
          'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          indicator.color
        )}
        title={status.isOnline ? 'Click to sync now' : 'Offline - changes will sync when online'}
        data-testid="sync-status-btn"
      >
        {indicator.icon}
        {showDetails && (
          <span className="text-xs text-muted-foreground">{indicator.label}</span>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-48 rounded-md border bg-popover p-3 shadow-md',
            'text-popover-foreground'
          )}
          data-testid="sync-status-tooltip"
        >
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={cn('font-medium', indicator.color)}>
                {indicator.label}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Connection:</span>
              <span className="flex items-center gap-1">
                {status.isOnline ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-yellow-500" />
                    <span className="text-yellow-500">Offline</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last sync:</span>
              <span className="font-medium">
                {formatLastSync(status.lastSyncTime)}
              </span>
            </div>

            {status.pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-medium text-orange-500">
                  {status.pendingCount} change{status.pendingCount > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {!status.isOnline && status.pendingCount > 0 && (
              <p className="mt-2 text-muted-foreground">
                Changes will sync automatically when you&apos;re back online.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
