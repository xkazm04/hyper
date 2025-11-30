'use client'

import React from 'react'
import { Panel } from 'reactflow'
import { Node } from 'reactflow'
import { NodeSearchBar } from './NodeSearchBar'
import { useNodeSearch } from '../hooks/useNodeSearch'
import type { StoryNodeData } from './StoryNode'

export interface NodeSearchWrapperProps {
  nodes: Node<StoryNodeData>[]
  isHalloween: boolean
  onHighlightChange: (highlightedIds: Set<string>) => void
}

/**
 * Wrapper component that provides node search functionality.
 * Must be rendered inside ReactFlow to access useReactFlow hook.
 */
export function NodeSearchWrapper({
  nodes,
  isHalloween,
  onHighlightChange,
}: NodeSearchWrapperProps) {
  const {
    query,
    setQuery,
    results,
    selectedIndex,
    isOpen,
    handleKeyDown,
    navigateToResult,
    highlightedNodeIds,
  } = useNodeSearch(nodes)

  // Update parent when highlighted nodes change
  React.useEffect(() => {
    onHighlightChange(highlightedNodeIds)
  }, [highlightedNodeIds, onHighlightChange])

  return (
    <Panel position="top-center" className="mt-2">
      <NodeSearchBar
        query={query}
        setQuery={setQuery}
        results={results}
        selectedIndex={selectedIndex}
        isOpen={isOpen}
        onKeyDown={handleKeyDown}
        onResultClick={navigateToResult}
        isHalloween={isHalloween}
      />
    </Panel>
  )
}
