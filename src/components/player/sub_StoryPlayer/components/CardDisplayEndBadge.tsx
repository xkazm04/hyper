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
    <div className="flex-1 flex items-center justify-center py-4" data-testid="card-end">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center rounded-xl px-8 py-6"
        style={{
          ...style,
          boxShadow: shadowStyle === 'hard' ? `2px 2px 0px 0px ${style.borderColor}` : 'none',
        }}
      >
        {/* Decorative stars */}
        <div className="mb-3 text-2xl tracking-[0.5em]" style={{ color: style.color }}>
          ✦ ✦ ✦
        </div>
        <p className="font-bold tracking-wide text-xl" style={{ color: style.color }}>
          The End
        </p>
        <p className="mt-2 text-sm opacity-70" style={{ color: style.color }}>
          You've reached the end of this story path
        </p>
        <p className="mt-4 text-xs opacity-50" style={{ color: style.color }}>
          Thank you for playing
        </p>
      </motion.div>
    </div>
  )
}
