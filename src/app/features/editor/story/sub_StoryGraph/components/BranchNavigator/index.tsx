'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useEditor } from '@/contexts/EditorContext'
import { useBranchPath, PathNode } from '../../hooks/useBranchPath'
import { BranchSelector } from './BranchSelector'
import { LinearPathPreview } from './LinearPathPreview'
import {
  GitBranch,
  X,
  ChevronLeft,
  ChevronRight,
  Route,
  Eye,
  EyeOff
} from 'lucide-react'

export interface BranchNavigatorProps {
  /** Callback when a card in the path is clicked */
  onCardClick?: (cardId: string) => void
  /** Callback when path order changes via drag */
  onReorderPath?: (fromIndex: number, toIndex: number, pathNodes: PathNode[]) => void
}

/**
 * BranchNavigator - Interactive side-panel for navigating story branches
 *
 * Features:
 * - Select any node to view its outgoing branches
 * - Choose a branch to see a linear preview of the path
 * - Drag cards within the preview to reorder the path
 * - Real-time updates as the graph changes
 */
export function BranchNavigator({
  onCardClick,
  onReorderPath
}: BranchNavigatorProps) {
  const { theme } = useTheme()
  const { storyCards, choices, currentCardId, setCurrentCardId, storyStack } = useEditor()
  const isHalloween = theme === 'halloween'

  // Local state for branch navigator
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedBranchIndex, setSelectedBranchIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  // Use the branch path hook
  const {
    availableBranches,
    linearPath,
    selectNode,
    selectBranch,
    hasSelection
  } = useBranchPath(
    storyCards,
    choices,
    selectedNodeId,
    selectedBranchIndex,
    setSelectedNodeId,
    setSelectedBranchIndex
  )

  // Auto-select current card when it changes (if not already selected)
  const handleUseCurrentCard = useCallback(() => {
    if (currentCardId && currentCardId !== selectedNodeId) {
      selectNode(currentCardId)
    }
  }, [currentCardId, selectedNodeId, selectNode])

  // Handle card click in path preview
  const handleCardClick = useCallback((cardId: string) => {
    setCurrentCardId(cardId)
    onCardClick?.(cardId)
  }, [setCurrentCardId, onCardClick])

  // Handle path reorder via drag
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    onReorderPath?.(fromIndex, toIndex, linearPath)
  }, [linearPath, onReorderPath])

  // Handle close/clear selection
  const handleClearSelection = useCallback(() => {
    selectNode(null)
  }, [selectNode])

  // Get the selected node's title for display
  const selectedNodeTitle = useMemo(() => {
    if (!selectedNodeId) return null
    const card = storyCards.find(c => c.id === selectedNodeId)
    return card?.title || 'Untitled'
  }, [selectedNodeId, storyCards])

  // Check if selected node is the first card
  const isFirstCard = selectedNodeId === storyStack?.firstCardId

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border-2 shadow-lg transition-all pointer-events-auto',
          'hover:scale-105 active:scale-95',
          isHalloween
            ? 'bg-purple-900/90 border-orange-500/30 text-orange-100 hover:border-orange-500/50'
            : 'bg-card/95 border-border text-foreground hover:border-primary/50'
        )}
        data-testid="branch-navigator-expand-btn"
        aria-label="Expand branch navigator"
      >
        <Route className="w-4 h-4" />
        <span className="text-xs font-medium">Branch Navigator</span>
        <Eye className="w-3 h-3 opacity-60" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'w-72 rounded-xl border-2 shadow-xl overflow-hidden transition-all pointer-events-auto',
        isHalloween
          ? 'bg-card/95 border-orange-500/30 backdrop-blur-sm'
          : 'bg-card border-border backdrop-blur-sm'
      )}
      data-testid="branch-navigator-panel"
    >
        {/* Header */}
        <div
          className={cn(
            'flex items-center gap-2 px-3 py-2 border-b',
            isHalloween ? 'border-orange-500/20 bg-purple-900/30' : 'border-border bg-muted/30'
          )}
        >
          <Route className={cn(
            'w-4 h-4',
            isHalloween ? 'text-orange-400' : 'text-primary'
          )} />
          <h3 className={cn(
            'text-sm font-bold flex-1',
            isHalloween ? 'text-orange-100' : 'text-foreground'
          )}>
            Branch Navigator
          </h3>
          <button
            onClick={() => setIsMinimized(true)}
            className={cn(
              'p-1 rounded transition-colors',
              isHalloween
                ? 'hover:bg-orange-500/20 text-orange-400'
                : 'hover:bg-muted text-muted-foreground'
            )}
            data-testid="branch-navigator-minimize-btn"
            aria-label="Minimize"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* Node Selection */}
          {!hasSelection ? (
            <div className="space-y-2">
              <p className={cn(
                'text-xs',
                isHalloween ? 'text-purple-200/70' : 'text-muted-foreground'
              )}>
                Select a node to explore its branches
              </p>
              {currentCardId && (
                <button
                  onClick={handleUseCurrentCard}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isHalloween
                      ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-100 border border-orange-500/30'
                      : 'bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30'
                  )}
                  data-testid="branch-navigator-use-current-btn"
                >
                  <GitBranch className="w-4 h-4" />
                  Use Current Card
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Selected Node Display */}
              <div className={cn(
                'flex items-center gap-2 p-2 rounded-lg',
                isHalloween ? 'bg-purple-900/40' : 'bg-muted/50'
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {isFirstCard && (
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                        isHalloween
                          ? 'bg-orange-500/30 text-orange-300'
                          : 'bg-primary/20 text-primary'
                      )}>
                        START
                      </span>
                    )}
                    <span className={cn(
                      'text-xs font-semibold truncate',
                      isHalloween ? 'text-orange-100' : 'text-foreground'
                    )}>
                      {selectedNodeTitle}
                    </span>
                  </div>
                  <p className={cn(
                    'text-[10px] mt-0.5',
                    isHalloween ? 'text-purple-200/60' : 'text-muted-foreground'
                  )}>
                    {availableBranches.length} branch{availableBranches.length !== 1 ? 'es' : ''} available
                  </p>
                </div>
                <button
                  onClick={handleClearSelection}
                  className={cn(
                    'p-1.5 rounded-md transition-colors',
                    isHalloween
                      ? 'hover:bg-orange-500/20 text-orange-400'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                  data-testid="branch-navigator-clear-btn"
                  aria-label="Clear selection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Branch Selector */}
              {availableBranches.length > 0 && (
                <BranchSelector
                  branches={availableBranches}
                  selectedIndex={selectedBranchIndex}
                  onSelectBranch={selectBranch}
                  isHalloween={isHalloween}
                />
              )}

              {/* Toggle Path Preview */}
              {linearPath.length > 1 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={cn(
                    'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                    isHalloween
                      ? 'hover:bg-orange-500/10 text-orange-200'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                  data-testid="branch-navigator-toggle-path-btn"
                >
                  <span className="flex items-center gap-1.5">
                    <Route className="w-3 h-3" />
                    Path Preview ({linearPath.length} cards)
                  </span>
                  {isExpanded ? (
                    <ChevronLeft className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {/* Linear Path Preview */}
              {isExpanded && linearPath.length > 0 && (
                <LinearPathPreview
                  path={linearPath}
                  currentCardId={currentCardId}
                  firstCardId={storyStack?.firstCardId ?? null}
                  onCardClick={handleCardClick}
                  onReorder={onReorderPath ? handleReorder : undefined}
                  isHalloween={isHalloween}
                />
              )}
            </>
          )}
        </div>
      </div>
  )
}

export { BranchSelector } from './BranchSelector'
export { LinearPathPreview } from './LinearPathPreview'
