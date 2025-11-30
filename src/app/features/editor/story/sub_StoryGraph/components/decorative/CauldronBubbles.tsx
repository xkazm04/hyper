'use client'

import React, { useRef, useEffect, memo } from 'react'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

interface CauldronBubblesProps {
  /** Whether the bubble effect is visible */
  visible?: boolean
  /** Container width */
  width?: number
  /** Container height */
  height?: number
  /** Custom class name */
  className?: string
}

interface Bubble {
  x: number
  y: number
  size: number
  opacity: number
  velocityY: number
  wobbleOffset: number
  wobbleSpeed: number
  hue: number
}

/**
 * CauldronBubbles - Canvas-based rising bubble effect
 *
 * Simulates bubbles rising from the bottom of the container.
 * Particle count is capped and adjusts based on performance context.
 */
export const CauldronBubbles = memo(function CauldronBubbles({
  visible = true,
  width,
  height,
  className = '',
}: CauldronBubblesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const bubblesRef = useRef<Bubble[]>([])
  const lastTimeRef = useRef<number>(0)
  const timeRef = useRef<number>(0)
  const isRunningRef = useRef(false)

  const { isLowPower, showHeavyAnimations, targetFps, maxParticles } = usePerformanceOptional()

  // Don't render if not visible or low power mode disables heavy animations
  const shouldRender = visible && showHeavyAnimations

  // Cap bubble count based on performance mode
  const bubbleCount = isLowPower ? Math.min(10, maxParticles / 20) : Math.min(25, maxParticles / 8)

  // Initialize and run animation
  useEffect(() => {
    if (!shouldRender) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = width ?? container.offsetWidth
    const h = height ?? container.offsetHeight

    if (w === 0 || h === 0) return

    canvas.width = w
    canvas.height = h

    // Create a new bubble
    const createBubble = (startFromBottom: boolean = true): Bubble => {
      return {
        x: Math.random() * w,
        y: startFromBottom ? h + Math.random() * 50 : Math.random() * h,
        size: 4 + Math.random() * 8,
        opacity: 0.3 + Math.random() * 0.4,
        velocityY: 0.3 + Math.random() * 0.5,
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: 1 + Math.random() * 2,
        hue: 270,
      }
    }

    // Initialize bubbles
    bubblesRef.current = []
    for (let i = 0; i < bubbleCount; i++) {
      bubblesRef.current.push(createBubble(false))
    }

    isRunningRef.current = true
    lastTimeRef.current = performance.now()

    const frameInterval = 1000 / targetFps

    // Animation loop
    const animate = (timestamp: number) => {
      if (!isRunningRef.current) return

      const elapsed = timestamp - lastTimeRef.current

      if (elapsed >= frameInterval) {
        const deltaTime = elapsed
        lastTimeRef.current = timestamp - (elapsed % frameInterval)

        ctx.clearRect(0, 0, w, h)
        timeRef.current += deltaTime

        bubblesRef.current.forEach((bubble, index) => {
          const wobble = Math.sin(timeRef.current * 0.001 * bubble.wobbleSpeed + bubble.wobbleOffset) * 2
          bubble.x += wobble * 0.02
          bubble.y -= bubble.velocityY * (deltaTime / 16)

          if (bubble.y < -bubble.size * 2) {
            bubblesRef.current[index] = createBubble(true)
            return
          }

          let alpha = bubble.opacity
          if (bubble.y > h - 50) {
            alpha *= (h - bubble.y) / 50
          }
          if (bubble.y < 50) {
            alpha *= bubble.y / 50
          }

          ctx.beginPath()
          ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${bubble.hue}, 70%, 60%, ${alpha * 0.3})`
          ctx.fill()

          ctx.beginPath()
          ctx.arc(bubble.x - bubble.size * 0.3, bubble.y - bubble.size * 0.3, bubble.size * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${bubble.hue}, 70%, 80%, ${alpha * 0.6})`
          ctx.fill()

          if (!isLowPower) {
            ctx.beginPath()
            ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2)
            ctx.strokeStyle = `hsla(${bubble.hue}, 70%, 70%, ${alpha * 0.4})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        })
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      isRunningRef.current = false
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
    }
  }, [shouldRender, width, height, bubbleCount, targetFps, isLowPower])

  if (!visible) return null

  if (!showHeavyAnimations) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none z-5 ${className}`}
      data-testid="cauldron-bubbles"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
})

export default CauldronBubbles
