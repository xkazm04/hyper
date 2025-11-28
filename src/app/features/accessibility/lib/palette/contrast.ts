/**
 * Contrast Calculation Utilities
 *
 * Functions for calculating and analyzing color contrast ratios
 * according to WCAG guidelines.
 */

import { colorTokens, cardTokens, ColorToken } from './colors'

/**
 * Get contrast ratio information for a token pair
 */
export interface ContrastInfo {
  tokenName: string
  foreground: string
  background: string
  ratio: number
  meetsAA: boolean
  meetsAAA: boolean
  isLargeText: boolean
}

/**
 * Parse HSL string to components
 * @param hsl - HSL string in format "H S% L%" or "H S L"
 */
export function parseHSL(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.trim().split(/\s+/)
  return {
    h: parseFloat(parts[0]),
    s: parseFloat(parts[1].replace('%', '')),
    l: parseFloat(parts[2].replace('%', ''))
  }
}

/**
 * Calculate relative luminance from HSL
 * Used for WCAG contrast calculations
 */
export function hslToRelativeLuminance(h: number, s: number, l: number): number {
  // Convert HSL to RGB
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0

  if (h < 60) { r = c; g = x; b = 0 }
  else if (h < 120) { r = x; g = c; b = 0 }
  else if (h < 180) { r = 0; g = c; b = x }
  else if (h < 240) { r = 0; g = x; b = c }
  else if (h < 300) { r = x; g = 0; b = c }
  else { r = c; g = 0; b = x }

  r += m
  g += m
  b += m

  // Calculate relative luminance
  const toLinear = (c: number) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function calculateContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Analyze contrast for all card-related token pairs
 * Returns detailed contrast information for each foreground/background combination
 */
export function analyzeCardContrast(
  isDarkTheme: boolean,
  isHighContrast: boolean
): ContrastInfo[] {
  const results: ContrastInfo[] = []
  const tokens = [...colorTokens, ...cardTokens]

  // Define foreground/background pairs to check
  const pairs: { fg: string; bg: string; isLargeText: boolean }[] = [
    { fg: 'foreground', bg: 'background', isLargeText: false },
    { fg: 'card-foreground', bg: 'card', isLargeText: false },
    { fg: 'card-title', bg: 'card', isLargeText: true },
    { fg: 'card-content', bg: 'card', isLargeText: false },
    { fg: 'card-choice-text', bg: 'card-choice-bg', isLargeText: true },
    { fg: 'muted-foreground', bg: 'muted', isLargeText: false },
    { fg: 'primary-foreground', bg: 'primary', isLargeText: true },
    { fg: 'card-published-text', bg: 'card-published-bg', isLargeText: false },
    { fg: 'card-end-badge-text', bg: 'card-end-badge-bg', isLargeText: false },
    { fg: 'card-overlay-text', bg: 'card-overlay', isLargeText: true }
  ]

  for (const pair of pairs) {
    const fgToken = tokens.find(t => t.name === pair.fg)
    const bgToken = tokens.find(t => t.name === pair.bg)

    if (!fgToken || !bgToken) continue

    const fg = isHighContrast
      ? (isDarkTheme ? fgToken.darkHighContrast : fgToken.lightHighContrast)
      : (isDarkTheme ? fgToken.darkValue : fgToken.lightValue)

    const bg = isHighContrast
      ? (isDarkTheme ? bgToken.darkHighContrast : bgToken.lightHighContrast)
      : (isDarkTheme ? bgToken.darkValue : bgToken.lightValue)

    const fgHsl = parseHSL(fg)
    const bgHsl = parseHSL(bg)

    const fgLum = hslToRelativeLuminance(fgHsl.h, fgHsl.s, fgHsl.l)
    const bgLum = hslToRelativeLuminance(bgHsl.h, bgHsl.s, bgHsl.l)

    const ratio = calculateContrastRatio(fgLum, bgLum)

    results.push({
      tokenName: `${pair.fg}/${pair.bg}`,
      foreground: fg,
      background: bg,
      ratio,
      meetsAA: pair.isLargeText ? ratio >= 3 : ratio >= 4.5,
      meetsAAA: pair.isLargeText ? ratio >= 4.5 : ratio >= 7,
      isLargeText: pair.isLargeText
    })
  }

  return results
}
