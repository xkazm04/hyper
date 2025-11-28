'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { StoryStack } from '@/lib/types'

interface PlayerProgressProps {
  stack: StoryStack
  historyLength: number
  onBack: () => void
}

/**
 * PlayerProgress - Back button and story info footer
 */
export function PlayerProgress({
  stack,
  historyLength,
  onBack
}: PlayerProgressProps) {
  return (
    <>
      {/* Back button */}
      {historyLength > 0 && (
        <div className="mt-4 sm:mt-6 text-center">
          <Button
            onClick={onBack}
            variant="outline"
            className="inline-flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base touch-manipulation min-h-[44px]"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      )}

      {/* Story info footer */}
      <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground px-2">
        <p className="font-medium">{stack.name}</p>
        {stack.description && (
          <p className="mt-1 opacity-70">{stack.description}</p>
        )}
      </div>
    </>
  )
}

/**
 * LoadingState - Displayed while story is loading
 */
export function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-theme">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-lg font-semibold text-foreground">Loading story...</div>
      </div>
    </div>
  )
}

/**
 * EmptyState - Displayed when story has no cards
 */
export function EmptyState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-theme">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Story not available</h1>
        <p className="text-muted-foreground mb-6">This story doesn't have any cards yet.</p>
      </div>
    </div>
  )
}
