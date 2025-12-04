'use client'

import { useTheme } from '@/hooks/useTheme'
import Image from 'next/image'

/**
 * DashboardDecorations - Themed decorative SVG elements
 *
 * Displays decorative SVGs from public/decorative folder.
 * - Light theme: SVGs rendered with black/dark styling via CSS filter
 * - Halloween theme: SVGs rendered in their original colors
 *
 * The decorations are positioned as fixed background elements
 * with low opacity to not interfere with content readability.
 */
export function DashboardDecorations() {
  const { theme } = useTheme()

  // CSS filter to make SVGs appear black/dark in light theme
  // In Halloween theme, we use the original purple/dark colors
  const imageFilter = theme === 'light'
    ? 'grayscale(100%) brightness(0.2) opacity(0.08)'
    : 'opacity(0.15)'

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
      data-testid="dashboard-decorations"
    >
      {/* Pumpkin - bottom left */}
      <div
        className="absolute -bottom-16 -left-16 w-64 h-64 transition-all duration-500"
        style={{ filter: imageFilter }}
      >
        <Image
          src="/decorative/pumpkin.svg"
          alt=""
          fill
          className="object-contain"
          priority={false}
        />
      </div>

      {/* Skull - bottom right */}
      <div
        className="absolute -bottom-12 -right-12 w-56 h-56 transition-all duration-500"
        style={{ filter: imageFilter }}
      >
        <Image
          src="/decorative/skull.svg"
          alt=""
          fill
          className="object-contain"
          priority={false}
        />
      </div>

      {/* Halloween scene - top right corner, partially visible */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 transition-all duration-500 rotate-12"
        style={{ filter: imageFilter }}
      >
        <Image
          src="/decorative/halloween.svg"
          alt=""
          fill
          className="object-contain"
          priority={false}
        />
      </div>
    </div>
  )
}
