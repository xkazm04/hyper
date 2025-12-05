'use client'

import { Loader2, Network, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

type SectionType = 'content' | 'image' | 'script' | 'graph' | 'preview'

interface SectionLoadingFallbackProps {
  section?: SectionType
  fullHeight?: boolean
}

const sectionIcons: Record<SectionType, typeof Loader2 | null> = {
  content: null,
  image: null,
  script: null,
  graph: Network,
  preview: Eye,
}

const sectionLabels: Record<SectionType, string> = {
  content: 'Content',
  image: 'Image',
  script: 'Script',
  graph: 'Story Graph',
  preview: 'Preview',
}

export function SectionLoadingFallback({ section, fullHeight }: SectionLoadingFallbackProps) {
  const sectionLabel = section ? sectionLabels[section] : 'Section'
  const SectionIcon = section ? sectionIcons[section] : null

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center space-y-4",
        fullHeight ? "h-full min-h-[400px]" : "py-12"
      )}
      data-testid={`section-loading-${section || 'fallback'}`}
    >
      <div className="relative">
        {SectionIcon && (
          <SectionIcon className="w-12 h-12 text-muted-foreground/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">
        Loading {sectionLabel}...
      </p>
    </div>
  )
}
