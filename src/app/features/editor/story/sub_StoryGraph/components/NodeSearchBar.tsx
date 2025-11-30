'use client'

import React, { useRef, useEffect, useCallback } from 'react'
import { Search, X, ChevronUp, ChevronDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResult } from '../hooks/useNodeSearch'

export interface NodeSearchBarProps {
  query: string
  setQuery: (query: string) => void
  results: SearchResult[]
  selectedIndex: number
  isOpen: boolean
  onKeyDown: (e: React.KeyboardEvent) => void
  onResultClick: (index: number) => void
  isHalloween?: boolean
}

/**
 * Search bar component for finding nodes in the story graph.
 * Features fuzzy search, keyboard navigation, and result highlighting.
 */
export function NodeSearchBar({
  query,
  setQuery,
  results,
  selectedIndex,
  isOpen,
  onKeyDown,
  onResultClick,
  isHalloween = false,
}: NodeSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Focus input when search opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.querySelector(`[data-result-index="${selectedIndex}"]`)
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, results.length])

  // Handle keyboard shortcut (Ctrl/Cmd + F) to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const handleClear = useCallback(() => {
    setQuery('')
    inputRef.current?.focus()
  }, [setQuery])

  const showResults = query.length > 0 && results.length > 0

  return (
    <div
      className={cn(
        'relative w-72 z-10',
        isHalloween && 'halloween-search-glow'
      )}
      data-testid="node-search-container"
    >
      {/* Search Input */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all duration-200',
          'bg-card shadow-md',
          isHalloween
            ? 'border-purple-500/50 focus-within:border-orange-500'
            : 'border-border focus-within:border-primary',
          showResults && 'rounded-b-none'
        )}
      >
        <Search
          className={cn(
            'w-4 h-4 flex-shrink-0',
            isHalloween ? 'text-orange-400' : 'text-muted-foreground'
          )}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search nodes... (Ctrl+F)"
          className={cn(
            'flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground',
            isHalloween ? 'text-orange-100' : 'text-foreground'
          )}
          data-testid="node-search-input"
          aria-label="Search story nodes"
          aria-expanded={showResults}
          aria-controls="search-results-list"
          aria-activedescendant={showResults ? `search-result-${selectedIndex}` : undefined}
          role="combobox"
        />
        {query.length > 0 && (
          <>
            <span
              className={cn(
                'text-xs font-medium px-1.5 py-0.5 rounded',
                isHalloween
                  ? 'bg-purple-900/50 text-purple-300'
                  : 'bg-muted text-muted-foreground'
              )}
              data-testid="node-search-count"
            >
              {results.length}
            </span>
            <button
              onClick={handleClear}
              className={cn(
                'p-0.5 rounded hover:bg-muted transition-colors',
                isHalloween && 'hover:bg-purple-800/50'
              )}
              data-testid="node-search-clear-btn"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          id="search-results-list"
          role="listbox"
          className={cn(
            'absolute top-full left-0 right-0 max-h-64 overflow-y-auto rounded-b-lg border-2 border-t-0 shadow-lg',
            isHalloween
              ? 'bg-card border-purple-500/50'
              : 'bg-card border-border'
          )}
          data-testid="node-search-results"
        >
          {results.map((result, index) => {
            const isSelected = index === selectedIndex
            const node = result.item
            const status = node.data.isFirst
              ? 'start'
              : node.data.isOrphaned
              ? 'orphan'
              : node.data.isDeadEnd
              ? 'dead-end'
              : 'normal'

            return (
              <div
                key={node.id}
                id={`search-result-${index}`}
                role="option"
                aria-selected={isSelected}
                data-result-index={index}
                onClick={() => onResultClick(index)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                  isSelected
                    ? isHalloween
                      ? 'bg-purple-800/50'
                      : 'bg-primary/10'
                    : 'hover:bg-muted/50',
                  'border-b last:border-b-0',
                  isHalloween ? 'border-purple-500/20' : 'border-border/50'
                )}
                data-testid={`node-search-result-${index}`}
              >
                {/* Status indicator */}
                <div
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    status === 'start'
                      ? isHalloween
                        ? 'bg-orange-500'
                        : 'bg-primary'
                      : status === 'orphan'
                      ? 'bg-amber-500'
                      : status === 'dead-end'
                      ? 'bg-red-500'
                      : isHalloween
                      ? 'bg-purple-400'
                      : 'bg-emerald-500'
                  )}
                />

                {/* Node title */}
                <span
                  className={cn(
                    'flex-1 text-sm truncate',
                    isHalloween ? 'text-orange-100' : 'text-foreground'
                  )}
                >
                  {node.data.label || 'Untitled'}
                </span>

                {/* Navigate indicator */}
                {isSelected && (
                  <MapPin
                    className={cn(
                      'w-3.5 h-3.5 flex-shrink-0',
                      isHalloween ? 'text-orange-400' : 'text-primary'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* No results message */}
      {query.length > 0 && results.length === 0 && (
        <div
          className={cn(
            'absolute top-full left-0 right-0 px-3 py-4 rounded-b-lg border-2 border-t-0 text-center',
            isHalloween
              ? 'bg-card border-purple-500/50 text-purple-300'
              : 'bg-card border-border text-muted-foreground'
          )}
          data-testid="node-search-no-results"
        >
          <p className="text-sm">No nodes found</p>
          <p className="text-xs mt-1 opacity-70">Try a different search term</p>
        </div>
      )}

      {/* Keyboard hints */}
      {showResults && (
        <div
          className={cn(
            'absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-3 text-[10px]',
            isHalloween ? 'text-purple-400/70' : 'text-muted-foreground/70'
          )}
        >
          <span className="flex items-center gap-1">
            <ChevronUp className="w-3 h-3" />
            <ChevronDown className="w-3 h-3" />
            navigate
          </span>
          <span>Enter to focus</span>
          <span>Esc to close</span>
        </div>
      )}
    </div>
  )
}
