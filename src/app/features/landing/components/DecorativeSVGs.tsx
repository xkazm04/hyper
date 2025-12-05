'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

// ============================================================================
// Decorative SVGs Layer
// ============================================================================

interface DecorativeSVGsProps {
  theme: string
}

export function DecorativeSVGs({ theme }: DecorativeSVGsProps) {
  // Theme-aware filter for decorative SVGs
  const decorativeFilter = theme === 'light'
    ? 'grayscale(100%) brightness(0.15) opacity(0.12)'
    : 'opacity(0.2) hue-rotate(-10deg)'

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Halloween scene - large, top-left */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute -top-20 -left-20 w-[500px] h-[500px]"
        style={{ filter: decorativeFilter }}
      >
        <Image
          src="/decorative/halloween.svg"
          alt=""
          fill
          className="object-contain"
          priority
        />
      </motion.div>

      {/* Skull - bottom-right */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        className="absolute -bottom-16 -right-10 w-80 h-80"
        style={{ filter: decorativeFilter }}
      >
        <Image
          src="/decorative/skull.svg"
          alt=""
          fill
          className="object-contain"
          priority
        />
      </motion.div>
    </div>
  )
}
