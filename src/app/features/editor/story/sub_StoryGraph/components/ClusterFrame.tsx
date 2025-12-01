'use client'

import React, { memo, useCallback, useState, useRef, useEffect } from 'react'
import { useReactFlow, useViewport } from 'reactflow'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Layers, GripVertical } from 'lucide-react'
import { ClusterGroup, getClusterColor, getClusterBorderColor } from '../lib/clusterUtils'

export interface ClusterFrameProps {
  cluster: ClusterGroup
  isHalloween: boolean
  onToggleCollapse: (clusterId: string) => void
  onClusterDragStart?: (clusterId: string, startX: number, startY: number) => void
  onClusterDrag?: (clusterId: string, deltaX: number, deltaY: number) => void
  onClusterDragEnd?: (clusterId: string) => void
}

/**
 * ClusterFrame - A draggable, resizable frame that groups nodes by depth
 *
 * Features:
 * - Semi-transparent background with rounded corners
 * - Collapse/expand toggle with smooth animation
 * - Draggable frame that moves all contained nodes
 * - Accessible keyboard controls
 */
const ClusterFrame = memo(function ClusterFrame({
  cluster,
  isHalloween,
  onToggleCollapse,
  onClusterDragStart,
  onClusterDrag,
  onClusterDragEnd,
}: ClusterFrameProps) {
  const { zoom } = useViewport()
  const { getNodes, setNodes } = useReactFlow()
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)

  const { bounds, label, isCollapsed, nodeIds, depth } = cluster

  // Get colors based on theme
  const bgColor = getClusterColor(depth, isHalloween)
  const borderColor = getClusterBorderColor(depth, isHalloween)

  // Handle collapse toggle
  const handleToggle = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    onToggleCollapse(cluster.id)
  }, [cluster.id, onToggleCollapse])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle(e)
    }
  }, [handleToggle])

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-drag-handle]')) {
      e.stopPropagation()
      setIsDragging(true)
      dragStartRef.current = { x: e.clientX, y: e.clientY }
      onClusterDragStart?.(cluster.id, e.clientX, e.clientY)
    }
  }, [cluster.id, onClusterDragStart])

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return

      const deltaX = (e.clientX - dragStartRef.current.x) / zoom
      const deltaY = (e.clientY - dragStartRef.current.y) / zoom

      onClusterDrag?.(cluster.id, deltaX, deltaY)

      // Move all nodes in this cluster
      const nodes = getNodes()
      const updatedNodes = nodes.map(node => {
        if (nodeIds.includes(node.id)) {
          return {
            ...node,
            position: {
              x: node.position.x + deltaX,
              y: node.position.y + deltaY,
            },
          }
        }
        return node
      })
      setNodes(updatedNodes)

      // Update drag start for continuous delta calculation
      dragStartRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartRef.current = null
      onClusterDragEnd?.(cluster.id)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, cluster.id, nodeIds, zoom, getNodes, setNodes, onClusterDrag, onClusterDragEnd])

  // Calculate scaled dimensions for React Flow coordinate system
  const style: React.CSSProperties = {
    position: 'absolute',
    left: bounds.minX,
    top: bounds.minY,
    width: bounds.width,
    height: bounds.height,
    pointerEvents: 'auto',
  }

  // Collapsed state - show as compact indicator
  if (isCollapsed) {
    const collapsedSize = 60

    return (
      <div
        ref={frameRef}
        className={cn(
          'cluster-frame cluster-frame-collapsed',
          'flex items-center justify-center rounded-xl',
          'border-2 border-dashed cursor-pointer',
          'transition-all duration-200 ease-in-out',
          isDragging && 'opacity-80',
          isHalloween && 'cluster-frame-halloween'
        )}
        style={{
          position: 'absolute',
          left: bounds.centerX - collapsedSize / 2,
          top: bounds.centerY - collapsedSize / 2,
          width: collapsedSize,
          height: collapsedSize,
          backgroundColor: bgColor,
          borderColor: borderColor,
          pointerEvents: 'auto',
        }}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        aria-label={`Expand ${label} cluster with ${nodeIds.length} nodes`}
        aria-expanded={false}
        data-testid={`cluster-collapsed-${cluster.id}`}
      >
        <div className="flex flex-col items-center gap-1">
          <Layers className={cn(
            'w-5 h-5',
            isHalloween ? 'text-orange-400' : 'text-primary'
          )} />
          <span className={cn(
            'text-[10px] font-bold',
            isHalloween ? 'text-orange-400' : 'text-primary'
          )}>
            {nodeIds.length}
          </span>
        </div>

        {/* Hover tooltip */}
        {isHovered && (
          <div
            className={cn(
              'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-md',
              'text-xs font-medium whitespace-nowrap',
              'transition-opacity duration-150',
              isHalloween ? 'bg-purple-900 text-orange-300' : 'bg-card text-foreground',
              'shadow-lg border border-border'
            )}
          >
            {label} ({nodeIds.length} scenes)
            <ChevronRight className="inline ml-1 w-3 h-3" />
          </div>
        )}
      </div>
    )
  }

  // Expanded state - show full cluster frame
  return (
    <div
      ref={frameRef}
      className={cn(
        'cluster-frame cluster-frame-expanded',
        'rounded-xl border-2 border-dashed',
        'transition-all duration-200 ease-in-out',
        isDragging && 'ring-2 ring-primary/50',
        isHalloween && 'cluster-frame-halloween'
      )}
      style={{
        ...style,
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
      onMouseDown={handleDragStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="group"
      aria-label={`${label} cluster containing ${nodeIds.length} nodes`}
      data-testid={`cluster-expanded-${cluster.id}`}
    >
      {/* Cluster header */}
      <div
        className={cn(
          'absolute -top-8 left-0 flex items-center gap-2',
          'px-3 py-1.5 rounded-t-lg',
          'transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-70'
        )}
        style={{ backgroundColor: bgColor }}
      >
        {/* Drag handle */}
        <div
          data-drag-handle
          className={cn(
            'cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10',
            'transition-colors duration-150'
          )}
          role="button"
          aria-label={`Drag ${label} cluster`}
          tabIndex={0}
          data-testid={`cluster-drag-handle-${cluster.id}`}
        >
          <GripVertical className={cn(
            'w-4 h-4',
            isHalloween ? 'text-orange-400/70' : 'text-muted-foreground'
          )} />
        </div>

        {/* Cluster label */}
        <span className={cn(
          'text-sm font-semibold',
          isHalloween ? 'text-orange-400' : 'text-foreground'
        )}>
          {label}
        </span>

        {/* Node count badge */}
        <span className={cn(
          'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
          isHalloween
            ? 'bg-purple-900/50 text-orange-300'
            : 'bg-muted text-muted-foreground'
        )}>
          {nodeIds.length}
        </span>

        {/* Collapse button */}
        <button
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'p-1 rounded-md hover:bg-white/10',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-primary/50'
          )}
          aria-label={`Collapse ${label} cluster`}
          aria-expanded={true}
          tabIndex={0}
          data-testid={`cluster-collapse-btn-${cluster.id}`}
        >
          <ChevronDown className={cn(
            'w-4 h-4',
            isHalloween ? 'text-orange-400' : 'text-foreground'
          )} />
        </button>
      </div>
    </div>
  )
})

ClusterFrame.displayName = 'ClusterFrame'

export default ClusterFrame
