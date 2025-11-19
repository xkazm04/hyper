'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState, useEffect } from 'react'
import { syncService } from '@/lib/services/sync'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache story data for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep in cache for 30 minutes (longer for offline support)
            gcTime: 30 * 60 * 1000,
            // Retry failed requests 3 times
            retry: 3,
            // Refetch on window focus for fresh data
            refetchOnWindowFocus: true,
            // Refetch when reconnecting
            refetchOnReconnect: true,
            // Network mode: offline-first
            networkMode: 'offlineFirst',
          },
          mutations: {
            // Mutations should also work offline
            networkMode: 'offlineFirst',
            // Retry mutations once
            retry: 1,
          },
        },
      })
  )

  // Initialize sync service on mount
  useEffect(() => {
    // Start automatic sync every 30 seconds
    syncService.startAutoSync(30000)

    // Initial sync on mount
    syncService.sync()

    return () => {
      syncService.stopAutoSync()
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
