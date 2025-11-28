import React from 'react'
import { Play, AlertCircle, AlertTriangle } from 'lucide-react'
import { PumpkinIcon } from '../NodeContent'

export interface NodeStatusResult {
  statusBgClass: string
  statusBorderClass: string
  statusAccentClass: string
  statusIcon: React.ReactNode
  statusLabel: string
}

export interface NodeStatusInput {
  isFirst: boolean
  isOrphaned: boolean
  isDeadEnd: boolean
  isComplete: boolean
  depth: number
  isHalloween: boolean
}

/**
 * Determines the visual status styling for a story node
 */
export function getNodeStatus({
  isFirst,
  isOrphaned,
  isDeadEnd,
  isComplete,
  depth,
  isHalloween,
}: NodeStatusInput): NodeStatusResult {
  let statusBgClass = 'bg-card'
  let statusBorderClass = 'border-border'
  let statusAccentClass = ''
  let statusIcon: React.ReactNode = null
  let statusLabel = depth >= 0 ? `Level ${depth}` : 'Scene'

  if (isHalloween) {
    if (isFirst) {
      statusBgClass = 'bg-orange-500/10 halloween-node-glow'
      statusBorderClass = 'border-orange-500'
      statusAccentClass = 'shadow-[0_0_0_1px_hsl(25,95%,53%,0.4),0_0_20px_hsl(25,95%,53%,0.2)]'
      statusIcon = React.createElement(PumpkinIcon, { className: 'w-4 h-4 animate-halloween-bob' })
      statusLabel = 'START'
    } else if (isOrphaned) {
      statusBgClass = 'bg-amber-500/10'
      statusBorderClass = 'border-amber-500'
      statusAccentClass = 'shadow-[0_0_0_1px_hsl(45,93%,47%,0.3)]'
      statusIcon = React.createElement(AlertTriangle, { className: 'w-3 h-3 text-amber-500' })
      statusLabel = 'Orphaned'
    } else if (isDeadEnd) {
      statusBgClass = 'bg-red-600/10'
      statusBorderClass = 'border-red-600'
      statusAccentClass = 'shadow-[0_0_0_1px_hsl(0,72%,51%,0.4),0_0_15px_hsl(0,72%,51%,0.2)]'
      statusIcon = React.createElement('span', { 
        className: 'text-sm', 
        role: 'img', 
        'aria-label': 'skull' 
      }, String.fromCodePoint(0x1F480))
      statusLabel = 'Dead End'
    } else if (isComplete) {
      statusBgClass = 'bg-orange-400/10'
      statusBorderClass = 'border-orange-400/60'
      statusAccentClass = 'shadow-[0_0_10px_hsl(25,85%,50%,0.15)]'
    } else {
      statusBgClass = 'bg-purple-900/20'
      statusBorderClass = 'border-purple-500/40'
    }
  } else {
    if (isFirst) {
      statusBgClass = 'bg-primary/5'
      statusBorderClass = 'border-primary'
      statusAccentClass = 'shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]'
      statusIcon = React.createElement(Play, { className: 'w-3 h-3 text-primary fill-primary' })
      statusLabel = 'START'
    } else if (isOrphaned) {
      statusBgClass = 'bg-amber-500/5'
      statusBorderClass = 'border-amber-500'
      statusAccentClass = 'shadow-[0_0_0_1px_hsl(45,93%,47%,0.3)]'
      statusIcon = React.createElement(AlertTriangle, { className: 'w-3 h-3 text-amber-500' })
      statusLabel = 'Orphaned'
    } else if (isDeadEnd) {
      statusBgClass = 'bg-red-500/5'
      statusBorderClass = 'border-red-500'
      statusAccentClass = 'shadow-[0_0_0_1px_hsl(0,84%,60%,0.3)]'
      statusIcon = React.createElement(AlertCircle, { className: 'w-3 h-3 text-red-500' })
      statusLabel = 'Dead End'
    } else if (isComplete) {
      statusBgClass = 'bg-emerald-500/5'
      statusBorderClass = 'border-emerald-500/50'
    }
  }

  return {
    statusBgClass,
    statusBorderClass,
    statusAccentClass,
    statusIcon,
    statusLabel,
  }
}

/**
 * Get selection styling classes for a node
 */
export function getSelectionClasses(isSelected: boolean, isHalloween: boolean): string {
  if (isSelected) {
    return isHalloween
      ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-[#0d0820] shadow-xl scale-105 z-50 halloween-node-selected'
      : 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl scale-105 z-50'
  }
  return isHalloween
    ? 'hover:shadow-lg hover:shadow-orange-500/20 hover:scale-[1.02] hover:z-10 animate-halloween-node-pulse'
    : 'hover:shadow-lg hover:scale-[1.02] hover:z-10 animate-node-pulse'
}

/**
 * Get focus ring styling classes for keyboard navigation
 */
export function getFocusRingClasses(isHalloween: boolean): string {
  return isHalloween
    ? 'focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0820] focus-visible:shadow-[0_0_15px_hsl(25,95%,53%,0.5)] focus-visible:outline-none'
    : 'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:shadow-lg focus-visible:outline-none'
}
