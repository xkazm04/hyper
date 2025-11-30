'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'

/**
 * Performance context type definition
 * Provides performance detection and animation throttling capabilities
 */
export interface PerformanceContextType {
  /** Whether the device is in low-power mode or has limited resources */
  isLowPower: boolean
  /** Toggle low-power mode manually */
  toggleLowPower: () => void
  /** Force enable low-power mode */
  enableLowPower: () => void
  /** Force disable low-power mode */
  disableLowPower: () => void
  /** Whether heavy animations should be rendered */
  showHeavyAnimations: boolean
  /** Maximum particles allowed based on performance mode */
  maxParticles: number
  /** Target FPS for throttled animations */
  targetFps: number
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

/** localStorage key for persisting performance preference */
const STORAGE_KEY = 'performance-low-power'

/** Default max particles for normal mode */
const DEFAULT_MAX_PARTICLES = 200

/** Max particles for low-power mode */
const LOW_POWER_MAX_PARTICLES = 100

/** Target FPS for normal mode */
const DEFAULT_TARGET_FPS = 60

/** Target FPS for low-power mode */
const LOW_POWER_TARGET_FPS = 30

/**
 * Detects if the device is low-performance based on hardware capabilities
 * Uses navigator.hardwareConcurrency, navigator.deviceMemory, and a frame budget test
 */
function detectLowPerformance(): Promise<boolean> {
  return new Promise((resolve) => {
    // Check hardware concurrency (CPU cores)
    const cores = navigator.hardwareConcurrency || 4
    if (cores <= 2) {
      resolve(true)
      return
    }

    // Check device memory (in GB) - only available in some browsers
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    if (memory !== undefined && memory <= 4) {
      resolve(true)
      return
    }

    // Frame budget test - measure if we can hit 60fps
    let frameCount = 0
    const startTime = performance.now()
    const testDuration = 500 // 500ms test

    function measureFrame(timestamp: number) {
      frameCount++
      const elapsed = timestamp - startTime

      if (elapsed < testDuration) {
        requestAnimationFrame(measureFrame)
      } else {
        // Calculate average FPS
        const fps = (frameCount / elapsed) * 1000
        // If we can't maintain 55+ fps during idle, we're low performance
        resolve(fps < 55)
      }
    }

    requestAnimationFrame(measureFrame)
  })
}

/**
 * Load saved preference from localStorage
 */
function loadPreference(): boolean | null {
  try {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) {
      return saved === 'true'
    }
  } catch (error) {
    console.warn('Failed to load performance preference:', error)
  }
  return null
}

/**
 * Save preference to localStorage
 */
function savePreference(isLowPower: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(isLowPower))
  } catch (error) {
    console.warn('Failed to save performance preference:', error)
  }
}

/**
 * PerformanceProvider - Provides performance detection and animation control
 *
 * Features:
 * - Auto-detects low-performance devices on mount
 * - Respects prefers-reduced-motion media query
 * - Allows manual override via UI
 * - Persists preference to localStorage
 * - Provides particle limits and FPS targets
 */
export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [isLowPower, setIsLowPower] = useState<boolean>(() => {
    // Check for saved preference first
    const saved = loadPreference()
    if (saved !== null) return saved

    // Default to false, will be updated after detection
    return false
  })

  const detectionRef = useRef(false)

  // Detect low performance on mount - using callback-based setState to avoid sync issues
  useEffect(() => {
    // Only run detection once
    if (detectionRef.current) return
    detectionRef.current = true

    // Check if user has a saved preference (already handled in initial state)
    const saved = loadPreference()
    if (saved !== null) {
      // Already set in initial state, skip
      return
    }

    // Check prefers-reduced-motion
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReducedMotion) {
        // Use callback to defer state update
        queueMicrotask(() => setIsLowPower(true))
        return
      }
    }

    // Run hardware detection - setState is called in async callback which is fine
    detectLowPerformance().then((isLow) => {
      setIsLowPower(isLow)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] Auto-detected ${isLow ? 'low-power' : 'normal'} mode`)
      }
    })
  }, [])

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    function handleChange(e: MediaQueryListEvent) {
      if (e.matches) {
        setIsLowPower(true)
        savePreference(true)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleLowPower = useCallback(() => {
    setIsLowPower(prev => {
      const newValue = !prev
      savePreference(newValue)
      return newValue
    })
  }, [])

  const enableLowPower = useCallback(() => {
    setIsLowPower(true)
    savePreference(true)
  }, [])

  const disableLowPower = useCallback(() => {
    setIsLowPower(false)
    savePreference(false)
  }, [])

  const value = useMemo<PerformanceContextType>(() => ({
    isLowPower,
    toggleLowPower,
    enableLowPower,
    disableLowPower,
    showHeavyAnimations: !isLowPower,
    maxParticles: isLowPower ? LOW_POWER_MAX_PARTICLES : DEFAULT_MAX_PARTICLES,
    targetFps: isLowPower ? LOW_POWER_TARGET_FPS : DEFAULT_TARGET_FPS,
  }), [isLowPower, toggleLowPower, enableLowPower, disableLowPower])

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  )
}

/**
 * Hook for consuming performance context
 *
 * @returns Performance context with isLowPower state and controls
 * @throws Error if used outside of PerformanceProvider
 */
export function usePerformance(): PerformanceContextType {
  const context = useContext(PerformanceContext)
  if (context === undefined) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}

/**
 * Optional hook that returns default values if used outside provider
 * Useful for components that may be rendered before provider is mounted
 */
export function usePerformanceOptional(): PerformanceContextType {
  const context = useContext(PerformanceContext)
  if (context === undefined) {
    // Return safe defaults
    return {
      isLowPower: false,
      toggleLowPower: () => {},
      enableLowPower: () => {},
      disableLowPower: () => {},
      showHeavyAnimations: true,
      maxParticles: DEFAULT_MAX_PARTICLES,
      targetFps: DEFAULT_TARGET_FPS,
    }
  }
  return context
}
