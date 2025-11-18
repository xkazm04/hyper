import { PaginationStrategy } from '@/lib/types'

/**
 * Pagination Configuration
 *
 * This module provides configuration for pagination strategies across the application.
 * Two strategies are available:
 *
 * 1. OFFSET - Simple page-based pagination. Easy to implement and understand.
 *    Best for: Quick prototyping, small to medium datasets, when total page count is needed
 *    Drawbacks: Can show stale results when data is rapidly changing
 *
 * 2. CURSOR - Cursor-based pagination. More efficient for large datasets.
 *    Best for: Large datasets, real-time data, infinite scroll, performance-critical scenarios
 *    Drawbacks: More complex, no direct page jumping, no total count
 */

export const PAGINATION_CONFIG = {
  // Default strategy for the application
  defaultStrategy: (process.env.NEXT_PUBLIC_PAGINATION_STRATEGY || 'offset') as PaginationStrategy,

  // Strategy for specific features (can override default)
  explorePageStrategy: (process.env.NEXT_PUBLIC_EXPLORE_PAGINATION || 'offset') as PaginationStrategy,

  // Default page sizes
  defaultPageSize: 20,
  maxPageSize: 100,

  // A/B testing flag - randomly assign strategy if enabled
  enableABTesting: process.env.NEXT_PUBLIC_PAGINATION_AB_TEST === 'true',
  abTestSplitPercentage: 50, // Percentage of users getting cursor pagination
}

/**
 * Get pagination strategy for a specific user or session
 * If A/B testing is enabled, randomly assigns a strategy
 */
export function getPaginationStrategy(
  userId?: string,
  feature: 'explore' | 'default' = 'default'
): PaginationStrategy {
  // Check if A/B testing is enabled
  if (PAGINATION_CONFIG.enableABTesting && userId) {
    // Use a simple hash of userId to deterministically assign strategy
    const hash = Array.from(userId).reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const usesCursor = (hash % 100) < PAGINATION_CONFIG.abTestSplitPercentage
    return usesCursor ? 'cursor' : 'offset'
  }

  // Return feature-specific or default strategy
  if (feature === 'explore') {
    return PAGINATION_CONFIG.explorePageStrategy
  }

  return PAGINATION_CONFIG.defaultStrategy
}

/**
 * Get default page size
 */
export function getDefaultPageSize(): number {
  return PAGINATION_CONFIG.defaultPageSize
}

/**
 * Validate and clamp page size
 */
export function validatePageSize(size?: number): number {
  if (!size || size < 1) {
    return PAGINATION_CONFIG.defaultPageSize
  }
  return Math.min(size, PAGINATION_CONFIG.maxPageSize)
}
