'use client'

import { motion } from 'framer-motion'
import { CardDisplayTheme } from '../lib/cardDisplayTypes'

// ============================================================================
// End Badge Component
// ============================================================================

interface EndBadgeProps {
  variant: 'player' | 'preview'
  style: Record<string, string | undefined>
  shadowStyle?: CardDisplayTheme['shadowStyle']
}

export function EndBadge({ style, shadowStyle }: EndBadgeProps) {
  return (
    <div className="flex-1 flex items-center justify-center py-3 sm:py-4" data-testid="card-end">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center rounded-lg sm:rounded-xl px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6"
        style={{
          ...style,
          boxShadow: shadowStyle === 'hard' ? `2px 2px 0px 0px ${style.borderColor}` : 'none',
        }}
      >
        {/* Decorative stars */}
        <div className="mb-2 sm:mb-3 text-lg sm:text-xl md:text-2xl tracking-[0.3em] sm:tracking-[0.5em]" style={{ color: style.color }}>
          ✦ ✦ ✦
        </div>
        <p className="font-bold tracking-wide text-base sm:text-lg md:text-xl" style={{ color: style.color }}>
          The End
        </p>
        <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm opacity-70" style={{ color: style.color }}>
          You've reached the end of this story path
        </p>
        <p className="mt-2 sm:mt-3 md:mt-4 text-[10px] sm:text-xs opacity-50" style={{ color: style.color }}>
          Thank you for playing
        </p>
      </motion.div>
    </div>
  )
}
