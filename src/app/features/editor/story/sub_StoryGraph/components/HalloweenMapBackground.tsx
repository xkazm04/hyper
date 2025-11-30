'use client'

import React, { useEffect, useRef, memo, useMemo } from 'react'

/**
 * HalloweenMapBackground - Night sky themed background for the story graph
 *
 * Features:
 * - Dark night sky gradient with purple/orange accents
 * - Twinkling stars animation
 * - Floating pumpkin silhouettes
 * - Spooky fog effect at the bottom
 */
export const HalloweenMapBackground = memo(function HalloweenMapBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" data-testid="halloween-map-background">
      {/* Night sky gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0a0612] via-[#1a0a2e] to-[#0d0820]" />

      {/* Stars layer - simplified */}
      <div className="absolute inset-0 halloween-stars" />

      {/* Large distant stars with twinkle - reduced count for performance */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Star glow filter - simplified */}
          <filter id="starGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Twinkling stars - reduced from 12 to 8 for 33% performance gain */}
        <g filter="url(#starGlow)">
          <circle cx="10%" cy="15%" r="1.5" fill="hsl(45, 100%, 90%)" className="animate-halloween-twinkle" />
          <circle cx="25%" cy="8%" r="1" fill="hsl(270, 70%, 80%)" className="animate-halloween-twinkle-delay-1" />
          <circle cx="45%" cy="20%" r="1.2" fill="hsl(25, 100%, 80%)" className="animate-halloween-twinkle-delay-2" />
          <circle cx="65%" cy="5%" r="1" fill="hsl(45, 100%, 90%)" className="animate-halloween-twinkle" />
          <circle cx="75%" cy="25%" r="0.8" fill="hsl(270, 70%, 80%)" className="animate-halloween-twinkle-delay-1" />
          <circle cx="55%" cy="30%" r="0.9" fill="hsl(270, 70%, 80%)" className="animate-halloween-twinkle-delay-1" />
          <circle cx="95%" cy="18%" r="1.1" fill="hsl(25, 100%, 80%)" className="animate-halloween-twinkle-delay-2" />
          <circle cx="5%" cy="45%" r="0.8" fill="hsl(45, 100%, 90%)" className="animate-halloween-twinkle" />
        </g>

        {/* Distant bat silhouettes - kept for atmosphere */}
        <g className="animate-halloween-float-slow" opacity="0.12">
          <path
            d="M20 60 Q25 55 30 60 L28 65 Q25 62 22 65 Z"
            fill="hsl(270, 20%, 10%)"
            transform="translate(50, 80) scale(0.8)"
          />
          <path
            d="M20 60 Q25 55 30 60 L28 65 Q25 62 22 65 Z"
            fill="hsl(270, 20%, 10%)"
            transform="translate(250, 120) scale(0.6)"
          />
        </g>
      </svg>

      {/* Floating pumpkin decorations - simplified opacity */}
      <div className="absolute bottom-0 left-0 w-full h-24 opacity-8">
        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="xMidYMax slice">
          {/* Reduced pumpkin count from 8 to 4 for performance */}
          <g fill="hsl(25, 95%, 25%)" opacity="0.5">
            <ellipse cx="50" cy="85" rx="12" ry="10" />
            <rect x="48" y="75" width="4" height="8" rx="2" />
            <ellipse cx="150" cy="90" rx="8" ry="7" />
            <rect x="148" y="83" width="3" height="5" rx="1" />
            <ellipse cx="280" cy="88" rx="10" ry="8" />
            <rect x="278" y="80" width="4" height="6" rx="2" />
            <ellipse cx="350" cy="92" rx="6" ry="5" />
            <rect x="348" y="87" width="3" height="4" rx="1" />
          </g>
        </svg>
      </div>

      {/* Fog layer at bottom - simplified */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-linear-to-t from-[#1a0a2e]/50 via-[#1a0a2e]/20 to-transparent animate-halloween-fog" />

      {/* Purple mist overlay - simplified */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#2d1b4e]/10" />

      {/* Vignette effect - optimized shadow */}
      <div className="absolute inset-0 shadow-[inset_0_0_120px_hsl(270,50%,5%/0.6)]" />

      {/* Subtle orange glow from below - smaller blur radius */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-32 bg-gradient-radial from-[#ff6b00]/3 via-transparent to-transparent blur-2xl" />
    </div>
  )
})

/**
 * NodeParticleEffect - Particle burst effect when clicking nodes
 *
 * Creates orange/purple sparkles that emanate from the click point
 */
interface NodeParticleEffectProps {
  x: number
  y: number
  onComplete: () => void
}

export const NodeParticleEffect = memo(function NodeParticleEffect({
  x,
  y,
  onComplete
}: NodeParticleEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timeout = setTimeout(onComplete, 1000)
    return () => clearTimeout(timeout)
  }, [onComplete])

  // Generate particles with deterministic but varied directions using seeded values
  const particles = useMemo(() => {
    // Use deterministic pseudo-random based on position for stable rendering
    const seed = (x + y) % 1000
    const pseudoRandom = (index: number) => {
      const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453
      return value - Math.floor(value)
    }

    return Array.from({ length: 8 }, (_, i) => {
      const angle = (i / 8) * Math.PI * 2
      const distance = 30 + pseudoRandom(i) * 20
      const size = 4 + pseudoRandom(i + 8) * 4
      const duration = 0.5 + pseudoRandom(i + 16) * 0.3
      const color = i % 2 === 0 ? 'hsl(25, 95%, 53%)' : 'hsl(270, 70%, 60%)'

      return {
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        size,
        duration,
        color
      }
    })
  }, [x, y])

  return (
    <div
      ref={containerRef}
      className="fixed pointer-events-none z-50"
      style={{ left: x, top: y }}
      data-testid="node-particle-effect"
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-halloween-particle"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size}px ${particle.color}`,
            '--tx': `${particle.tx}px`,
            '--ty': `${particle.ty}px`,
            animationDuration: `${particle.duration}s`
          } as React.CSSProperties}
        />
      ))}

      {/* Central pumpkin emoji burst */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 text-lg animate-halloween-pumpkin-burst">
        {String.fromCodePoint(0x1F383)}
      </div>
    </div>
  )
})
