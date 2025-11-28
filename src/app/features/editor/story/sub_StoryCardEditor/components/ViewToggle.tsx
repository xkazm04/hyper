'use client'

import { cn } from '@/lib/utils'
import { Pencil, Network, Eye } from 'lucide-react'

export type ViewMode = 'canvas' | 'graph' | 'preview'
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
  className,
}: ViewToggleProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Canvas/Story Graph/Preview Toggle */}
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
          data-testid="view-toggle-canvas"
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
          title="View story structure with AI tools"
          data-testid="view-toggle-graph"
        >
          <Network className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Story Graph</span>
        </button>
        <button
          onClick={() => onViewModeChange('preview')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
            viewMode === 'preview'
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title="Preview final card"
          data-testid="view-toggle-preview"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Preview</span>
        </button>
      </div>
    </div>
  )
}
