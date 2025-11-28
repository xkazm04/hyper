'use client'

import React from 'react'
import { Handle, Position } from 'reactflow'
import { cn } from '@/lib/utils'

export interface NodeConnectorsProps {
  choiceCount: number
  isHalloween: boolean
  isCollapsed?: boolean
}

/**
 * NodeConnectors - Connection handles for story nodes
 * Includes source and target handles with theme-aware styling
 */
export function NodeConnectors({
  choiceCount,
  isHalloween,
  isCollapsed = false,
}: NodeConnectorsProps) {
  return (
    <>
      {/* Target Handle (left side - incoming connections) */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          '!w-3 !h-3 !border-2 !rounded-full transition-colors',
          '!-left-1.5',
          isHalloween
            ? '!bg-purple-900 !border-purple-500/50 hover:!bg-orange-500 hover:!border-orange-500'
            : '!bg-card !border-border hover:!bg-primary hover:!border-primary'
        )}
      />

      {/* Source Handle (right side - outgoing connections) */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          '!w-3 !h-3 !border-2 !rounded-full transition-colors',
          '!-right-1.5',
          isHalloween ? (
            choiceCount > 0
              ? '!bg-orange-500/30 !border-orange-500 hover:!bg-orange-500 hover:!border-orange-400'
              : '!bg-purple-900/50 !border-purple-500/30 hover:!bg-orange-500 hover:!border-orange-500'
          ) : (
            choiceCount > 0
              ? '!bg-primary/20 !border-primary hover:!bg-primary hover:!border-primary'
              : '!bg-muted !border-muted-foreground/30 hover:!bg-primary hover:!border-primary'
          )
        )}
      />

      {/* Multi-branch indicator dots for source handle (only when expanded) */}
      {choiceCount > 1 && !isCollapsed && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-0.5 ml-1">
          {Array.from({ length: Math.min(choiceCount, 3) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 h-1 rounded-full",
                isHalloween ? "bg-orange-500/70" : "bg-primary/60"
              )}
            />
          ))}
        </div>
      )}
    </>
  )
}
