'use client'

/**
 * CommandRippleOverlay Component
 *
 * Renders the ripple animation overlay when a command is executed.
 * The ripple expands from the origin point (command item) and fades out.
 */

import { useCommandRipple } from '../lib/CommandRippleContext'

export function CommandRippleOverlay() {
  const { rippleState } = useCommandRipple()

  if (!rippleState.isActive) {
    return null
  }

  // Calculate ripple size based on viewport
  const maxDimension = Math.max(window.innerWidth, window.innerHeight)
  const rippleSize = maxDimension * 0.4 // 40% of max dimension for subtle effect

  return (
    <div
      className="command-ripple-container"
      aria-hidden="true"
      data-testid="command-ripple-overlay"
    >
      <div
        className="command-ripple"
        style={{
          left: rippleState.originX,
          top: rippleState.originY,
          width: rippleSize,
          height: rippleSize,
        }}
        data-testid="command-ripple"
      />
    </div>
  )
}
