/**
 * Performance monitoring utilities for theme switching
 * 
 * This module provides tools to measure and analyze theme switching performance.
 * Use in development to ensure theme changes meet performance targets.
 */

interface PerformanceMetrics {
  duration: number
  layoutShift: boolean
  timestamp: number
  theme: string
}

const metrics: PerformanceMetrics[] = []
const MAX_METRICS = 50 // Keep last 50 measurements

/**
 * Measures the time taken for a theme switch operation
 * @param themeName - Name of the theme being switched to
 * @param operation - Function to measure
 * @returns Result of the operation
 */
export async function measureThemeSwitch<T>(
  themeName: string,
  operation: () => T | Promise<T>
): Promise<T> {
  const startTime = performance.now()
  const startScrollY = window.scrollY
  
  // Execute the operation
  const result = await operation()
  
  // Wait for next frame to measure layout shift
  await new Promise(resolve => requestAnimationFrame(resolve))
  
  const endTime = performance.now()
  const endScrollY = window.scrollY
  const duration = endTime - startTime
  const layoutShift = Math.abs(endScrollY - startScrollY) > 1
  
  // Record metrics
  const metric: PerformanceMetrics = {
    duration,
    layoutShift,
    timestamp: Date.now(),
    theme: themeName
  }
  
  metrics.push(metric)
  
  // Keep only recent metrics
  if (metrics.length > MAX_METRICS) {
    metrics.shift()
  }
  
  // Log warning if performance target not met
  if (duration > 300) {
    console.warn(
      `[Theme Performance] Theme switch took ${duration.toFixed(2)}ms (target: <300ms)`
    )
  }
  
  if (layoutShift) {
    console.warn('[Theme Performance] Layout shift detected during theme switch')
  }
  
  return result
}

/**
 * Gets performance statistics for theme switches
 * @returns Statistics object with average, min, max, and recent measurements
 */
export function getPerformanceStats() {
  if (metrics.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      layoutShifts: 0,
      recent: []
    }
  }
  
  const durations = metrics.map(m => m.duration)
  const layoutShifts = metrics.filter(m => m.layoutShift).length
  
  return {
    count: metrics.length,
    average: durations.reduce((a, b) => a + b, 0) / durations.length,
    min: Math.min(...durations),
    max: Math.max(...durations),
    layoutShifts,
    recent: metrics.slice(-10).map(m => ({
      theme: m.theme,
      duration: m.duration,
      layoutShift: m.layoutShift
    }))
  }
}

/**
 * Logs performance statistics to console
 */
export function logPerformanceStats() {
  const stats = getPerformanceStats()
  
  if (stats.count === 0) {
    console.log('[Theme Performance] No measurements recorded')
    return
  }
  
  console.group('[Theme Performance] Statistics')
  console.log(`Total switches: ${stats.count}`)
  console.log(`Average duration: ${stats.average.toFixed(2)}ms`)
  console.log(`Min duration: ${stats.min.toFixed(2)}ms`)
  console.log(`Max duration: ${stats.max.toFixed(2)}ms`)
  console.log(`Layout shifts: ${stats.layoutShifts}`)
  console.log('Recent switches:', stats.recent)
  console.groupEnd()
}

/**
 * Clears all recorded metrics
 */
export function clearMetrics() {
  metrics.length = 0
  console.log('[Theme Performance] Metrics cleared')
}

/**
 * Checks if theme switching meets performance targets
 * @returns True if all targets are met
 */
export function meetsPerformanceTargets(): boolean {
  const stats = getPerformanceStats()
  
  if (stats.count === 0) {
    return true // No data, assume passing
  }
  
  const targets = {
    averageDuration: 300, // ms
    maxDuration: 500, // ms
    layoutShifts: 0
  }
  
  const passing = 
    stats.average <= targets.averageDuration &&
    stats.max <= targets.maxDuration &&
    stats.layoutShifts === targets.layoutShifts
  
  if (!passing) {
    console.warn('[Theme Performance] Performance targets not met:')
    if (stats.average > targets.averageDuration) {
      console.warn(`  Average: ${stats.average.toFixed(2)}ms (target: <${targets.averageDuration}ms)`)
    }
    if (stats.max > targets.maxDuration) {
      console.warn(`  Max: ${stats.max.toFixed(2)}ms (target: <${targets.maxDuration}ms)`)
    }
    if (stats.layoutShifts > targets.layoutShifts) {
      console.warn(`  Layout shifts: ${stats.layoutShifts} (target: ${targets.layoutShifts})`)
    }
  }
  
  return passing
}

/**
 * Runs a performance test by switching themes multiple times
 * @param iterations - Number of theme switches to perform
 */
export async function runPerformanceTest(iterations: number = 10) {
  console.log(`[Theme Performance] Running test with ${iterations} iterations...`)
  
  clearMetrics()
  
  const themes = ['light', 'halloween'] as const
  
  for (let i = 0; i < iterations; i++) {
    const theme = themes[i % themes.length]
    
    await measureThemeSwitch(theme, async () => {
      document.documentElement.className = theme
      await new Promise(resolve => setTimeout(resolve, 250))
    })
  }
  
  logPerformanceStats()
  
  const passing = meetsPerformanceTargets()
  console.log(
    `[Theme Performance] Test ${passing ? 'PASSED' : 'FAILED'}`
  )
  
  return passing
}

// Expose to window for manual testing in browser console
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__themePerformance = {
    getStats: getPerformanceStats,
    logStats: logPerformanceStats,
    clearMetrics,
    runTest: runPerformanceTest,
    meetsTargets: meetsPerformanceTargets
  }
  
  console.log(
    '[Theme Performance] Monitoring enabled. Use window.__themePerformance for manual testing.'
  )
}
