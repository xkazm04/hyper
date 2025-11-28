'use client'

import { Compass } from 'lucide-react'

export function DefaultBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute inset-0 bg-linear-to-br from-muted/30 via-background to-muted/50" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexGrid" width="60" height="52" patternUnits="userSpaceOnUse">
            <path
              d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-foreground"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexGrid)" />
      </svg>
      <div className="absolute top-4 left-4 opacity-10">
        <Compass className="w-16 h-16 text-foreground" />
      </div>
      <div className="absolute inset-0 shadow-[inset_0_0_150px_hsl(var(--muted)/0.5)]" />
    </div>
  )
}
