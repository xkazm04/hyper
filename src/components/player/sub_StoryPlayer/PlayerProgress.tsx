'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Layers } from 'lucide-react'
import { StoryStack } from '@/lib/types'
import { motion } from 'framer-motion'

interface PlayerProgressProps {
  stack: StoryStack
  historyLength: number
  onBack: () => void
}

/**
 * PlayerProgress - Back button, reading depth indicator, and story info footer
 */
export function PlayerProgress({
  stack,
  historyLength,
  onBack
}: PlayerProgressProps) {
  const currentDepth = historyLength + 1

  return (
    <>
      {/* Reading depth indicator */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex items-center justify-center gap-3"
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Depth <span className="text-foreground font-bold">{currentDepth}</span>
          </span>
          {/* Visual depth dots */}
          <div className="flex items-center gap-1 ml-2">
            {Array.from({ length: Math.min(currentDepth, 7) }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="w-2 h-2 rounded-full bg-primary"
                style={{ opacity: 1 - (i * 0.12) }}
              />
            ))}
            {currentDepth > 7 && (
              <span className="text-xs text-muted-foreground ml-1">+{currentDepth - 7}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Back button */}
      {historyLength > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 sm:mt-6 text-center"
        >
          <Button
            onClick={onBack}
            variant="outline"
            className="inline-flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base touch-manipulation min-h-[44px] hover:shadow-lg transition-all"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </motion.div>
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
