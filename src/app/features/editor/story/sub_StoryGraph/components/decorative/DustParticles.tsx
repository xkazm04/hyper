'use client'

import React, { useRef, useEffect, memo } from 'react'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

interface DustParticlesProps {
  /** Whether the dust effect is visible */
  visible?: boolean
  /** Container width */
  width?: number
  /** Container height */
  height?: number
  /** Custom class name */
  className?: string
}

interface Particle {
  x: number
  y: number
  size: number
  opacity: number
  velocityX: number
  velocityY: number
  hue: number
  life: number
  maxLife: number
}

/**
 * DustParticles - Canvas-based floating dust particle system
 *
 * Uses a single canvas element for efficient particle rendering.
 * Particle count is capped and adjusts based on performance context.
 */
export const DustParticles = memo(function DustParticles({
  visible = true,
  width,
  height,
  className = '',
}: DustParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const lastTimeRef = useRef<number>(0)
  const isRunningRef = useRef(false)

  const { isLowPower, showHeavyAnimations, targetFps, maxParticles } = usePerformanceOptional()

  // Don't render if not visible or low power mode disables heavy animations
  const shouldRender = visible && showHeavyAnimations

  // Cap particle count based on performance mode
  const particleCount = isLowPower ? Math.min(50, maxParticles / 4) : Math.min(100, maxParticles / 2)

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

    // Create a new particle
    const createParticle = (): Particle => {
      const hueOptions = [45, 270, 25]
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: 1 + Math.random() * 2,
        opacity: 0.2 + Math.random() * 0.4,
        velocityX: (Math.random() - 0.5) * 0.3,
        velocityY: -0.1 - Math.random() * 0.3,
        hue: hueOptions[Math.floor(Math.random() * hueOptions.length)],
        life: 0,
        maxLife: 3000 + Math.random() * 4000,
      }
    }

    // Initialize particles
    particlesRef.current = []
    for (let i = 0; i < particleCount; i++) {
      const particle = createParticle()
      particle.life = Math.random() * particle.maxLife
      particlesRef.current.push(particle)
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

        particlesRef.current.forEach((particle, index) => {
          particle.x += particle.velocityX * (deltaTime / 16)
          particle.y += particle.velocityY * (deltaTime / 16)
          particle.life += deltaTime

          const lifeProgress = particle.life / particle.maxLife
          let alpha = particle.opacity

          if (lifeProgress < 0.1) {
            alpha *= lifeProgress / 0.1
          } else if (lifeProgress > 0.8) {
            alpha *= (1 - lifeProgress) / 0.2
          }

          if (particle.life >= particle.maxLife || particle.y < -10 || particle.x < -10 || particle.x > w + 10) {
            particlesRef.current[index] = createParticle()
            particlesRef.current[index].y = h + 10
            return
          }

          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${particle.hue}, 70%, 70%, ${alpha})`
          ctx.fill()

          if (!isLowPower && particle.size > 1.5) {
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${particle.hue}, 70%, 70%, ${alpha * 0.3})`
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
  }, [shouldRender, width, height, particleCount, targetFps, isLowPower])

  if (!visible) return null

  if (!showHeavyAnimations) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none z-5 ${className}`}
      data-testid="dust-particles"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
})

export default DustParticles
