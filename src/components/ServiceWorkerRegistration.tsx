'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        console.log('Service Worker registered:', registration.scope)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('New service worker available')
                // Optionally prompt user to refresh
              }
            })
          }
        })

        // Request background sync permission if available
        if ('sync' in registration) {
          try {
            await (registration as any).sync.register('sync-stories')
          } catch (error) {
            console.warn('Background sync not available:', error)
          }
        }

        // Request periodic sync permission if available
        if ('periodicSync' in registration) {
          try {
            const status = await navigator.permissions.query({
              name: 'periodic-background-sync' as any,
            })
            if (status.state === 'granted') {
              await (registration as any).periodicSync.register('sync-stories', {
                minInterval: 60 * 60 * 1000, // 1 hour
              })
            }
          } catch (error) {
            console.warn('Periodic sync not available:', error)
          }
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }

    registerSW()

    // Cleanup on unmount
    return () => {
      // Optionally unregister service worker
    }
  }, [])

  // This component doesn't render anything
  return null
}
