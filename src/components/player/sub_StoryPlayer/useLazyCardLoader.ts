'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { StoryCard, Choice } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { mapStoryCard, mapChoices } from '@/lib/services/story/types'

/**
 * Card data with choices - what we cache and return
 */
export interface CardWithChoices {
  card: StoryCard
  choices: Choice[]
}

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  data: CardWithChoices
  timestamp: number
}

/**
 * Result from the lazy card loader hook
 */
export interface LazyCardLoaderResult {
  /** Current card with choices, null during initial load */
  currentCardData: CardWithChoices | null
  /** Whether the current card is loading */
  loading: boolean
  /** Any error that occurred */
  error: Error | null
  /** Load a specific card by ID */
  loadCard: (cardId: string) => Promise<void>
  /** Load the first card of a story */
  loadFirstCard: (storyStackId: string, firstCardId?: string | null) => Promise<void>
  /** Prefetch cards for given choice targets */
  prefetchChoiceTargets: (choices: Choice[]) => void
  /** Get a cached card if available */
  getCachedCard: (cardId: string) => CardWithChoices | undefined
  /** Check if a card is cached */
  isCardCached: (cardId: string) => boolean
  /** Total number of cached cards */
  cacheSize: number
}

// Cache TTL: 10 minutes
const CACHE_TTL_MS = 10 * 60 * 1000

/**
 * useLazyCardLoader - Progressive loading for story cards
 *
 * Instead of loading all cards upfront, this hook:
 * 1. Loads only the current card + its choices in a single query
 * 2. Prefetches 1-2 cards ahead based on choice targets
 * 3. Caches visited cards in memory for instant back-navigation
 *
 * This dramatically improves initial load time for large stories (100+ cards)
 * while maintaining smooth navigation through prefetching.
 */
export function useLazyCardLoader(): LazyCardLoaderResult {
  const [currentCardData, setCurrentCardData] = useState<CardWithChoices | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // In-memory cache for visited cards
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())

  // Track in-flight requests to avoid duplicates
  const pendingRequestsRef = useRef<Map<string, Promise<CardWithChoices | null>>>(new Map())

  // Supabase client
  const supabaseRef = useRef(createClient())

  /**
   * Clean expired cache entries
   */
  const cleanCache = useCallback(() => {
    const now = Date.now()
    const cache = cacheRef.current
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(key)
      }
    }
  }, [])

  // Periodic cache cleanup
  useEffect(() => {
    const interval = setInterval(cleanCache, CACHE_TTL_MS / 2)
    return () => clearInterval(interval)
  }, [cleanCache])

  /**
   * Fetch a card with its choices in a single query
   */
  const fetchCardWithChoices = useCallback(async (cardId: string): Promise<CardWithChoices | null> => {
    // Check if already fetching this card
    const pendingRequest = pendingRequestsRef.current.get(cardId)
    if (pendingRequest) {
      return pendingRequest
    }

    // Check cache first
    const cached = cacheRef.current.get(cardId)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data
    }

    // Create the fetch promise
    const fetchPromise = (async (): Promise<CardWithChoices | null> => {
      const supabase = supabaseRef.current

      // Fetch card and choices in parallel for optimal performance
      const [cardResult, choicesResult] = await Promise.all([
        supabase
          .from('story_cards')
          .select('*')
          .eq('id', cardId)
          .single(),
        supabase
          .from('choices')
          .select('*')
          .eq('story_card_id', cardId)
          .order('order_index', { ascending: true })
      ])

      if (cardResult.error) {
        if (cardResult.error.code === 'PGRST116') {
          return null // Card not found
        }
        throw new Error(cardResult.error.message)
      }

      if (choicesResult.error) {
        throw new Error(choicesResult.error.message)
      }

      const card = mapStoryCard(cardResult.data)
      const choices = mapChoices(choicesResult.data || [])

      const result: CardWithChoices = { card, choices }

      // Cache the result
      cacheRef.current.set(cardId, {
        data: result,
        timestamp: Date.now()
      })

      return result
    })()

    // Track the pending request
    pendingRequestsRef.current.set(cardId, fetchPromise)

    try {
      const result = await fetchPromise
      return result
    } finally {
      pendingRequestsRef.current.delete(cardId)
    }
  }, [])

  /**
   * Load a specific card and set it as current
   */
  const loadCard = useCallback(async (cardId: string) => {
    try {
      setLoading(true)
      setError(null)

      const data = await fetchCardWithChoices(cardId)

      if (data) {
        setCurrentCardData(data)
      } else {
        setError(new Error(`Card ${cardId} not found`))
      }
    } catch (err) {
      console.error('Failed to load card:', err)
      setError(err instanceof Error ? err : new Error('Failed to load card'))
    } finally {
      setLoading(false)
    }
  }, [fetchCardWithChoices])

  /**
   * Load the first card of a story
   */
  const loadFirstCard = useCallback(async (storyStackId: string, firstCardId?: string | null) => {
    try {
      setLoading(true)
      setError(null)

      let cardIdToLoad = firstCardId

      // If no firstCardId, find the first card by order_index
      if (!cardIdToLoad) {
        const supabase = supabaseRef.current
        const { data, error: fetchError } = await supabase
          .from('story_cards')
          .select('id')
          .eq('story_stack_id', storyStackId)
          .order('order_index', { ascending: true })
          .limit(1)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError(new Error('No cards found in this story'))
            return
          }
          throw new Error(fetchError.message)
        }

        cardIdToLoad = (data as { id: string }).id
      }

      const cardData = await fetchCardWithChoices(cardIdToLoad as string)

      if (cardData) {
        setCurrentCardData(cardData)
      } else {
        setError(new Error('First card not found'))
      }
    } catch (err) {
      console.error('Failed to load first card:', err)
      setError(err instanceof Error ? err : new Error('Failed to load story'))
    } finally {
      setLoading(false)
    }
  }, [fetchCardWithChoices])

  /**
   * Prefetch cards for given choice targets
   * This runs in the background after the current card loads
   */
  const prefetchChoiceTargets = useCallback((choices: Choice[]) => {
    // Prefetch first 2 choice targets (most likely to be selected)
    const targetIds = choices
      .slice(0, 2)
      .map(c => c.targetCardId)
      .filter(id => !cacheRef.current.has(id))

    // Fire and forget - prefetch in background
    targetIds.forEach(targetId => {
      fetchCardWithChoices(targetId).catch(err => {
        // Silent fail for prefetch - it's just an optimization
        console.debug('Prefetch failed for card:', targetId, err)
      })
    })
  }, [fetchCardWithChoices])

  /**
   * Get a cached card if available
   */
  const getCachedCard = useCallback((cardId: string): CardWithChoices | undefined => {
    const entry = cacheRef.current.get(cardId)
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
      return entry.data
    }
    return undefined
  }, [])

  /**
   * Check if a card is cached
   */
  const isCardCached = useCallback((cardId: string): boolean => {
    const entry = cacheRef.current.get(cardId)
    return !!entry && Date.now() - entry.timestamp < CACHE_TTL_MS
  }, [])

  return {
    currentCardData,
    loading,
    error,
    loadCard,
    loadFirstCard,
    prefetchChoiceTargets,
    getCachedCard,
    isCardCached,
    cacheSize: cacheRef.current.size
  }
}
