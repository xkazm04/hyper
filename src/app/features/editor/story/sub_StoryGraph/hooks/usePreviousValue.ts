import { useRef, useEffect } from 'react'

/**
 * Hook to track the previous value of a variable
 * Returns undefined on the first render, then returns the previous value
 *
 * @param value The current value to track
 * @returns The previous value (undefined on first render)
 */
export function usePreviousValue<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}
