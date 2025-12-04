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
            // Cache story data for 1 minute (reduced from 5 min for fresher data)
            staleTime: 60 * 1000,
            // Keep in cache for 10 minutes (reduced from 30 min)
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 3 times
            retry: 3,
            // Refetch on window focus for fresh data
            refetchOnWindowFocus: true,
            // Always refetch when component mounts
            refetchOnMount: 'always',
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
