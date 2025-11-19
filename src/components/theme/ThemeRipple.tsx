'use client'

import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'

/**
 * Position coordinates for the ripple origin
 */
export interface RipplePosition {
  x: number
  y: number
}

/**
 * Direction of the theme change
 */
export type RippleDirection = 'to-light' | 'to-dark'

/**
 * Props for the ThemeRipple component
 */
interface ThemeRippleProps {
  /** Whether the ripple animation is active */
  isActive: boolean
  /** Position where the ripple should originate from (viewport coordinates) */
  position: RipplePosition
  /** Direction of the theme change */
  direction: RippleDirection
  /** Callback when animation completes */
  onAnimationComplete?: () => void
}

/**
 * ThemeRipple component - Renders a circular ripple animation that expands from
 * the theme toggle button when the theme changes.
 *
 * Features:
 * - Uses clip-path for smooth morphing animation
 * - Respects prefers-reduced-motion
 * - Renders via portal for proper z-index stacking
 * - Auto-cleans up after animation completes
 */
export function ThemeRipple({
  isActive,
  position,
  direction,
  onAnimationComplete
}: ThemeRippleProps) {
  const [mounted, setMounted] = useState(false)
  const [animating, setAnimating] = useState(false)

  // Mount check for portal - use layout effect to avoid setState warning
  useEffect(() => {
    // Use requestAnimationFrame to defer state update
    const frame = requestAnimationFrame(() => {
      setMounted(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  // Trigger animation when active changes to true
  useEffect(() => {
    if (!isActive || !mounted) return

    // Use requestAnimationFrame to defer state update and avoid cascading renders
    const frame = requestAnimationFrame(() => {
      setAnimating(true)

      // Calculate viewport percentage for position
      const vw = window.innerWidth
      const vh = window.innerHeight
      const xPercent = (position.x / vw) * 100
      const yPercent = (position.y / vh) * 100

      // Set CSS custom properties for the ripple origin
      document.documentElement.style.setProperty('--ripple-x', `${xPercent}%`)
      document.documentElement.style.setProperty('--ripple-y', `${yPercent}%`)
    })

    // Animation duration matches CSS (600ms)
    const timer = setTimeout(() => {
      setAnimating(false)
      onAnimationComplete?.()
    }, 600)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [isActive, mounted, position, onAnimationComplete])

  // Don't render on server or when not animating
  if (!mounted || !animating) {
    return null
  }

  const rippleElement = (
    <div
      className={`
        theme-ripple-clip
        ${direction === 'to-dark' ? 'theme-ripple-clip-to-dark' : 'theme-ripple-clip-to-light'}
        theme-ripple-clip-animate
      `}
      data-testid="theme-ripple-effect"
      aria-hidden="true"
    />
  )

  // Render via portal to ensure proper stacking
  return createPortal(rippleElement, document.body)
}

/**
 * Hook for managing theme ripple state
 *
 * @returns Object with ripple state and trigger function
 *
 * @example
 * ```tsx
 * const { rippleProps, triggerRipple } = useThemeRipple()
 *
 * const handleThemeToggle = (e: React.MouseEvent) => {
 *   triggerRipple(e, 'to-dark')
 *   toggleTheme()
 * }
 *
 * return (
 *   <>
 *     <button onClick={handleThemeToggle}>Toggle</button>
 *     <ThemeRipple {...rippleProps} />
 *   </>
 * )
 * ```
 */
export function useThemeRipple() {
  const [isActive, setIsActive] = useState(false)
  const [position, setPosition] = useState<RipplePosition>({ x: 0, y: 0 })
  const [direction, setDirection] = useState<RippleDirection>('to-dark')

  const triggerRipple = useCallback((
    event: React.MouseEvent | { clientX: number; clientY: number },
    rippleDirection: RippleDirection
  ) => {
    // Get click position
    const x = event.clientX
    const y = event.clientY

    setPosition({ x, y })
    setDirection(rippleDirection)
    setIsActive(true)
  }, [])

  const handleAnimationComplete = useCallback(() => {
    setIsActive(false)
  }, [])

  return {
    rippleProps: {
      isActive,
      position,
      direction,
      onAnimationComplete: handleAnimationComplete
    },
    triggerRipple
  }
}
