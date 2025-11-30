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
 * Server-side layout caching:
 * - For large graphs (>20 nodes), uses server action to compute layout
 * - Cached results are served with 5-minute TTL
 * - Falls back to client-side computation when offline or for small graphs
 */

// Threshold for using server-side layout (larger graphs benefit more)
const SERVER_LAYOUT_THRESHOLD = 20

export function useStoryGraphData() {
  const { storyCards, choices, currentCardId, storyStack, characters, collapsedNodes } = useEditor()

  // Get store actions and subscribe to state
  const syncFromEditor = useStoryGraphStore(state => state.syncFromEditor)
  const syncFromEditorWithServerLayout = useStoryGraphStore(state => state.syncFromEditorWithServerLayout)
  const setUseServerLayout = useStoryGraphStore(state => state.setUseServerLayout)
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

  // Determine if server layout should be used based on graph size
  const shouldUseServerLayout = storyCards.length >= SERVER_LAYOUT_THRESHOLD

  // Memoized sync function that chooses between client and server layout
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
      if (shouldUseServerLayout && storyStack?.id) {
        // Enable server layout and use async sync
        setUseServerLayout(true)
        await syncFromEditorWithServerLayout(data)
      } else {
        // Small graphs use synchronous client-side layout
        setUseServerLayout(false)
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
    shouldUseServerLayout,
    syncFromEditor,
    syncFromEditorWithServerLayout,
    setUseServerLayout,
  ])

  // Sync editor data to store whenever it changes
  useEffect(() => {
    syncData()
  }, [syncData])

  return { nodes, edges, analysis, hiddenNodes }
}
