'use client'

import { useRef, useState, useEffect } from 'react'

// ============================================================================
// Mouse Parallax Hook - Creates depth effect on hover
// ============================================================================

export function useParallax(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = (e.clientX - centerX) / rect.width * 10
      const y = (e.clientY - centerY) / rect.height * 10
      setTransform({ x, y })
    }

    const handleMouseLeave = () => {
      setTransform({ x: 0, y: 0 })
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enabled])

  return { ref, transform }
}
