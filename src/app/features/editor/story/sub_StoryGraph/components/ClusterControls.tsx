'use client'

import React, { memo, useCallback, useEffect } from 'react'
import { Panel } from 'reactflow'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Layers, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ClusterControlsProps {
  clusterCount: number
  collapsedCount: number
  expandAll: () => void
  collapseAll: () => void
  enabled: boolean
  onToggleEnabled?: (enabled: boolean) => void
  isHalloween: boolean
}

/**
 * ClusterControls - UI controls for managing cluster visibility
 *
 * Features:
 * - Expand/Collapse all buttons
 * - Cluster count indicator
 * - Keyboard shortcuts (Alt+E = expand all, Alt+C = collapse all)
 */
const ClusterControls = memo(function ClusterControls({
  clusterCount,
  collapsedCount,
  expandAll,
  collapseAll,
  enabled,
  onToggleEnabled,
  isHalloween,
}: ClusterControlsProps) {
  // Register keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+E = Expand all clusters
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        expandAll()
      }
      // Alt+C = Collapse all clusters
      if (e.altKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        collapseAll()
      }
      // Alt+G = Toggle cluster grouping
      if (e.altKey && e.key.toLowerCase() === 'g' && onToggleEnabled) {
        e.preventDefault()
        onToggleEnabled(!enabled)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expandAll, collapseAll, enabled, onToggleEnabled])

  if (clusterCount === 0) {
    return null
  }

  const expandedCount = clusterCount - collapsedCount
  const allExpanded = collapsedCount === 0
  const allCollapsed = collapsedCount === clusterCount

  return (
    <Panel position="bottom-left" className="m-3">
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg',
          'border-2 transition-colors duration-200',
          isHalloween
            ? 'bg-purple-950/90 border-purple-700/50'
            : 'bg-card/95 border-border'
        )}
        role="toolbar"
        aria-label="Cluster controls"
        data-testid="cluster-controls"
      >
        {/* Cluster icon and count */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-md',
                  isHalloween ? 'bg-purple-900/50' : 'bg-muted'
                )}
              >
                <Layers className={cn(
                  'w-4 h-4',
                  isHalloween ? 'text-orange-400' : 'text-primary'
                )} />
                <span className={cn(
                  'text-sm font-medium tabular-nums',
                  isHalloween ? 'text-orange-300' : 'text-foreground'
                )}>
                  {expandedCount}/{clusterCount}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{expandedCount} of {clusterCount} clusters visible</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className={cn(
          'w-px h-6',
          isHalloween ? 'bg-purple-700/50' : 'bg-border'
        )} />

        {/* Expand All button */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={expandAll}
                disabled={allExpanded}
                className={cn(
                  'h-8 px-2',
                  isHalloween && 'hover:bg-purple-800/50 text-orange-300',
                  allExpanded && 'opacity-50 cursor-not-allowed'
                )}
                aria-label="Expand all clusters"
                aria-disabled={allExpanded}
                data-testid="cluster-expand-all-btn"
              >
                <ChevronDown className="w-4 h-4 mr-1" />
                <span className="text-xs">Expand</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Expand all clusters (Alt+E)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Collapse All button */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={collapseAll}
                disabled={allCollapsed}
                className={cn(
                  'h-8 px-2',
                  isHalloween && 'hover:bg-purple-800/50 text-orange-300',
                  allCollapsed && 'opacity-50 cursor-not-allowed'
                )}
                aria-label="Collapse all clusters"
                aria-disabled={allCollapsed}
                data-testid="cluster-collapse-all-btn"
              >
                <ChevronUp className="w-4 h-4 mr-1" />
                <span className="text-xs">Collapse</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Collapse all clusters (Alt+C)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Toggle grouping button (optional) */}
        {onToggleEnabled && (
          <>
            <div className={cn(
              'w-px h-6',
              isHalloween ? 'bg-purple-700/50' : 'bg-border'
            )} />
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleEnabled(!enabled)}
                    className={cn(
                      'h-8 px-2',
                      isHalloween && 'hover:bg-purple-800/50 text-orange-300',
                      !enabled && 'opacity-50'
                    )}
                    aria-label={enabled ? 'Disable cluster grouping' : 'Enable cluster grouping'}
                    aria-pressed={enabled}
                    data-testid="cluster-toggle-btn"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{enabled ? 'Hide' : 'Show'} cluster grouping (Alt+G)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </Panel>
  )
})

ClusterControls.displayName = 'ClusterControls'

export default ClusterControls
