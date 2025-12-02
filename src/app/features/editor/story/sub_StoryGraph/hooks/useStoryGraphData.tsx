import { useEffect, useRef, useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import {
  useStoryGraphStore,
  selectNodes,
  selectEdges,
  selectAnalysis,
  selectHiddenNodes,
  initializeStreamSubscription,
} from '../lib/storyGraphStore'

/**
 * Main hook for story graph data with Zustand store integration
 *
 * This hook syncs data from EditorContext to the Zustand store,
 * which handles memoized layout computation. The store ensures:
 * - Layout recalculation only happens when story structure changes
 * - Selection updates don't trigger expensive dagre runs
 * - Components using this hook only re-render when their data slice changes
 *
 * Reactive Stream Integration:
 * - Initializes subscription to GraphStreamHub for reactive updates
 * - Uses debounced stream for structural changes (150ms)
 * - Uses throttled stream for selection changes (100ms)
 *
 * Layout Strategy (prioritized):
 * 1. Web Worker layout (default): Offloads heavy dagre to background thread
 * 2. Server-side layout: For large graphs when worker unavailable
 * 3. Main thread layout: Fallback for small graphs or when all else fails
 *
 * Caching:
 * - Worker-level cache with 5-minute TTL
 * - Session cache for instant view toggle rendering
 */

// Threshold for using async layout (worker or server)
const ASYNC_LAYOUT_THRESHOLD = 10

export function useStoryGraphData() {
  const { storyCards, choices, currentCardId, storyStack, characters, collapsedNodes } = useEditor()

  // Get store actions and subscribe to state
  const syncFromEditor = useStoryGraphStore(state => state.syncFromEditor)
  const syncFromEditorWithWorkerLayout = useStoryGraphStore(state => state.syncFromEditorWithWorkerLayout)
  const syncFromEditorWithServerLayout = useStoryGraphStore(state => state.syncFromEditorWithServerLayout)
  const setUseWorkerLayout = useStoryGraphStore(state => state.setUseWorkerLayout)
  const nodes = useStoryGraphStore(selectNodes)
  const edges = useStoryGraphStore(selectEdges)
  const analysis = useStoryGraphStore(selectAnalysis)
  const hiddenNodes = useStoryGraphStore(selectHiddenNodes)

  // Track if we're currently syncing to prevent duplicate calls
  const isSyncingRef = useRef(false)

  // Initialize stream subscription once
  useEffect(() => {
    const cleanup = initializeStreamSubscription()
    return cleanup
  }, [])

  // Determine if async layout (worker) should be used based on graph size
  const shouldUseAsyncLayout = storyCards.length >= ASYNC_LAYOUT_THRESHOLD

  // Memoized sync function that chooses between worker, server, and client layout
  const syncData = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true

    const data = {
      storyCards,
      choices,
      characters,
      storyStack,
      collapsedNodes,
      currentCardId,
    }

    try {
      if (shouldUseAsyncLayout && storyStack?.id) {
        // Use Web Worker for heavy layout computation (off main thread)
        setUseWorkerLayout(true)
        await syncFromEditorWithWorkerLayout(data)
      } else {
        // Small graphs use synchronous client-side layout
        setUseWorkerLayout(false)
        syncFromEditor(data)
      }
    } finally {
      isSyncingRef.current = false
    }
  }, [
    storyCards,
    choices,
    characters,
    storyStack,
    collapsedNodes,
    currentCardId,
    shouldUseAsyncLayout,
    syncFromEditor,
    syncFromEditorWithWorkerLayout,
    setUseWorkerLayout,
  ])

  // Sync editor data to store whenever it changes
  useEffect(() => {
    syncData()
  }, [syncData])

  return { nodes, edges, analysis, hiddenNodes }
}
