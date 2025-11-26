'use client'

import { cn } from '@/lib/utils'
import { FileText, ImageIcon, Code, GitBranch } from 'lucide-react'

export type CardSection = 'content' | 'image' | 'script' | 'choices'

interface SectionTabsProps {
  activeSection: CardSection
  onSectionChange: (section: CardSection) => void
  hasImage?: boolean
  hasScript?: boolean
  choiceCount?: number
}

const sections: Array<{
  id: CardSection
  label: string
  icon: typeof FileText
  shortLabel: string
}> = [
  { id: 'content', label: 'Content', icon: FileText, shortLabel: 'Content' },
  { id: 'image', label: 'Image', icon: ImageIcon, shortLabel: 'Image' },
  { id: 'script', label: 'Script', icon: Code, shortLabel: 'Script' },
  { id: 'choices', label: 'Choices', icon: GitBranch, shortLabel: 'Choices' },
]

export function SectionTabs({
  activeSection,
  onSectionChange,
  hasImage,
  hasScript,
  choiceCount = 0,
}: SectionTabsProps) {
  return (
    <div className="flex border-b border-border bg-card/50">
      {sections.map(({ id, label, icon: Icon, shortLabel }) => {
        const isActive = activeSection === id

        // Status indicators
        const showImageDot = id === 'image' && hasImage
        const showScriptDot = id === 'script' && hasScript
        const showChoiceCount = id === 'choices' && choiceCount > 0

        return (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 text-xs font-medium transition-all duration-200',
              'border-b-2 -mb-px',
              isActive
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>

            {/* Status indicators */}
            {showImageDot && (
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            )}
            {showScriptDot && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
            {showChoiceCount && (
              <span className="min-w-[1.25rem] h-5 flex items-center justify-center text-[10px] font-bold bg-primary/20 text-primary rounded-full px-1">
                {choiceCount}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
