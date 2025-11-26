'use client'

import { cn } from '@/lib/utils'
import { Pencil, Network, Columns2, LayoutList } from 'lucide-react'

export type ViewMode = 'canvas' | 'graph'
export type SplitMode = 'default' | 'split'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  splitMode?: SplitMode
  onSplitModeChange?: (mode: SplitMode) => void
  className?: string
}

export function ViewToggle({
  viewMode,
  onViewModeChange,
  splitMode,
  onSplitModeChange,
  className,
}: ViewToggleProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Canvas/Graph Toggle */}
      <div className="flex bg-muted rounded-lg p-0.5 border border-border">
        <button
          onClick={() => onViewModeChange('canvas')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
            viewMode === 'canvas'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="Edit card content"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Canvas</span>
        </button>
        <button
          onClick={() => onViewModeChange('graph')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
            viewMode === 'graph'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="View story structure"
        >
          <Network className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Story Graph</span>
        </button>
      </div>

      {/* Split View Toggle - Only show when in canvas mode */}
      {viewMode === 'canvas' && onSplitModeChange && (
        <button
          onClick={() => onSplitModeChange(splitMode === 'default' ? 'split' : 'default')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
            'border border-border hover:bg-muted',
            splitMode === 'split'
              ? 'bg-primary/10 text-primary border-primary/50'
              : 'bg-card text-muted-foreground'
          )}
          title={splitMode === 'split' ? 'Exit split view' : 'Split view with preview'}
        >
          {splitMode === 'split' ? (
            <LayoutList className="w-3.5 h-3.5" />
          ) : (
            <Columns2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden md:inline">
            {splitMode === 'split' ? 'Default' : 'Split'}
          </span>
        </button>
      )}
    </div>
  )
}
