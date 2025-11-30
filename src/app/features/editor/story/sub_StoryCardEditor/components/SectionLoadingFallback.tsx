'use client'

import { Loader2 } from 'lucide-react'

interface SectionLoadingFallbackProps {
  section?: 'content' | 'image' | 'script'
}

export function SectionLoadingFallback({ section }: SectionLoadingFallbackProps) {
  const sectionLabel = section
    ? section.charAt(0).toUpperCase() + section.slice(1)
    : 'Section'

  return (
    <div
      className="flex flex-col items-center justify-center py-12 space-y-4"
      data-testid={`section-loading-${section || 'fallback'}`}
    >
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
      <p className="text-sm text-muted-foreground">
        Loading {sectionLabel}...
      </p>
    </div>
  )
}
