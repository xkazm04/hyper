'use client'

import { useState } from 'react'
import { Palette, RefreshCw } from 'lucide-react'
import { MoodColors } from '@/lib/services/mood'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface MoodIndicatorProps {
  moodColors: MoodColors
  isLoading: boolean
  onRefresh: () => void
}

/**
 * Visual indicator showing the current mood-based theme colors
 * Displays in the editor toolbar with a tooltip showing color details
 */
export default function MoodIndicator({
  moodColors,
  isLoading,
  onRefresh,
}: MoodIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors"
            data-testid="mood-indicator-btn"
            aria-label="Refresh mood colors"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Palette className="w-3.5 h-3.5 text-muted-foreground" />
            )}

            {/* Color preview dots */}
            <div className="flex gap-0.5" data-testid="mood-color-preview">
              <span
                className="w-2 h-2 rounded-full transition-colors duration-400"
                style={{ backgroundColor: `hsl(${moodColors.primary})` }}
              />
              <span
                className="w-2 h-2 rounded-full transition-colors duration-400"
                style={{ backgroundColor: `hsl(${moodColors.secondary})` }}
              />
              <span
                className="w-2 h-2 rounded-full transition-colors duration-400"
                style={{ backgroundColor: `hsl(${moodColors.accent})` }}
              />
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium">Mood Colors</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${moodColors.primary})` }}
                />
                <span className="text-muted-foreground">Primary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${moodColors.secondary})` }}
                />
                <span className="text-muted-foreground">Secondary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${moodColors.muted})` }}
                />
                <span className="text-muted-foreground">Muted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-border"
                  style={{ backgroundColor: `hsl(${moodColors.accent})` }}
                />
                <span className="text-muted-foreground">Accent</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-1 border-t border-border">
              Click to refresh colors
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
