'use client'

import React, { useRef, useEffect, memo } from 'react'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

interface FogOverlayProps {
  /** Whether the fog effect is visible */
  visible?: boolean
  /** Container width */
  width?: number
  /** Container height */
  height?: number
  /** Custom class name */
  className?: string
}

interface FogLayer {
  offset: number
  speed: number
  opacity: number
  y: number
  height: number
}

/**
 * FogOverlay - Canvas-based fog effect for the story graph
 *
 * Uses a single canvas element for efficient rendering.
 * Automatically throttles or disables based on performance context.
 */
export const FogOverlay = memo(function FogOverlay({
  visible = true,
  width,
  height,
  className = '',
}: FogOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const fogLayersRef = useRef<FogLayer[]>([])
  const lastTimeRef = useRef<number>(0)
  const isRunningRef = useRef(false)

  const { isLowPower, showHeavyAnimations, targetFps } = usePerformanceOptional()

  // Don't render if not visible or low power mode disables heavy animations
  const shouldRender = visible && showHeavyAnimations

  // Initialize and run animation
  useEffect(() => {
    if (!shouldRender) return

    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize fog layers
    fogLayersRef.current = isLowPower ? [
      { offset: 0, speed: 0.015, opacity: 0.15, y: 0.85, height: 0.15 },
      { offset: 0, speed: 0.01, opacity: 0.1, y: 0.9, height: 0.1 },
    ] : [
      { offset: 0, speed: 0.015, opacity: 0.15, y: 0.85, height: 0.15 },
      { offset: 0, speed: 0.01, opacity: 0.1, y: 0.9, height: 0.1 },
      { offset: 0, speed: 0.02, opacity: 0.08, y: 0.92, height: 0.08 },
    ]

    isRunningRef.current = true
    lastTimeRef.current = performance.now()

    const frameInterval = 1000 / targetFps

    // Draw fog on canvas
    const drawFog = (w: number, h: number) => {
      ctx.clearRect(0, 0, w, h)

      fogLayersRef.current.forEach((layer) => {
        const fogY = h * layer.y
        const fogHeight = h * layer.height

        const gradient = ctx.createLinearGradient(0, fogY, 0, h)
        gradient.addColorStop(0, `hsla(270, 20%, 10%, 0)`)
        gradient.addColorStop(0.3, `hsla(270, 20%, 10%, ${layer.opacity * 0.5})`)
        gradient.addColorStop(1, `hsla(270, 20%, 10%, ${layer.opacity})`)

        ctx.fillStyle = gradient
        ctx.fillRect(-w * 0.5 + layer.offset, fogY, w * 2, fogHeight)
      })
    }

    // Animation loop
    const animate = (timestamp: number) => {
      if (!isRunningRef.current) return

      const elapsed = timestamp - lastTimeRef.current

      if (elapsed >= frameInterval) {
        lastTimeRef.current = timestamp - (elapsed % frameInterval)

        const w = width ?? container.offsetWidth
        const h = height ?? container.offsetHeight

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w
          canvas.height = h
        }

        // Update fog layer offsets
        fogLayersRef.current.forEach((layer) => {
          layer.offset += layer.speed * elapsed
          if (layer.offset > w) {
            layer.offset = 0
          }
        })

        drawFog(w, h)
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
  }, [shouldRender, width, height, targetFps, isLowPower])

  if (!visible) return null

  // If in low power mode with animations disabled, show static gradient
  if (!showHeavyAnimations) {
    return (
      <div
        ref={containerRef}
        className={`absolute inset-0 pointer-events-none z-10 ${className}`}
        data-testid="fog-overlay-static"
      >
        <div className="absolute bottom-0 left-0 w-full h-20 bg-linear-to-t from-[#1a0a2e]/30 via-[#1a0a2e]/15 to-transparent" />
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      data-testid="fog-overlay"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
})

export default FogOverlay
