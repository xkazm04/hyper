/**
 * Accessibility Utilities
 *
 * Functions for WCAG compliance checking and accessible color variant generation.
 */

import {
  parseHSL,
  hslToRelativeLuminance,
  calculateContrastRatio
} from './contrast'

/**
 * Check if a color pair meets WCAG AA contrast requirements
 * @param foreground - Foreground color HSL
 * @param background - Background color HSL
 * @param isLargeText - Whether the text is 18pt+ or 14pt+ bold
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const fg = parseHSL(foreground)
  const bg = parseHSL(background)

  const fgLum = hslToRelativeLuminance(fg.h, fg.s, fg.l)
  const bgLum = hslToRelativeLuminance(bg.h, bg.s, bg.l)

  const ratio = calculateContrastRatio(fgLum, bgLum)

  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if a color pair meets WCAG AAA contrast requirements
 * @param foreground - Foreground color HSL
 * @param background - Background color HSL
 * @param isLargeText - Whether the text is 18pt+ or 14pt+ bold
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const fg = parseHSL(foreground)
  const bg = parseHSL(background)

  const fgLum = hslToRelativeLuminance(fg.h, fg.s, fg.l)
  const bgLum = hslToRelativeLuminance(bg.h, bg.s, bg.l)

  const ratio = calculateContrastRatio(fgLum, bgLum)

  // WCAG AAA requires 7:1 for normal text, 4.5:1 for large text
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Find the nearest accessible color variant for a given color
 * Adjusts lightness to meet minimum contrast requirements
 */
export function findAccessibleVariant(
  foregroundHSL: string,
  backgroundHSL: string,
  targetRatio: number = 4.5
): string {
  const fg = parseHSL(foregroundHSL)
  const bg = parseHSL(backgroundHSL)

  const bgLum = hslToRelativeLuminance(bg.h, bg.s, bg.l)

  // Try adjusting lightness in both directions to find accessible variant
  for (let adjustment = 0; adjustment <= 50; adjustment++) {
    // Try darker
    const darkerL = Math.max(0, fg.l - adjustment)
    const darkerLum = hslToRelativeLuminance(fg.h, fg.s, darkerL)
    if (calculateContrastRatio(darkerLum, bgLum) >= targetRatio) {
      return `${fg.h} ${fg.s}% ${darkerL}%`
    }

    // Try lighter
    const lighterL = Math.min(100, fg.l + adjustment)
    const lighterLum = hslToRelativeLuminance(fg.h, fg.s, lighterL)
    if (calculateContrastRatio(lighterLum, bgLum) >= targetRatio) {
      return `${fg.h} ${fg.s}% ${lighterL}%`
    }
  }

  // Fallback: return pure black or white based on background
  return bgLum > 0.5 ? '0 0% 0%' : '0 0% 100%'
}

/**
 * Get the contrast ratio between two HSL colors
 */
export function getContrastRatio(
  foreground: string,
  background: string
): number {
  const fg = parseHSL(foreground)
  const bg = parseHSL(background)

  const fgLum = hslToRelativeLuminance(fg.h, fg.s, fg.l)
  const bgLum = hslToRelativeLuminance(bg.h, bg.s, bg.l)

  return calculateContrastRatio(fgLum, bgLum)
}

/**
 * Suggest an accessible foreground color for a given background
 * Returns either black or white based on which provides better contrast
 */
export function suggestForegroundColor(backgroundHSL: string): string {
  const bg = parseHSL(backgroundHSL)
  const bgLum = hslToRelativeLuminance(bg.h, bg.s, bg.l)

  // Use black for light backgrounds, white for dark backgrounds
  return bgLum > 0.179 ? '0 0% 0%' : '0 0% 100%'
}
