// WASM Runtime Utilities
// Helper functions for bundle generation and runtime operations

import type { StoryCard, Choice } from '@/lib/types'
import type { NavigationGraph } from './types'

/**
 * Generates a SHA-256 checksum for data integrity verification
 */
export async function generateChecksum(data: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback for environments without SubtleCrypto
  return simpleHash(data)
}

/**
 * Simple hash function fallback
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0')
}

/**
 * Estimates playtime based on content length and branching
 */
export function estimatePlaytime(
  cards: StoryCard[],
  choices: Choice[],
  navigation: NavigationGraph
): number {
  // Average reading speed: ~200 words per minute
  const WORDS_PER_MINUTE = 200
  // Average time per choice: 5 seconds
  const SECONDS_PER_CHOICE = 5

  let totalWords = 0
  let totalChoices = 0

  // Calculate total words in all cards
  for (const card of cards) {
    totalWords += countWords(card.title)
    totalWords += countWords(card.content)
    if (card.message) {
      totalWords += countWords(card.message)
    }
  }

  // Count choices in the main path (using BFS from entry)
  if (navigation.entryNodeId) {
    const visited = new Set<string>()
    const queue = [navigation.entryNodeId]

    while (queue.length > 0) {
      const cardId = queue.shift()!
      if (visited.has(cardId)) continue
      visited.add(cardId)

      const node = navigation.nodes[cardId]
      if (node) {
        totalChoices += node.outEdges.length
        // Add first target of each outgoing edge
        if (node.outEdges.length > 0) {
          const firstEdge = navigation.edges.find((e) => e.id === node.outEdges[0])
          if (firstEdge && !visited.has(firstEdge.targetCardId)) {
            queue.push(firstEdge.targetCardId)
          }
        }
      }
    }
  }

  // Calculate estimated time in seconds
  const readingTimeSeconds = (totalWords / WORDS_PER_MINUTE) * 60
  const choiceTimeSeconds = totalChoices * SECONDS_PER_CHOICE

  return Math.round(readingTimeSeconds + choiceTimeSeconds)
}

/**
 * Counts words in a string
 */
function countWords(text: string): number {
  if (!text) return 0
  return text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length
}

/**
 * Compresses data using built-in compression (if available)
 */
export async function compressData(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream !== 'undefined') {
    const stream = new CompressionStream('gzip')
    const writer = stream.writable.getWriter()
    // Copy to new Uint8Array to ensure proper ArrayBuffer type
    writer.write(new Uint8Array(data))
    writer.close()

    const compressedChunks: Uint8Array[] = []
    const reader = stream.readable.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) compressedChunks.push(new Uint8Array(value))
    }

    // Combine chunks
    const totalLength = compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of compressedChunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result
  }
  // Fallback: return uncompressed
  return data
}

/**
 * Decompresses gzip data
 */
export async function decompressData(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    const stream = new DecompressionStream('gzip')
    const writer = stream.writable.getWriter()
    // Copy to new Uint8Array to ensure proper ArrayBuffer type
    writer.write(new Uint8Array(data))
    writer.close()

    const decompressedChunks: Uint8Array[] = []
    const reader = stream.readable.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) decompressedChunks.push(new Uint8Array(value))
    }

    const totalLength = decompressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of decompressedChunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    return result
  }
  // Fallback: assume uncompressed
  return data
}

/**
 * Formats bytes into human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

/**
 * Formats seconds into human-readable duration
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
}

/**
 * Generates a unique runtime ID
 */
export function generateRuntimeId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `wasm-${timestamp}-${random}`
}

/**
 * Validates that a bundle can be loaded
 */
export function canLoadBundle(bundleSize: number, maxSize: number = 100 * 1024 * 1024): boolean {
  return bundleSize <= maxSize
}

/**
 * Deep freezes an object for immutability
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.keys(obj).forEach((prop) => {
    const value = (obj as Record<string, unknown>)[prop]
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value as object)
    }
  })
  return Object.freeze(obj)
}

/**
 * Clones data without references
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Debounce function for sync operations
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Creates a safe sandboxed context for script execution
 */
export function createSandbox(globals: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.freeze({
    // Safe built-ins
    Math,
    Date,
    String,
    Number,
    Boolean,
    Array,
    Object,
    JSON,
    // Console for debugging
    console: {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    },
    // Custom globals
    ...globals,
  })
}
