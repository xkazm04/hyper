'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

/**
 * Options for useThrottleAnimation hook
 */
export interface ThrottleAnimationOptions {
  /** Maximum frames per second (default: 30) */
  fps?: number
  /** Whether to pause the animation */
  paused?: boolean
  /** Override for low-power mode detection */
  isLowPower?: boolean
}

/**
 * Return type for useThrottleAnimation hook
 */
export interface ThrottleAnimationReturn {
  /** Start the animation loop */
  start: () => void
  /** Stop the animation loop */
  stop: () => void
  /** Whether the animation is currently running */
  isRunning: boolean
}

/**
 * useThrottleAnimation - Hook for running animations at a throttled frame rate
 *
 * This hook uses requestAnimationFrame with a timestamp buffer to limit
 * the callback execution to a specified FPS. It respects the performance
 * context and will reduce FPS or skip frames when in low-power mode.
 *
 * @param callback - The animation callback to execute each frame. Receives delta time in ms.
 * @param options - Configuration options
 * @returns Controls to start/stop the animation
 *
 * @example
 * ```tsx
 * const { start, stop } = useThrottleAnimation(
 *   (deltaTime) => {
 *     // Update animation state
 *     position += velocity * deltaTime
 *   },
 *   { fps: 30 }
 * )
 * ```
 */
export function useThrottleAnimation(
  callback: (deltaTime: number) => void,
  options: ThrottleAnimationOptions = {}
): ThrottleAnimationReturn {
  const { fps = 30, paused = false, isLowPower: isLowPowerOverride } = options
  const { isLowPower: contextIsLowPower, targetFps } = usePerformanceOptional()

  // Use override if provided, otherwise use context
  const isLowPower = isLowPowerOverride ?? contextIsLowPower

  // Adjust FPS based on performance mode
  const effectiveFps = isLowPower ? Math.min(fps, targetFps) : fps
  const frameInterval = 1000 / effectiveFps

  // State for isRunning (exposed to consumers)
  const [isRunning, setIsRunning] = useState(false)

  // Refs for animation state
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const isRunningRef = useRef(false)
  const callbackRef = useRef(callback)
  const frameIntervalRef = useRef(frameInterval)

  // Keep refs updated
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    frameIntervalRef.current = frameInterval
  }, [frameInterval])

  // Start animation
  const start = useCallback(() => {
    if (isRunningRef.current || paused) return

    isRunningRef.current = true
    setIsRunning(true)
    lastFrameTimeRef.current = performance.now()

    // Animation loop defined inside start to avoid self-reference issues
    const animate = (timestamp: number) => {
      if (!isRunningRef.current) return

      const elapsed = timestamp - lastFrameTimeRef.current

      if (elapsed >= frameIntervalRef.current) {
        // Calculate actual delta time for smooth animations
        const deltaTime = elapsed

        // Update last frame time, accounting for drift
        lastFrameTimeRef.current = timestamp - (elapsed % frameIntervalRef.current)

        // Execute callback with delta time
        callbackRef.current(deltaTime)
      }

      // Schedule next frame
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [paused])

  // Stop animation
  const stop = useCallback(() => {
    isRunningRef.current = false
    setIsRunning(false)
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Stop if paused changes - using direct ref manipulation to avoid setState in effect
  useEffect(() => {
    if (paused && isRunningRef.current) {
      isRunningRef.current = false
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      // Defer state update to avoid sync setState in effect
      queueMicrotask(() => setIsRunning(false))
    }
  }, [paused])

  return {
    start,
    stop,
    isRunning,
  }
}

/**
 * useThrottleCallback - Throttle a callback to a maximum FPS
 *
 * Unlike useThrottleAnimation, this doesn't start an animation loop.
 * Instead, it returns a throttled version of the callback that can be
 * called manually (e.g., from event handlers).
 *
 * @param callback - The callback to throttle
 * @param fps - Maximum calls per second
 * @returns Throttled callback
 */
export function useThrottleCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  fps: number = 30
): T {
  const lastCallTimeRef = useRef<number>(0)
  const callbackRef = useRef(callback)
  const frameInterval = 1000 / fps

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  return useCallback((...args: Parameters<T>) => {
    const now = performance.now()
    const elapsed = now - lastCallTimeRef.current

    if (elapsed >= frameInterval) {
      lastCallTimeRef.current = now
      callbackRef.current(...args)
    }
  }, [frameInterval]) as T
}
