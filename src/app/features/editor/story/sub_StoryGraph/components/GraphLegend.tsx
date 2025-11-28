'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface LegendItemProps {
  icon: React.ReactNode
  label: string
  color: string
  borderColor: string
  alert?: boolean
}

/**
 * LegendItem - A single item in the graph legend
 * Shows an icon with a colored background and label
 */
export function LegendItem({
  icon,
  label,
  color,
  borderColor,
  alert = false
}: LegendItemProps) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded',
      alert && 'bg-destructive/10'
    )}>
      <div className={cn(
        'w-4 h-4 rounded-sm border-2 flex items-center justify-center',
        color,
        borderColor
      )}>
        {icon}
      </div>
      <span className={cn(
        'text-xs',
        alert ? 'text-destructive font-medium' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  )
}
