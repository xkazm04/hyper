import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Node, useReactFlow } from 'reactflow'
import Fuse from 'fuse.js'
import type { StoryNodeData } from '../components/StoryNode'

export interface SearchResult {
  item: Node<StoryNodeData>
  refIndex: number
  score?: number
}

export interface UseNodeSearchOptions {
  /** Minimum query length to start searching */
  minQueryLength?: number
  /** Fuse.js threshold (0 = exact, 1 = fuzzy) */
  threshold?: number
  /** Debounce delay in ms */
  debounceMs?: number
}

const DEFAULT_OPTIONS: UseNodeSearchOptions = {
  minQueryLength: 1,
  threshold: 0.4,
  debounceMs: 100,
}

/**
 * Hook for fuzzy searching story graph nodes with keyboard navigation
 * and viewport panning to highlighted results.
 */
export function useNodeSearch(
  nodes: Node<StoryNodeData>[],
  options: UseNodeSearchOptions = {}
) {
  const { minQueryLength, threshold, debounceMs } = { ...DEFAULT_OPTIONS, ...options }
  const reactFlowInstance = useReactFlow()

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce query updates
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query)
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, debounceMs])

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(nodes, {
      keys: [
        { name: 'data.label', weight: 2 }, // Title has higher weight
        { name: 'id', weight: 0.5 },
      ],
      threshold,
      includeScore: true,
      shouldSort: true,
    })
  }, [nodes, threshold])

  // Get search results
  const results: SearchResult[] = useMemo(() => {
    if (debouncedQuery.length < (minQueryLength ?? 1)) {
      return []
    }
    return fuse.search(debouncedQuery)
  }, [fuse, debouncedQuery, minQueryLength])

  // Get highlighted node IDs (all matching nodes)
  const highlightedNodeIds = useMemo(() => {
    return new Set(results.map(r => r.item.id))
  }, [results])

  // Get the currently selected result
  const selectedResult = results[selectedIndex] ?? null

  // Pan viewport to a specific node
  const panToNode = useCallback((nodeId: string, duration = 800) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || !reactFlowInstance) return

    // Calculate center position of the node
    const x = node.position.x + ((node.data?.nodeWidth ?? 140) / 2)
    const y = node.position.y + 50 // Approximate height center

    reactFlowInstance.setCenter(x, y, { duration, zoom: 1 })
  }, [nodes, reactFlowInstance])

  // Pan to first result when results change
  useEffect(() => {
    if (results.length > 0 && selectedIndex === 0) {
      panToNode(results[0].item.id)
    }
  }, [results, selectedIndex, panToNode])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => {
          const next = Math.min(prev + 1, results.length - 1)
          panToNode(results[next].item.id)
          return next
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => {
          const next = Math.max(prev - 1, 0)
          panToNode(results[next].item.id)
          return next
        })
        break
      case 'Enter':
        e.preventDefault()
        if (selectedResult) {
          panToNode(selectedResult.item.id, 500)
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setQuery('')
        setSelectedIndex(0)
        break
    }
  }, [isOpen, results, selectedResult, panToNode])

  // Navigate to a specific result by index
  const navigateToResult = useCallback((index: number) => {
    if (index >= 0 && index < results.length) {
      setSelectedIndex(index)
      panToNode(results[index].item.id)
    }
  }, [results, panToNode])

  // Open search (focus input)
  const openSearch = useCallback(() => {
    setIsOpen(true)
  }, [])

  // Close search and clear query
  const closeSearch = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setDebouncedQuery('')
    setSelectedIndex(0)
  }, [])

  // Update query and open if not already open
  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery)
    setSelectedIndex(0)
    if (newQuery.length > 0 && !isOpen) {
      setIsOpen(true)
    }
  }, [isOpen])

  return {
    query,
    setQuery: updateQuery,
    results,
    selectedIndex,
    selectedResult,
    highlightedNodeIds,
    isOpen,
    openSearch,
    closeSearch,
    handleKeyDown,
    navigateToResult,
    panToNode,
    resultCount: results.length,
    hasResults: results.length > 0,
  }
}
