'use client'

import { cn } from '@/lib/utils'
import { FileText, Network, Eye, Activity } from 'lucide-react'

export type ViewMode = 'content' | 'graph' | 'preview' | 'analytics'

interface ViewToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  hasImage?: boolean
  className?: string
}

const viewModes: Array<{
  id: ViewMode
  label: string
  shortLabel: string
  icon: typeof FileText
  title: string
  group: 'edit' | 'view'
}> = [
  { id: 'content', label: 'Edit Scene', shortLabel: 'Edit', icon: FileText, title: 'Edit scene content and generate image', group: 'edit' },
  { id: 'graph', label: 'Story Graph', shortLabel: 'Graph', icon: Network, title: 'View story structure with AI tools', group: 'view' },
  { id: 'preview', label: 'Preview', shortLabel: 'Preview', icon: Eye, title: 'Preview final card', group: 'view' },
  { id: 'analytics', label: 'Analytics', shortLabel: 'Stats', icon: Activity, title: 'Analyze story paths and metrics', group: 'view' },
]

export function ViewToggle({
  viewMode,
  onViewModeChange,
  hasImage,
  className,
}: ViewToggleProps) {
  const editModes = viewModes.filter(m => m.group === 'edit')
  const viewModeOptions = viewModes.filter(m => m.group === 'view')

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Edit mode (Content + Image combined) */}
      <div className="flex bg-muted rounded-lg p-0.5 border border-border">
        {editModes.map(({ id, label, shortLabel, icon: Icon, title }) => {
          const isActive = viewMode === id

          return (
            <button
              key={id}
              onClick={() => onViewModeChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={title}
              data-testid={`view-toggle-${id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
              {hasImage && id === 'content' && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-green-500"
                  aria-label="Has image"
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-border" />

      {/* View modes group (Graph, Preview, Analytics) */}
      <div className="flex bg-muted rounded-lg p-0.5 border border-border">
        {viewModeOptions.map(({ id, label, shortLabel, icon: Icon, title }) => {
          const isActive = viewMode === id

          return (
            <button
              key={id}
              onClick={() => onViewModeChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={title}
              data-testid={`view-toggle-${id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
