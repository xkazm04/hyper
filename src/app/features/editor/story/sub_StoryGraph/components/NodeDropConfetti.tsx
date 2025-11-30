'use client'

import { useEffect, useRef, useMemo, memo } from 'react'

/**
 * Node drop confetti effect configuration
 */
interface ConfettiParticle {
  color: string
  size: number
  velocityX: number
  velocityY: number
  rotation: number
  rotationSpeed: number
}

interface NodeDropConfettiProps {
  /** X coordinate of the drop point */
  x: number
  /** Y coordinate of the drop point */
  y: number
  /** Node width for scaling the effect */
  nodeWidth?: number
  /** Callback when animation completes */
  onComplete: () => void
}

const CONFETTI_COLORS = [
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
 * Creates a burst of confetti particles at the specified position
 * Uses CSS animations for performance
 */
const NodeDropConfetti = memo(function NodeDropConfetti({
  x,
  y,
  nodeWidth = 140,
  onComplete
}: NodeDropConfettiProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Check for reduced motion preference (must be at top level)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Reduce particle count based on device capability and node size (max 12 for performance)
  const particleCount = useMemo(() => {
    if (prefersReducedMotion) return 0
    // Detect if device has reduced capability via memory or connection
    const hasReducedCapability = (typeof navigator !== 'undefined') && 
      (navigator.deviceMemory <= 4 || 
       (navigator as any).connection?.effectiveType === '3g')
    if (hasReducedCapability) return Math.max(4, Math.min(8, Math.round(nodeWidth / 20)))
    return Math.max(6, Math.min(12, Math.round(nodeWidth / 12)))
  }, [nodeWidth, prefersReducedMotion])

  // Generate particles once on mount
  const particles = useMemo((): ConfettiParticle[] => {
    if (prefersReducedMotion) return []

    const isHalloween = typeof document !== 'undefined' &&
      document.documentElement.classList.contains('halloween')
    const colors = isHalloween ? HALLOWEEN_COLORS : CONFETTI_COLORS

    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const velocity = 80 + Math.random() * 60

      return {
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 40, // Initial upward bias
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 720,
      }
    })
  }, [particleCount, prefersReducedMotion])

  useEffect(() => {
    // For reduced motion, complete immediately
    if (prefersReducedMotion) {
      onComplete()
      return
    }

    // Auto-cleanup after animation
    const timeout = setTimeout(onComplete, 700)
    return () => clearTimeout(timeout)
  }, [onComplete, prefersReducedMotion])

  // Don't render anything if reduced motion or no particles
  if (prefersReducedMotion || particles.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed z-50"
      style={{ left: x, top: y }}
      data-testid="node-drop-confetti"
      aria-hidden="true"
    >
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
            '--delay': `${index * 10}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
})

export default NodeDropConfetti
