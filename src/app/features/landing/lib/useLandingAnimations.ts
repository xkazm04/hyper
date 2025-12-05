'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// Mouse Position Hook - For spotlight effect
// ============================================================================

export function useMousePosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return position
}

// ============================================================================
// Intersection Observer Hook - For staggered reveals
// ============================================================================

export function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true)
        observer.disconnect()
      }
    }, { threshold: 0.1, ...options })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [options])

  return { ref, isInView }
}

// ============================================================================
// Typewriter Hook - For tagline
// ============================================================================

export function useTypewriter(text: string, speed: number = 50, delay: number = 0) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText('')
    setIsComplete(false)

    const timeout = setTimeout(() => {
      let currentIndex = 0
      const intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1))
          currentIndex++
        } else {
          setIsComplete(true)
          clearInterval(intervalId)
        }
      }, speed)

      return () => clearInterval(intervalId)
    }, delay)

    return () => clearTimeout(timeout)
  }, [text, speed, delay])

  return { displayedText, isComplete }
}

// ============================================================================
// PacMan Ghost Path Hook - For Halloween animation
// ============================================================================

type Direction = 'right' | 'down' | 'left' | 'up'

interface GhostPosition {
  x: number
  y: number
  direction: Direction
}

export function usePacmanGhost(enabled: boolean, speed: number = 2) {
  const [position, setPosition] = useState<GhostPosition>({ x: 0, y: 0, direction: 'right' })
  const animationRef = useRef<number | null>(null)
  const positionRef = useRef<GhostPosition>({ x: 0, y: 0, direction: 'right' })

  useEffect(() => {
    if (!enabled) return

    const padding = 20
    const ghostSize = 60

    const animate = () => {
      const { innerWidth: w, innerHeight: h } = window
      const maxX = w - ghostSize - padding
      const maxY = h - ghostSize - padding
      const minX = padding
      const minY = padding

      setPosition(prev => {
        let { x, y, direction } = prev
        positionRef.current = prev

        // Move based on direction
        switch (direction) {
          case 'right':
            x += speed
            if (x >= maxX) {
              x = maxX
              direction = 'down'
            }
            break
          case 'down':
            y += speed
            if (y >= maxY) {
              y = maxY
              direction = 'left'
            }
            break
          case 'left':
            x -= speed
            if (x <= minX) {
              x = minX
              direction = 'up'
            }
            break
          case 'up':
            y -= speed
            if (y <= minY) {
              y = minY
              direction = 'right'
            }
            break
        }

        return { x, y, direction }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [enabled, speed])

  return position
}

// ============================================================================
// Floating Particles Generator
// ============================================================================

export interface Particle {
  id: number
  x: number
  y: number
  size: number
  duration: number
  delay: number
}

export function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 10,
    delay: Math.random() * 5,
  }))
}
