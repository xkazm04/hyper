'use client'

import React, { useCallback } from 'react'

interface SkipLinkProps {
  /**
   * The target element ID to skip to (without the # symbol)
   */
  targetId?: string
  /**
   * Label for the skip link
   */
  label?: string
  /**
   * Optional test ID for automated testing
   */
  'data-testid'?: string
}

/**
 * SkipLink - Accessibility component for keyboard users to skip navigation
 *
 * This component provides a way for keyboard users to bypass navigation
 * and jump directly to the main content. It remains hidden until focused,
 * following WCAG 2.1 Success Criteria 2.4.1 (Bypass Blocks).
 *
 * @example
 * ```tsx
 * // In your layout.tsx
 * <SkipLink targetId="main-content" />
 * <nav>...</nav>
 * <main id="main-content">...</main>
 * ```
 */
export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content',
  'data-testid': testId = 'skip-link'
}: SkipLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const target = document.getElementById(targetId)

    if (target) {
      // Set tabindex to make the element focusable if it isn't already
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1')
      }

      // Focus the target element
      target.focus()

      // Scroll into view smoothly
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [targetId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLAnchorElement>) => {
    // Activate on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const target = document.getElementById(targetId)

      if (target) {
        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1')
        }
        target.focus()
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [targetId])

  return (
    <a
      href={`#${targetId}`}
      className="skip-link"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid={testId}
    >
      {label}
    </a>
  )
}

export default SkipLink
