/**
 * Layout Cache for Story Graph
 *
 * Provides two caching layers:
 * 1. Session cache: In-memory cache for instant view toggle rendering
 *    - Persists across view toggles within the same edit session
 *    - Invalidated only when choices are added, removed, or reordered
 *
 * 2. Server cache: TTL-based cache for server-side layout computation
 *    - Used for large graphs (>20 nodes)
 *    - Falls back to client-side if unavailable
 */

export interface CachedLayoutEntry {
  positions: Record<string, { x: number; y: number }>
  structureHash: string
  createdAt: number
  ttl: number
}

/**
 * Session cache entry for instant view toggle rendering
 * This cache persists for the entire edit session and is only invalidated
 * when the graph structure actually changes (choice add/remove/reorder)
 */
export interface SessionLayoutCache {
  positions: Map<string, { x: number; y: number }>
  structureHash: string
  choiceSignature: string  // Hash of choice connections only (for targeted invalidation)
  lastUpdated: number
}

// Default TTL: 5 minutes (300000ms)
const DEFAULT_TTL_MS = 5 * 60 * 1000

// Maximum cache size to prevent memory issues
const MAX_CACHE_SIZE = 100

// In-memory cache store for server-side caching
const layoutCache = new Map<string, CachedLayoutEntry>()

// Session cache store - persists across view toggles for instant rendering
const sessionLayoutCache = new Map<string, SessionLayoutCache>()

/**
 * Creates a cache key for a story stack's layout
 */
export function createLayoutCacheKey(stackId: string): string {
  return `layout:${stackId}`
}

/**
 * Creates a structure hash from cards and choices for cache invalidation.
 * Only includes properties that affect layout.
 */
export function createLayoutStructureHash(
  cardIds: string[],
  cardTitles: Record<string, string>,
  choiceConnections: Array<{ sourceId: string; targetId: string | null; orderIndex: number }>,
  firstCardId: string | null,
  collapsedNodes: string[]
): string {
  // Sort for consistent hashing
  const sortedCardIds = [...cardIds].sort()

  // Create choice signatures sorted for consistency
  const choiceSignatures = choiceConnections
    .map(c => `${c.sourceId}->${c.targetId || 'null'}:${c.orderIndex}`)
    .sort()
    .join('|')

  // Include title lengths as they affect node dimensions
  const titleSignatures = sortedCardIds
    .map(id => `${id}:${(cardTitles[id] || '').length}`)
    .join(',')

  // Include collapsed state
  const collapsedSignature = [...collapsedNodes].sort().join(',')

  return `${sortedCardIds.join(',')}::${choiceSignatures}::${firstCardId || 'null'}::${titleSignatures}::${collapsedSignature}`
}

/**
 * Gets a cached layout if valid (not expired and structure matches)
 */
export function getCachedLayout(
  stackId: string,
  currentStructureHash: string
): Record<string, { x: number; y: number }> | null {
  const key = createLayoutCacheKey(stackId)
  const entry = layoutCache.get(key)

  if (!entry) {
    return null
  }

  // Check if expired
  const now = Date.now()
  if (now - entry.createdAt > entry.ttl) {
    layoutCache.delete(key)
    return null
  }

  // Check if structure hash matches (cache still valid)
  if (entry.structureHash !== currentStructureHash) {
    layoutCache.delete(key)
    return null
  }

  return entry.positions
}

/**
 * Sets a cached layout
 */
export function setCachedLayout(
  stackId: string,
  positions: Record<string, { x: number; y: number }>,
  structureHash: string,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  const key = createLayoutCacheKey(stackId)

  // Evict old entries if cache is too large
  if (layoutCache.size >= MAX_CACHE_SIZE) {
    evictOldestEntries(Math.floor(MAX_CACHE_SIZE * 0.2))
  }

  layoutCache.set(key, {
    positions,
    structureHash,
    createdAt: Date.now(),
    ttl: ttlMs,
  })
}

/**
 * Invalidates the cache for a specific stack
 */
export function invalidateLayoutCache(stackId: string): void {
  const key = createLayoutCacheKey(stackId)
  layoutCache.delete(key)
}

/**
 * Clears the entire layout cache
 */
export function clearLayoutCache(): void {
  layoutCache.clear()
}

/**
 * Evicts the oldest N entries from the cache
 */
function evictOldestEntries(count: number): void {
  const entries = Array.from(layoutCache.entries())
    .sort((a, b) => a[1].createdAt - b[1].createdAt)

  for (let i = 0; i < Math.min(count, entries.length); i++) {
    layoutCache.delete(entries[i][0])
  }
}

/**
 * Gets cache statistics for debugging/monitoring
 */
export function getLayoutCacheStats(): {
  size: number
  maxSize: number
  entries: Array<{ stackId: string; age: number; structureHash: string }>
} {
  const now = Date.now()
  const entries = Array.from(layoutCache.entries()).map(([key, entry]) => ({
    stackId: key.replace('layout:', ''),
    age: now - entry.createdAt,
    structureHash: entry.structureHash.substring(0, 50) + '...',
  }))

  return {
    size: layoutCache.size,
    maxSize: MAX_CACHE_SIZE,
    entries,
  }
}

// ============================================================================
// Session Layout Cache - For Instant View Toggle Rendering
// ============================================================================

/**
 * Creates a choice signature for cache invalidation.
 * This only includes choice connection data, not other properties.
 * Cache is only invalidated when choices are added, removed, or reordered.
 */
export function createChoiceSignature(
  choiceConnections: Array<{ sourceId: string; targetId: string | null; orderIndex: number }>
): string {
  return choiceConnections
    .map(c => `${c.sourceId}->${c.targetId || 'null'}:${c.orderIndex}`)
    .sort()
    .join('|')
}

/**
 * Gets the session layout cache for a stack.
 * Returns null if cache doesn't exist or if choice structure has changed.
 *
 * @param stackId - The story stack ID
 * @param currentChoiceSignature - Current choice signature for validation
 * @returns Cached positions or null if cache miss
 */
export function getSessionLayoutCache(
  stackId: string,
  currentChoiceSignature: string
): Map<string, { x: number; y: number }> | null {
  const key = `session:${stackId}`
  const entry = sessionLayoutCache.get(key)

  if (!entry) {
    return null
  }

  // Only validate choice signature - positions are valid as long as choices haven't changed
  if (entry.choiceSignature !== currentChoiceSignature) {
    // Choice structure changed - invalidate cache
    sessionLayoutCache.delete(key)
    return null
  }

  return entry.positions
}

/**
 * Sets the session layout cache for a stack.
 * This cache persists across view toggles for instant rendering.
 *
 * @param stackId - The story stack ID
 * @param positions - Map of node ID to position
 * @param structureHash - Full structure hash
 * @param choiceSignature - Choice-only signature for targeted invalidation
 */
export function setSessionLayoutCache(
  stackId: string,
  positions: Map<string, { x: number; y: number }>,
  structureHash: string,
  choiceSignature: string
): void {
  const key = `session:${stackId}`

  // Evict old entries if cache is too large
  if (sessionLayoutCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries
    const entries = Array.from(sessionLayoutCache.entries())
      .sort((a, b) => a[1].lastUpdated - b[1].lastUpdated)

    for (let i = 0; i < Math.floor(MAX_CACHE_SIZE * 0.2); i++) {
      sessionLayoutCache.delete(entries[i][0])
    }
  }

  sessionLayoutCache.set(key, {
    positions,
    structureHash,
    choiceSignature,
    lastUpdated: Date.now(),
  })
}

/**
 * Updates positions in the session cache without changing the structure hash.
 * Useful for incremental layout updates that don't change the graph structure.
 *
 * @param stackId - The story stack ID
 * @param positions - Updated positions to merge
 */
export function updateSessionLayoutPositions(
  stackId: string,
  positions: Map<string, { x: number; y: number }>
): void {
  const key = `session:${stackId}`
  const entry = sessionLayoutCache.get(key)

  if (entry) {
    // Merge new positions with existing
    positions.forEach((pos, id) => {
      entry.positions.set(id, pos)
    })
    entry.lastUpdated = Date.now()
  }
}

/**
 * Invalidates the session layout cache for a specific stack.
 * Called when choices are added, removed, or reordered.
 */
export function invalidateSessionLayoutCache(stackId: string): void {
  const key = `session:${stackId}`
  sessionLayoutCache.delete(key)
}

/**
 * Clears all session layout caches.
 */
export function clearSessionLayoutCache(): void {
  sessionLayoutCache.clear()
}

/**
 * Checks if a valid session layout cache exists for the stack.
 * Useful for determining if instant rendering is possible.
 */
export function hasValidSessionCache(
  stackId: string,
  currentChoiceSignature: string
): boolean {
  const key = `session:${stackId}`
  const entry = sessionLayoutCache.get(key)

  if (!entry) return false

  return entry.choiceSignature === currentChoiceSignature
}

/**
 * Gets session cache statistics for debugging/monitoring.
 */
export function getSessionCacheStats(): {
  size: number
  maxSize: number
  entries: Array<{ stackId: string; age: number; nodeCount: number }>
} {
  const now = Date.now()
  const entries = Array.from(sessionLayoutCache.entries()).map(([key, entry]) => ({
    stackId: key.replace('session:', ''),
    age: now - entry.lastUpdated,
    nodeCount: entry.positions.size,
  }))

  return {
    size: sessionLayoutCache.size,
    maxSize: MAX_CACHE_SIZE,
    entries,
  }
}
