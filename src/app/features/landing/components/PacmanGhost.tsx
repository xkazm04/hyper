'use client'

import { usePacmanGhost } from '../lib/useLandingAnimations'
import Image from 'next/image'

// ============================================================================
// PacMan Ghost - Pumpkin moving around screen borders
// ============================================================================

interface PacmanGhostProps {
  enabled: boolean
}

export function PacmanGhost({ enabled }: PacmanGhostProps) {
  const { x, y, direction } = usePacmanGhost(enabled, 2)

  if (!enabled) return null

  // Calculate rotation based on direction
  const rotation = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  }[direction]

  // Flip horizontally when going left
  const scaleX = direction === 'left' ? -1 : 1

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: x,
        top: y,
        width: 60,
        height: 60,
        transform: `scaleX(${scaleX})`,
        transition: 'transform 0.3s ease-out',
      }}
    >
      {/* Glow effect behind pumpkin */}
      <div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: 'hsl(25 90% 50% / 0.4)',
          transform: 'scale(1.5)',
        }}
      />

      {/* Trail effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          transform: direction === 'right' || direction === 'left'
            ? 'translateX(-20px)'
            : 'translateY(-20px)',
          filter: 'blur(8px)',
        }}
      >
        <Image
          src="/decorative/pumpkin.svg"
          alt=""
          fill
          className="object-contain"
        />
      </div>

      {/* Main pumpkin */}
      <div className="relative w-full h-full animate-bounce" style={{ animationDuration: '0.5s' }}>
        <Image
          src="/decorative/pumpkin.svg"
          alt=""
          fill
          className="object-contain drop-shadow-[0_0_10px_hsl(25_90%_50%/0.6)]"
        />
      </div>

      {/* Wakka wakka mouth animation overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          opacity: 0,
        }}
      >
        <div className="w-3 h-3 bg-black rounded-full animate-ping" />
      </div>
    </div>
  )
}
