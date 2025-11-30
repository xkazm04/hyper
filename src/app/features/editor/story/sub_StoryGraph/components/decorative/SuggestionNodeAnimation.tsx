'use client'

import React, { useRef, useEffect, memo, useCallback } from 'react'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

interface SuggestionNodeAnimationProps {
  /** Whether the animation is visible */
  visible?: boolean
  /** Node element width */
  width?: number
  /** Node element height */
  height?: number
  /** Custom class name */
  className?: string
  /** Whether the node is hovered */
  isHovered?: boolean
}

interface Sparkle {
  x: number
  y: number
  size: number
  opacity: number
  life: number
  maxLife: number
  velocityX: number
  velocityY: number
}

/**
 * SuggestionNodeAnimation - Canvas-based sparkle effect for suggestion nodes
 *
 * Creates a subtle sparkle border effect around suggested nodes.
 * Automatically throttles based on performance context.
 */
export const SuggestionNodeAnimation = memo(function SuggestionNodeAnimation({
  visible = true,
  width = 160,
  height = 80,
  className = '',
  isHovered = false,
}: SuggestionNodeAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const sparklesRef = useRef<Sparkle[]>([])
  const lastTimeRef = useRef<number>(0)
  const glowRef = useRef<number>(0)
  const isRunningRef = useRef(false)

  const { isLowPower, showHeavyAnimations, targetFps } = usePerformanceOptional()

  // Don't render if not visible or low power mode disables heavy animations
  const shouldRender = visible && showHeavyAnimations

  // Cap sparkle count based on performance mode
  const sparkleCount = isLowPower ? 4 : 8
  const borderPadding = 2

  // Create a new sparkle along the border
  const createSparkle = useCallback((w: number, h: number): Sparkle => {
    const perimeter = 2 * (w + h)
    const position = Math.random() * perimeter
    let x: number, y: number

    if (position < w) {
      x = position
      y = borderPadding
    } else if (position < w + h) {
      x = w - borderPadding
      y = position - w
    } else if (position < 2 * w + h) {
      x = w - (position - w - h)
      y = h - borderPadding
    } else {
      x = borderPadding
      y = h - (position - 2 * w - h)
    }

    return {
      x,
      y,
      size: 1 + Math.random() * 2,
      opacity: 0.5 + Math.random() * 0.5,
      life: 0,
      maxLife: 800 + Math.random() * 800,
      velocityX: (Math.random() - 0.5) * 0.5,
      velocityY: (Math.random() - 0.5) * 0.5,
    }
  }, [])

  // Initialize and run animation
  useEffect(() => {
    if (!shouldRender) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with device pixel ratio
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Initialize sparkles
    sparklesRef.current = []
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = createSparkle(width, height)
      sparkle.life = Math.random() * sparkle.maxLife
      sparklesRef.current.push(sparkle)
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

        // Clear and draw
        ctx.clearRect(0, 0, width, height)

        // Update and render glow pulse
        glowRef.current += deltaTime * 0.003
        const glowIntensity = 0.3 + Math.sin(glowRef.current) * 0.2
        const hoverBoost = isHovered ? 0.3 : 0

        // Draw glowing border
        const borderRadius = 8
        ctx.strokeStyle = `hsla(45, 100%, 70%, ${(glowIntensity + hoverBoost) * 0.5})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(borderPadding, borderPadding, width - borderPadding * 2, height - borderPadding * 2, borderRadius)
        ctx.stroke()

        // Draw outer glow (skip in low power mode)
        if (!isLowPower) {
          ctx.strokeStyle = `hsla(45, 100%, 70%, ${(glowIntensity + hoverBoost) * 0.2})`
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.roundRect(0, 0, width, height, borderRadius + 2)
          ctx.stroke()
        }

        // Update and draw sparkles
        sparklesRef.current.forEach((sparkle, index) => {
          sparkle.x += sparkle.velocityX * (deltaTime / 16)
          sparkle.y += sparkle.velocityY * (deltaTime / 16)
          sparkle.life += deltaTime

          const lifeProgress = sparkle.life / sparkle.maxLife
          let alpha = sparkle.opacity

          if (lifeProgress < 0.2) {
            alpha *= lifeProgress / 0.2
          } else if (lifeProgress > 0.7) {
            alpha *= (1 - lifeProgress) / 0.3
          }

          if (sparkle.life >= sparkle.maxLife) {
            sparklesRef.current[index] = createSparkle(width, height)
            return
          }

          ctx.beginPath()
          ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(45, 100%, 80%, ${alpha})`
          ctx.fill()

          if (!isLowPower && sparkle.size > 1.5) {
            ctx.beginPath()
            ctx.arc(sparkle.x, sparkle.y, sparkle.size * 2, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(45, 100%, 70%, ${alpha * 0.3})`
            ctx.fill()
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
  }, [shouldRender, width, height, sparkleCount, targetFps, isLowPower, isHovered, createSparkle])

  if (!visible) return null

  // If in low power mode, show static border
  if (!showHeavyAnimations) {
    return (
      <div
        className={`absolute inset-0 pointer-events-none rounded-lg border-2 border-yellow-400/30 ${className}`}
        data-testid="suggestion-node-animation-static"
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width, height }}
      data-testid="suggestion-node-animation"
    />
  )
})

export default SuggestionNodeAnimation
