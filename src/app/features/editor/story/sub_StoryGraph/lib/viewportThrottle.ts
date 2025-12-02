/**
 * Viewport throttling utilities for 60fps pan/zoom performance
 *
 * These utilities ensure smooth interaction by:
 * - Throttling viewport change callbacks to 60fps using requestAnimationFrame
 * - Debouncing expensive operations (layout recalculation) until interaction ends
 * - Providing frame-aligned updates for smooth animations
 */

type ThrottledCallback<T extends unknown[]> = (...args: T) => void

interface ThrottleState {
  rafId: number | null
  lastArgs: unknown[] | null
  isPending: boolean
}

/**
 * Creates a throttled callback that executes at most once per animation frame (60fps).
 * Perfect for viewport change handlers that need smooth updates.
 *
 * @example
 * const throttledOnMove = throttleToFrame((viewport) => {
 *   updateVisibleNodes(viewport)
 * })
 * <ReactFlow onMove={throttledOnMove} />
 */
export function throttleToFrame<T extends unknown[]>(
  callback: ThrottledCallback<T>
): ThrottledCallback<T> & { cancel: () => void } {
  const state: ThrottleState = {
    rafId: null,
    lastArgs: null,
    isPending: false,
  }

  const throttled = ((...args: T) => {
    state.lastArgs = args

    if (!state.isPending) {
      state.isPending = true
      state.rafId = requestAnimationFrame(() => {
        state.isPending = false
        if (state.lastArgs) {
          callback(...(state.lastArgs as T))
        }
      })
    }
  }) as ThrottledCallback<T> & { cancel: () => void }

  throttled.cancel = () => {
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
    state.isPending = false
    state.lastArgs = null
  }

  return throttled
}

/**
 * Creates a debounced callback that waits until calls stop for the specified delay.
 * Useful for expensive operations like layout recalculation after pan/zoom ends.
 *
 * @example
 * const debouncedRecalcLayout = debounce((nodes) => {
 *   calculateNodeVisibility(nodes)
 * }, 150)
 */
export function debounce<T extends unknown[]>(
  callback: ThrottledCallback<T>,
  delay: number
): ThrottledCallback<T> & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: T | null = null

  const debounced = ((...args: T) => {
    lastArgs = args

    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      if (lastArgs) {
        callback(...lastArgs)
      }
      timeoutId = null
      lastArgs = null
    }, delay)
  }) as ThrottledCallback<T> & { cancel: () => void; flush: () => void }

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    lastArgs = null
  }

  debounced.flush = () => {
    if (timeoutId !== null && lastArgs) {
      clearTimeout(timeoutId)
      callback(...lastArgs)
      timeoutId = null
      lastArgs = null
    }
  }

  return debounced
}

/**
 * Combines throttle and debounce for optimal pan/zoom handling:
 * - Throttles to 60fps during active interaction
 * - Debounces to ensure final position is captured after interaction ends
 *
 * @example
 * const optimizedOnMove = throttleAndDebounce(
 *   (viewport) => updateVisibility(viewport), // throttled callback
 *   (viewport) => recalculateLayout(viewport), // debounced callback
 *   { debounceDelay: 150 }
 * )
 */
export function throttleAndDebounce<T extends unknown[]>(
  throttledCallback: ThrottledCallback<T>,
  debouncedCallback: ThrottledCallback<T>,
  options: { debounceDelay?: number } = {}
): ThrottledCallback<T> & { cancel: () => void } {
  const { debounceDelay = 150 } = options

  const throttled = throttleToFrame(throttledCallback)
  const debounced = debounce(debouncedCallback, debounceDelay)

  const combined = ((...args: T) => {
    throttled(...args)
    debounced(...args)
  }) as ThrottledCallback<T> & { cancel: () => void }

  combined.cancel = () => {
    throttled.cancel()
    debounced.cancel()
  }

  return combined
}

/**
 * Checks if two viewports are approximately equal (within threshold).
 * Useful for avoiding unnecessary updates for tiny changes.
 */
export function viewportsEqual(
  a: { x: number; y: number; zoom: number } | null,
  b: { x: number; y: number; zoom: number } | null,
  threshold = 0.5
): boolean {
  if (!a || !b) return a === b
  return (
    Math.abs(a.x - b.x) < threshold &&
    Math.abs(a.y - b.y) < threshold &&
    Math.abs(a.zoom - b.zoom) < 0.01
  )
}
