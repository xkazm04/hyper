/**
 * Layout Worker Manager
 *
 * Manages the Web Worker lifecycle and communication for DAG layout computation.
 * Provides:
 * - Singleton worker instance management
 * - Request/response correlation with promises
 * - Caching of computed layouts by structure hash
 * - Fallback to main thread when workers unavailable
 * - Request debouncing and cancellation
 */

import type {
  LayoutWorkerInput,
  LayoutWorkerMessage,
  LayoutWorkerOutput,
} from './layout.worker'

// Cache configuration
const LAYOUT_CACHE_MAX_SIZE = 50
const LAYOUT_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CachedLayout {
  positions: Record<string, { x: number; y: number }>
  structureHash: string
  createdAt: number
}

interface PendingRequest {
  resolve: (result: Record<string, { x: number; y: number }>) => void
  reject: (error: Error) => void
  structureHash: string
  createdAt: number
}

class LayoutWorkerManager {
  private worker: Worker | null = null
  private isWorkerSupported: boolean
  private pendingRequests: Map<string, PendingRequest> = new Map()
  private layoutCache: Map<string, CachedLayout> = new Map()
  private requestCounter: number = 0
  private initializationPromise: Promise<void> | null = null

  constructor() {
    this.isWorkerSupported = typeof Worker !== 'undefined'
  }

  /**
   * Lazily initializes the worker
   */
  private async initializeWorker(): Promise<void> {
    if (this.worker) return
    if (!this.isWorkerSupported) return

    // Prevent multiple concurrent initializations
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = new Promise((resolve) => {
      try {
        // Create worker using dynamic import for Next.js compatibility
        this.worker = new Worker(
          new URL('./layout.worker.ts', import.meta.url),
          { type: 'module' }
        )

        this.worker.onmessage = this.handleWorkerMessage.bind(this)

        this.worker.onerror = (error) => {
          console.error('[LayoutWorkerManager] Worker error:', error)
          // Reject all pending requests
          this.pendingRequests.forEach((request) => {
            request.reject(new Error(`Worker error: ${error.message}`))
          })
          this.pendingRequests.clear()
          // Mark worker as failed
          this.worker = null
          this.isWorkerSupported = false
        }

        resolve()
      } catch (error) {
        console.warn('[LayoutWorkerManager] Failed to create worker:', error)
        this.isWorkerSupported = false
        resolve()
      }
    })

    return this.initializationPromise
  }

  /**
   * Handles messages from the worker
   */
  private handleWorkerMessage(event: MessageEvent<LayoutWorkerMessage>): void {
    const message = event.data

    if (message.type === 'result') {
      const result = message as LayoutWorkerOutput
      const pendingRequest = this.pendingRequests.get(result.requestId)

      if (pendingRequest) {
        // Cache the result
        this.cacheLayout(result.structureHash, result.positions)

        // Resolve the promise
        pendingRequest.resolve(result.positions)
        this.pendingRequests.delete(result.requestId)

        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          console.debug(
            `[LayoutWorkerManager] Layout computed in ${result.computeTimeMs.toFixed(2)}ms`
          )
        }
      }
    } else if (message.type === 'error') {
      const pendingRequest = this.pendingRequests.get(message.requestId)

      if (pendingRequest) {
        pendingRequest.reject(new Error(message.error))
        this.pendingRequests.delete(message.requestId)
      }
    }
  }

  /**
   * Caches a layout result
   */
  private cacheLayout(
    structureHash: string,
    positions: Record<string, { x: number; y: number }>
  ): void {
    // Evict old entries if cache is full
    if (this.layoutCache.size >= LAYOUT_CACHE_MAX_SIZE) {
      const oldestKey = this.findOldestCacheEntry()
      if (oldestKey) {
        this.layoutCache.delete(oldestKey)
      }
    }

    this.layoutCache.set(structureHash, {
      positions,
      structureHash,
      createdAt: Date.now(),
    })
  }

  /**
   * Finds the oldest cache entry for eviction
   */
  private findOldestCacheEntry(): string | null {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    this.layoutCache.forEach((entry, key) => {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt
        oldestKey = key
      }
    })

    return oldestKey
  }

  /**
   * Gets a cached layout if available and not expired
   */
  public getCachedLayout(
    structureHash: string
  ): Record<string, { x: number; y: number }> | null {
    const cached = this.layoutCache.get(structureHash)

    if (!cached) {
      return null
    }

    // Check if expired
    if (Date.now() - cached.createdAt > LAYOUT_CACHE_TTL_MS) {
      this.layoutCache.delete(structureHash)
      return null
    }

    return cached.positions
  }

  /**
   * Generates a unique request ID
   */
  private generateRequestId(): string {
    this.requestCounter += 1
    return `layout-${Date.now()}-${this.requestCounter}`
  }

  /**
   * Creates a structure hash from graph data for cache key
   */
  public createStructureHash(
    cards: Array<{ id: string; title: string }>,
    choices: Array<{
      storyCardId: string
      targetCardId: string | null
      orderIndex: number
    }>,
    firstCardId: string | null,
    collapsedNodes: string[]
  ): string {
    const cardSignature = cards
      .map((c) => `${c.id}:${c.title.length}`)
      .sort()
      .join(',')

    const choiceSignature = choices
      .map((c) => `${c.storyCardId}->${c.targetCardId || 'null'}:${c.orderIndex}`)
      .sort()
      .join('|')

    const collapsedSignature = [...collapsedNodes].sort().join(',')

    return `${cardSignature}::${choiceSignature}::${firstCardId || 'null'}::${collapsedSignature}`
  }

  /**
   * Computes layout using the web worker
   * Falls back to synchronous computation if worker is unavailable
   */
  public async computeLayout(
    cards: Array<{ id: string; title: string }>,
    choices: Array<{
      id: string
      storyCardId: string
      targetCardId: string | null
      orderIndex: number
    }>,
    firstCardId: string | null,
    collapsedNodes: string[]
  ): Promise<Record<string, { x: number; y: number }>> {
    const structureHash = this.createStructureHash(
      cards,
      choices,
      firstCardId,
      collapsedNodes
    )

    // Check cache first
    const cached = this.getCachedLayout(structureHash)
    if (cached) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[LayoutWorkerManager] Cache hit for layout')
      }
      return cached
    }

    // Initialize worker if needed
    await this.initializeWorker()

    // If worker isn't available, we'll need to fall back
    // The store will handle the fallback to sync layout
    if (!this.worker) {
      throw new Error('Worker not available')
    }

    return new Promise((resolve, reject) => {
      const requestId = this.generateRequestId()

      // Store the pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        structureHash,
        createdAt: Date.now(),
      })

      // Send message to worker
      const message: LayoutWorkerInput = {
        type: 'compute',
        requestId,
        cards,
        choices,
        firstCardId,
        collapsedNodes,
        structureHash,
      }

      this.worker!.postMessage(message)

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          reject(new Error('Layout computation timed out'))
        }
      }, 10000)
    })
  }

  /**
   * Cancels a pending request by structure hash
   */
  public cancelPendingRequest(structureHash: string): void {
    this.pendingRequests.forEach((request, requestId) => {
      if (request.structureHash === structureHash) {
        this.pendingRequests.delete(requestId)
      }
    })
  }

  /**
   * Cancels all pending requests
   */
  public cancelAllPendingRequests(): void {
    this.pendingRequests.forEach((request) => {
      request.reject(new Error('Request cancelled'))
    })
    this.pendingRequests.clear()
  }

  /**
   * Clears the layout cache
   */
  public clearCache(): void {
    this.layoutCache.clear()
  }

  /**
   * Invalidates a specific cache entry
   */
  public invalidateCache(structureHash: string): void {
    this.layoutCache.delete(structureHash)
  }

  /**
   * Returns cache statistics for debugging
   */
  public getCacheStats(): {
    size: number
    maxSize: number
    pendingRequests: number
    workerActive: boolean
  } {
    return {
      size: this.layoutCache.size,
      maxSize: LAYOUT_CACHE_MAX_SIZE,
      pendingRequests: this.pendingRequests.size,
      workerActive: this.worker !== null,
    }
  }

  /**
   * Checks if worker-based layout is available
   */
  public isWorkerAvailable(): boolean {
    return this.isWorkerSupported
  }

  /**
   * Terminates the worker and cleans up resources
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.cancelAllPendingRequests()
    this.clearCache()
    this.initializationPromise = null
  }
}

// Singleton instance
let layoutWorkerManager: LayoutWorkerManager | null = null

/**
 * Gets the singleton LayoutWorkerManager instance
 */
export function getLayoutWorkerManager(): LayoutWorkerManager {
  if (!layoutWorkerManager) {
    layoutWorkerManager = new LayoutWorkerManager()
  }
  return layoutWorkerManager
}

/**
 * Terminates the layout worker manager (for cleanup)
 */
export function terminateLayoutWorkerManager(): void {
  if (layoutWorkerManager) {
    layoutWorkerManager.terminate()
    layoutWorkerManager = null
  }
}

export type { LayoutWorkerManager }
