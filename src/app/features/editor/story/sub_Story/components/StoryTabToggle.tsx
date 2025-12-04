'use client'

import { cn } from '@/lib/utils'
import { FileText, Palette } from 'lucide-react'

export type StoryTabMode = 'description' | 'artstyle'

interface StoryTabToggleProps {
  activeTab: StoryTabMode
  onTabChange: (tab: StoryTabMode) => void
  className?: string
}

const tabs: Array<{
  id: StoryTabMode
  label: string
  shortLabel: string
  icon: typeof FileText
  title: string
}> = [
  { id: 'description', label: 'Description', shortLabel: 'Info', icon: FileText, title: 'Edit story name, description and cover' },
  { id: 'artstyle', label: 'Art Style', shortLabel: 'Style', icon: Palette, title: 'Configure visual style for all images' },
]

export function StoryTabToggle({
  activeTab,
  onTabChange,
  className,
}: StoryTabToggleProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex bg-muted rounded-lg p-0.5 border border-border">
        {tabs.map(({ id, label, shortLabel, icon: Icon, title }) => {
          const isActive = activeTab === id

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title={title}
              data-testid={`story-tab-${id}`}
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
