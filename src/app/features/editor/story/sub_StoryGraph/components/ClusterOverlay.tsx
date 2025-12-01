'use client'

import React, { memo, useMemo, useCallback } from 'react'
import { useViewport, useReactFlow, ReactFlowState, useStore } from 'reactflow'
import { cn } from '@/lib/utils'
import { ClusterGroup, getClusterColor, getClusterBorderColor } from '../lib/clusterUtils'
import { ChevronDown, ChevronRight, Layers, GripVertical } from 'lucide-react'

interface ClusterOverlayProps {
  clusters: ClusterGroup[]
  isHalloween: boolean
  onToggleCluster: (clusterId: string) => void
  enabled?: boolean
}

// Selector for transform from React Flow store
const transformSelector = (state: ReactFlowState) => state.transform

/**
 * ClusterOverlay - SVG-based cluster visualization layer
 *
 * Renders behind the React Flow canvas as an SVG overlay.
 * Uses React Flow's viewport transform for proper positioning.
 */
const ClusterOverlay = memo(function ClusterOverlay({
  clusters,
  isHalloween,
  onToggleCluster,
  enabled = true,
}: ClusterOverlayProps) {
  // Get viewport transform from React Flow store
  const transform = useStore(transformSelector)
  const [x, y, zoom] = transform

  // Don't render if disabled or no clusters
  if (!enabled || clusters.length === 0) {
    return null
  }

  return (
    <svg
      className="cluster-overlay absolute inset-0 pointer-events-none overflow-visible"
      style={{ zIndex: -1 }}
      aria-hidden="true"
      data-testid="cluster-overlay"
    >
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>
        {clusters.map(cluster => (
          <ClusterRect
            key={cluster.id}
            cluster={cluster}
            isHalloween={isHalloween}
            onToggle={onToggleCluster}
            zoom={zoom}
          />
        ))}
      </g>
    </svg>
  )
})

ClusterOverlay.displayName = 'ClusterOverlay'

interface ClusterRectProps {
  cluster: ClusterGroup
  isHalloween: boolean
  onToggle: (clusterId: string) => void
  zoom: number
}

/**
 * ClusterRect - Individual SVG cluster rectangle
 */
const ClusterRect = memo(function ClusterRect({
  cluster,
  isHalloween,
  onToggle,
  zoom,
}: ClusterRectProps) {
  const { bounds, label, isCollapsed, nodeIds, depth, id } = cluster

  const bgColor = getClusterColor(depth, isHalloween)
  const borderColor = getClusterBorderColor(depth, isHalloween)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggle(id)
  }, [id, onToggle])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle(id)
    }
  }, [id, onToggle])

  // Calculate text size that scales inversely with zoom for readability
  const baseFontSize = 12
  const scaledFontSize = Math.max(10, Math.min(16, baseFontSize / zoom))

  if (isCollapsed) {
    // Collapsed state: Show as a compact indicator in center
    const collapsedSize = 60
    const cx = bounds.centerX
    const cy = bounds.centerY

    return (
      <g
        className="cluster-rect-collapsed cursor-pointer pointer-events-auto"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Expand ${label} cluster with ${nodeIds.length} nodes`}
        aria-expanded={false}
        data-testid={`cluster-rect-collapsed-${id}`}
      >
        {/* Collapsed container */}
        <rect
          x={cx - collapsedSize / 2}
          y={cy - collapsedSize / 2}
          width={collapsedSize}
          height={collapsedSize}
          rx={12}
          ry={12}
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={2}
          strokeDasharray="8 4"
          className="transition-all duration-200 hover:stroke-primary"
        />

        {/* Icon placeholder (using text as SVG icon) */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={16}
          fill={isHalloween ? '#fb923c' : 'currentColor'}
          className="font-bold"
        >
          {String.fromCodePoint(0x1F4DC)} {/* 📜 scroll emoji as placeholder */}
        </text>

        {/* Node count */}
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fontWeight="bold"
          fill={isHalloween ? '#fb923c' : 'hsl(var(--primary))'}
        >
          {nodeIds.length}
        </text>

        {/* Hover tooltip - positioned above */}
        <title>{`${label} (${nodeIds.length} scenes) - Click to expand`}</title>
      </g>
    )
  }

  // Expanded state: Full cluster frame
  return (
    <g
      className="cluster-rect-expanded"
      data-testid={`cluster-rect-expanded-${id}`}
    >
      {/* Main cluster rectangle */}
      <rect
        x={bounds.minX}
        y={bounds.minY}
        width={bounds.width}
        height={bounds.height}
        rx={12}
        ry={12}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={2}
        strokeDasharray="8 4"
        className="transition-all duration-200"
      />

      {/* Header background */}
      <rect
        x={bounds.minX}
        y={bounds.minY - 28}
        width={Math.min(bounds.width, 180)}
        height={24}
        rx={6}
        ry={6}
        fill={bgColor}
        className="cluster-header-bg"
      />

      {/* Label text */}
      <text
        x={bounds.minX + 32}
        y={bounds.minY - 12}
        fontSize={scaledFontSize}
        fontWeight="600"
        fill={isHalloween ? '#fb923c' : 'hsl(var(--foreground))'}
        className="select-none"
      >
        {label}
      </text>

      {/* Node count badge */}
      <text
        x={bounds.minX + 32 + label.length * (scaledFontSize * 0.6) + 8}
        y={bounds.minY - 12}
        fontSize={10}
        fontWeight="bold"
        fill={isHalloween ? '#c084fc' : 'hsl(var(--muted-foreground))'}
        className="select-none"
      >
        ({nodeIds.length})
      </text>

      {/* Collapse button */}
      <g
        className="cursor-pointer pointer-events-auto hover:opacity-80 transition-opacity"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Collapse ${label} cluster`}
        aria-expanded={true}
      >
        <rect
          x={bounds.minX + 8}
          y={bounds.minY - 24}
          width={20}
          height={20}
          rx={4}
          fill="transparent"
          className="hover:fill-white/10"
        />
        {/* Chevron icon using path */}
        <path
          d={`M ${bounds.minX + 14} ${bounds.minY - 18} L ${bounds.minX + 18} ${bounds.minY - 14} L ${bounds.minX + 22} ${bounds.minY - 18}`}
          stroke={isHalloween ? '#fb923c' : 'currentColor'}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>

      <title>{`${label} cluster with ${nodeIds.length} scenes`}</title>
    </g>
  )
})

ClusterRect.displayName = 'ClusterRect'

export default ClusterOverlay
