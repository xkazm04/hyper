'use client'

import { useState, useEffect, useCallback, memo } from 'react'

interface ConfettiParticle {
  id: number
  x: number
  y: number
  color: string
  size: number
  velocityX: number
  velocityY: number
  rotation: number
  rotationSpeed: number
  delay: number
}

interface SavedRibbonProps {
  show: boolean
  onHide?: () => void
  muted?: boolean
}

const CONFETTI_COLORS = [
  'hsl(142, 71%, 45%)', // Green (success)
  'hsl(210, 100%, 60%)', // Blue
  'hsl(45, 93%, 47%)',   // Gold
  'hsl(280, 70%, 60%)',  // Purple
  'hsl(330, 81%, 60%)',  // Pink
]

function generateConfettiParticles(count: number): ConfettiParticle[] {
  const particles: ConfettiParticle[] = []

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const velocity = 40 + Math.random() * 60

    particles.push({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20, // Start near center
      y: 0, // Start from top
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 4,
      velocityX: Math.cos(angle) * velocity,
      velocityY: Math.sin(angle) * velocity + 30, // Bias downward
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 720,
      delay: Math.random() * 100,
    })
  }

  return particles
}

export const SavedRibbon = memo(function SavedRibbon({
  show,
  onHide,
  muted = false
}: SavedRibbonProps) {
  const [visible, setVisible] = useState(false)
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([])
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle show/hide lifecycle
  useEffect(() => {
    if (show && !muted) {
      setVisible(true)
      setIsAnimating(true)
      setConfetti(generateConfettiParticles(12))

      // Auto-hide after 2 seconds
      const hideTimer = setTimeout(() => {
        setVisible(false)
        onHide?.()
      }, 2000)

      // Clear confetti after animation
      const confettiTimer = setTimeout(() => {
        setConfetti([])
        setIsAnimating(false)
      }, 1500)

      return () => {
        clearTimeout(hideTimer)
        clearTimeout(confettiTimer)
      }
    }
  }, [show, muted, onHide])

  // Reset when hidden
  useEffect(() => {
    if (!show) {
      const resetTimer = setTimeout(() => {
        setVisible(false)
        setConfetti([])
        setIsAnimating(false)
      }, 300) // Allow exit animation
      return () => clearTimeout(resetTimer)
    }
  }, [show])

  if (!visible && !isAnimating) return null
  if (muted) return null

  return (
    <div
      className="absolute inset-x-0 top-0 z-50 pointer-events-none overflow-hidden"
      data-testid="saved-ribbon-container"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Ribbon */}
      <div
        className={`
          relative flex items-center justify-center
          py-2 px-4
          bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500
          text-white font-semibold text-sm
          shadow-lg
          transform transition-all duration-300 ease-out
          ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        `}
        data-testid="saved-ribbon"
      >
        {/* Shimmer effect */}
        <div
          className="absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="saved-ribbon-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>

        {/* Text content */}
        <span className="relative z-10 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          Saved!
        </span>
      </div>

      {/* Confetti burst */}
      {confetti.length > 0 && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2"
          aria-hidden="true"
        >
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="confetti-particle absolute"
              style={{
                '--size': `${particle.size}px`,
                '--color': particle.color,
                '--velocity-x': `${particle.velocityX}px`,
                '--velocity-y': `${particle.velocityY}px`,
                '--rotation': `${particle.rotation}deg`,
                '--rotation-speed': `${particle.rotationSpeed}deg`,
                '--delay': `${particle.delay}ms`,
                left: `${particle.x}%`,
                top: 0,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
    </div>
  )
})

// Hook for managing saved ribbon state
export function useSavedRibbon() {
  const [showRibbon, setShowRibbon] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Load muted preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('savedRibbonMuted')
    if (stored !== null) {
      setIsMuted(stored === 'true')
    }
  }, [])

  const triggerRibbon = useCallback(() => {
    setShowRibbon(true)
  }, [])

  const hideRibbon = useCallback(() => {
    setShowRibbon(false)
  }, [])

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newValue = !prev
      localStorage.setItem('savedRibbonMuted', String(newValue))
      return newValue
    })
  }, [])

  return {
    showRibbon,
    isMuted,
    triggerRibbon,
    hideRibbon,
    toggleMute,
  }
}
