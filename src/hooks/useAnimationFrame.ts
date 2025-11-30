'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

/**
 * Options for useAnimationFrame hook
 */
export interface AnimationFrameOptions {
  /** Whether to automatically start the animation on mount (default: false) */
  autoStart?: boolean
  /** Whether to pause the animation */
  paused?: boolean
  /** Whether to respect low-power mode and disable animation */
  respectLowPower?: boolean
}

/**
 * Return type for useAnimationFrame hook
 */
export interface AnimationFrameReturn {
  /** Start the animation loop */
  start: () => void
  /** Stop the animation loop */
  stop: () => void
  /** Whether the animation is currently running */
  isRunning: boolean
}

/**
 * useAnimationFrame - Hook for running requestAnimationFrame loops
 *
 * This hook provides a clean way to use requestAnimationFrame with proper
 * cleanup and performance context integration. It will automatically
 * disable animations when in low-power mode if respectLowPower is true.
 *
 * @param callback - The animation callback to execute each frame.
 *                   Receives timestamp and delta time in ms.
 * @param options - Configuration options
 * @returns Controls to start/stop the animation
 *
 * @example
 * ```tsx
 * const { start, stop } = useAnimationFrame(
 *   (timestamp, deltaTime) => {
 *     // Update animation state at full frame rate
 *     ctx.clearRect(0, 0, width, height)
 *     drawParticles(ctx, deltaTime)
 *   },
 *   { autoStart: true, respectLowPower: true }
 * )
 * ```
 */
export function useAnimationFrame(
  callback: (timestamp: number, deltaTime: number) => void,
  options: AnimationFrameOptions = {}
): AnimationFrameReturn {
  const { autoStart = false, paused = false, respectLowPower = true } = options
  const { isLowPower } = usePerformanceOptional()

  // State for isRunning (exposed to consumers)
  const [isRunning, setIsRunning] = useState(false)

  // Refs for animation state
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const callbackRef = useRef(callback)

  // Determine if animation should be disabled
  const shouldDisable = respectLowPower && isLowPower

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Start animation
  const start = useCallback(() => {
    if (isRunningRef.current || paused || shouldDisable) return

    isRunningRef.current = true
    setIsRunning(true)
    lastFrameTimeRef.current = 0

    // Animation loop defined inside start to avoid self-reference issues
    const animate = (timestamp: number) => {
      if (!isRunningRef.current) return

      // Calculate delta time
      const deltaTime = lastFrameTimeRef.current > 0
        ? timestamp - lastFrameTimeRef.current
        : 16.67 // Default to ~60fps for first frame

      lastFrameTimeRef.current = timestamp

      // Execute callback
      callbackRef.current(timestamp, deltaTime)

      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [paused, shouldDisable])

  // Stop animation
  const stop = useCallback(() => {
    isRunningRef.current = false
    setIsRunning(false)
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    lastFrameTimeRef.current = 0
  }, [])

  // Auto-start if enabled - using refs to avoid calling setState in effect
  useEffect(() => {
    if (autoStart && !shouldDisable && !paused && !isRunningRef.current) {
      // Start animation inline to avoid calling start() which has setState
      isRunningRef.current = true
      lastFrameTimeRef.current = 0

      const animate = (timestamp: number) => {
        if (!isRunningRef.current) return

        const deltaTime = lastFrameTimeRef.current > 0
          ? timestamp - lastFrameTimeRef.current
          : 16.67

        lastFrameTimeRef.current = timestamp
        callbackRef.current(timestamp, deltaTime)
        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)
      queueMicrotask(() => setIsRunning(true))
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [autoStart, shouldDisable, paused])

  // Stop if paused or disabled changes - using refs to avoid calling setState in effect
  useEffect(() => {
    if ((paused || shouldDisable) && isRunningRef.current) {
      isRunningRef.current = false
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      lastFrameTimeRef.current = 0
      queueMicrotask(() => setIsRunning(false))
    }
  }, [paused, shouldDisable])

  return {
    start,
    stop,
    isRunning,
  }
}

/**
 * useRAF - Simplified requestAnimationFrame hook
 *
 * A simpler version that just runs a callback on every frame.
 * Automatically cleans up on unmount.
 *
 * @param callback - Callback to run each frame
 * @param active - Whether the animation is active (default: true)
 */
export function useRAF(
  callback: (deltaTime: number) => void,
  active: boolean = true
): void {
  const callbackRef = useRef(callback)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!active) return

    let animationId: number

    function loop(timestamp: number) {
      const deltaTime = lastTimeRef.current > 0
        ? timestamp - lastTimeRef.current
        : 16.67

      lastTimeRef.current = timestamp
      callbackRef.current(deltaTime)
      animationId = requestAnimationFrame(loop)
    }

    animationId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animationId)
      lastTimeRef.current = 0
    }
  }, [active])
}
