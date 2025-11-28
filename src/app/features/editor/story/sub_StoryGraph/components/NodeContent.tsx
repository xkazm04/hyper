'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  Type,
  FileText,
  ImageIcon,
  GitBranch,
  CheckCircle2,
  Circle,
} from 'lucide-react'

/**
 * PumpkinIcon - Halloween themed icon for story nodes
 */
export function PumpkinIcon({ className }: { className?: string }) {
  return (
    <span className={cn('inline-block', className)} role="img" aria-label="pumpkin">
      {String.fromCodePoint(0x1F383)}
    </span>
  )
}

export interface CompletionIndicatorsProps {
  hasTitle: boolean
  hasContent: boolean
  hasImage: boolean
  hasChoices: boolean
  isHalloween?: boolean
}

/**
 * CompletionIndicators - Compact completion indicator with icons
 * Designed for quick visual scanning of node status
 */
export function CompletionIndicators({
  hasTitle,
  hasContent,
  hasImage,
  hasChoices,
  isHalloween = false,
}: CompletionIndicatorsProps) {
  const indicators = [
    { done: hasTitle, icon: Type, label: 'Title' },
    { done: hasContent, icon: FileText, label: 'Content' },
    { done: hasImage, icon: ImageIcon, label: 'Image' },
    { done: hasChoices, icon: GitBranch, label: 'Choices' },
  ]

  return (
    <div className="flex items-center gap-1">
      {indicators.map(({ done, icon: Icon, label }, i) => (
        <div
          key={i}
          className={cn(
            'w-4 h-4 rounded flex items-center justify-center transition-colors',
            done
              ? isHalloween
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-emerald-500/20 text-emerald-600'
              : isHalloween
                ? 'bg-purple-900/30 text-purple-400/50'
                : 'bg-muted text-muted-foreground/50'
          )}
          title={`${label}: ${done ? 'Done' : 'Missing'}`}
        >
          <Icon className="w-2.5 h-2.5" />
        </div>
      ))}
    </div>
  )
}

export interface CompletionItemProps {
  done: boolean
  label: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * CompletionItem - A single completion item for the tooltip
 */
export function CompletionItem({
  done,
  label,
  icon: Icon
}: CompletionItemProps) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
      done ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
    )}>
      {done ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Circle className="w-3 h-3" />
      )}
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  )
}
