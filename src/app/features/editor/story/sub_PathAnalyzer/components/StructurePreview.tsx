'use client'

import {
  Layers,
  GitBranch,
  Target,
  AlertTriangle,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StructurePreviewProps {
  structure: {
    totalCards: number
    reachableCards: number
    deadEndCards: number
    orphanedCards: number
    maxDepth: number
    branchingFactor: number
  }
  className?: string
}

export function StructurePreview({
  structure,
  className,
}: StructurePreviewProps) {
  const hasOrphans = structure.orphanedCards > 0
  const hasNoEndings = structure.deadEndCards === 0

  return (
    <div className={cn('space-y-3', className)}>
      <div className="text-xs font-medium text-foreground uppercase tracking-wide">
        Story Structure
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
          <Layers className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-lg font-bold text-foreground">
            {structure.totalCards}
          </span>
          <span className="text-[10px] text-muted-foreground">Cards</span>
        </div>

        <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
          <Maximize2 className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-lg font-bold text-foreground">
            {structure.maxDepth}
          </span>
          <span className="text-[10px] text-muted-foreground">Max Depth</span>
        </div>

        <div className="flex flex-col items-center p-2 bg-muted/30 rounded-lg">
          <GitBranch className="w-4 h-4 text-muted-foreground mb-1" />
          <span className="text-lg font-bold text-foreground">
            {structure.branchingFactor.toFixed(1)}
          </span>
          <span className="text-[10px] text-muted-foreground">Branches/Card</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5 text-green-500" />
          <span className="text-muted-foreground">
            {structure.deadEndCards} ending{structure.deadEndCards !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-muted-foreground',
              hasOrphans && 'text-yellow-600'
            )}
          >
            {structure.reachableCards}/{structure.totalCards} reachable
          </span>
        </div>
      </div>

      {/* Warnings */}
      {(hasOrphans || hasNoEndings) && (
        <div className="space-y-1.5">
          {hasNoEndings && (
            <div className="flex items-start gap-1.5 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700">
                No story endings! Add cards without choices to create conclusions.
              </p>
            </div>
          )}
          {hasOrphans && (
            <div className="flex items-start gap-1.5 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-xs text-yellow-700">
                {structure.orphanedCards} card(s) unreachable from start.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
