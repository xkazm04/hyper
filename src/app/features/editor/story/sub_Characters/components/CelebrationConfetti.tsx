'use client'

import { useEffect, useRef, useMemo, memo } from 'react'

/**
 * Confetti particle configuration
 */
interface ConfettiParticle {
  color: string
  size: number
  velocityX: number
  velocityY: number
  rotation: number
  rotationSpeed: number
}

interface CelebrationConfettiProps {
  /** Whether to show the confetti */
  isActive: boolean
  /** Callback when animation completes */
  onComplete: () => void
  /** Number of particles to emit */
  particleCount?: number
}

const CELEBRATION_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 71%, 45%)',  // Emerald
  'hsl(217, 91%, 60%)',  // Blue
  'hsl(270, 70%, 60%)',  // Purple
  'hsl(45, 93%, 47%)',   // Amber
  'hsl(330, 81%, 60%)',  // Pink
]

const HALLOWEEN_COLORS = [
  'hsl(25, 95%, 53%)',   // Orange
  'hsl(270, 70%, 60%)',  // Purple
  'hsl(142, 71%, 35%)',  // Dark green
  'hsl(0, 0%, 100%)',    // White (ghost)
  'hsl(45, 93%, 47%)',   // Amber
]

/**
 * Creates a celebratory burst of confetti from the center of the viewport
 * Used for milestones like creating a new character
 */
const CelebrationConfetti = memo(function CelebrationConfetti({
  isActive,
  onComplete,
  particleCount = 24
}: CelebrationConfettiProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Check for reduced motion preference
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Generate particles with a spread from center
  const particles = useMemo((): ConfettiParticle[] => {
    if (!isActive || prefersReducedMotion) return []

    const isHalloween = typeof document !== 'undefined' &&
      document.documentElement.classList.contains('halloween')
    const colors = isHalloween ? HALLOWEEN_COLORS : CELEBRATION_COLORS

    return Array.from({ length: particleCount }, (_, i) => {
      // Create a full 360-degree spread
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.3
      const velocity = 100 + Math.random() * 80

      return {
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 5,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 60, // Extra upward bias for celebration
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720,
      }
    })
  }, [isActive, particleCount, prefersReducedMotion])

  useEffect(() => {
    if (!isActive) return

    // For reduced motion, complete immediately
    if (prefersReducedMotion) {
      onComplete()
      return
    }

    // Auto-cleanup after animation
    const timeout = setTimeout(onComplete, 900)
    return () => clearTimeout(timeout)
  }, [isActive, onComplete, prefersReducedMotion])

  // Don't render if not active or reduced motion
  if (!isActive || prefersReducedMotion || particles.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      data-testid="celebration-confetti"
      aria-hidden="true"
    >
      <div className="relative">
        {particles.map((particle, index) => (
          <div
            key={index}
            className="absolute confetti-particle"
            style={{
              '--velocity-x': `${particle.velocityX}px`,
              '--velocity-y': `${particle.velocityY}px`,
              '--rotation': `${particle.rotation}deg`,
              '--rotation-speed': `${particle.rotationSpeed}deg`,
              '--color': particle.color,
              '--size': `${particle.size}px`,
              '--delay': `${index * 15}ms`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
})

export default CelebrationConfetti
