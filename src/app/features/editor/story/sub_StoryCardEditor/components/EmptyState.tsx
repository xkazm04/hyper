'use client'

import { FileText } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="h-full flex items-center justify-center bg-muted/30">
      <div className="text-center p-8 max-w-md">
        {/* Vintage card illustration */}
        <div className="relative mx-auto mb-6 w-24 h-32">
          {/* Stack of cards */}
          <div className="absolute inset-0 bg-card border-2 border-border rounded-lg
                          transform rotate-6 shadow-[2px_2px_0px_0px_hsl(var(--border))]" />
          <div className="absolute inset-0 bg-card border-2 border-border rounded-lg
                          transform rotate-3 shadow-[2px_2px_0px_0px_hsl(var(--border))]" />
          <div className="absolute inset-0 bg-card border-2 border-border rounded-lg
                          shadow-[3px_3px_0px_0px_hsl(var(--border))]
                          flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground/50" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-foreground mb-2">
          No Card Selected
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Select a card from the list to start editing, or create a new card to begin your story.
        </p>

        {/* Decorative divider */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-border" />
          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
          <div className="h-px w-8 bg-border" />
        </div>
      </div>
    </div>
  )
}
