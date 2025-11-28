'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, ChevronDown } from 'lucide-react'

export interface NodeActionsProps {
  nodeId: string
  canCollapse: boolean
  isCollapsed: boolean
  hiddenDescendantCount: number
  isHalloween: boolean
  onCollapseToggle: (event: React.MouseEvent) => void
}

/**
 * NodeActions - Collapse/expand toggle and related actions for story nodes
 */
export function NodeActions({
  nodeId,
  canCollapse,
  isCollapsed,
  hiddenDescendantCount,
  isHalloween,
  onCollapseToggle,
}: NodeActionsProps) {
  if (!canCollapse) return null

  return (
    <>
      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={onCollapseToggle}
        className={cn(
          "absolute -right-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all",
          "border-2 shadow-sm hover:scale-110 active:scale-95",
          isHalloween
            ? isCollapsed
              ? "bg-orange-500 border-orange-400 text-white hover:bg-orange-400"
              : "bg-purple-900/80 border-purple-500/50 text-purple-300 hover:bg-purple-800"
            : isCollapsed
              ? "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
              : "bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        data-testid={`collapse-toggle-${nodeId}`}
        aria-label={isCollapsed ? `Expand branch (${hiddenDescendantCount} hidden scenes)` : 'Collapse branch'}
        aria-expanded={!isCollapsed}
        title={isCollapsed ? `Expand (${hiddenDescendantCount} hidden)` : 'Collapse branch'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      {/* Collapsed indicator badge */}
      {isCollapsed && hiddenDescendantCount > 0 && (
        <div
          className={cn(
            "absolute -right-4 -bottom-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold",
            "border shadow-sm",
            isHalloween
              ? "bg-orange-500 border-orange-400 text-white"
              : "bg-primary border-primary text-primary-foreground"
          )}
          title={`${hiddenDescendantCount} scene${hiddenDescendantCount !== 1 ? 's' : ''} hidden`}
        >
          +{hiddenDescendantCount}
        </div>
      )}
    </>
  )
}
