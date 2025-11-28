'use client'

import {
  ColorToken,
  getAllTokens,
  cardTokens,
  analyzeCardContrast,
  ContrastInfo
} from './high-contrast-palette'

export interface ResolvedColorToken {
  name: string
  originalValue: string
  resolvedValue: string
  isHighContrast: boolean
}

/**
 * Card color mapping result
 */
export interface CardColorMapping {
  tokenName: string
  cssProperty: string
  originalHSL: string
  resolvedHSL: string
  cssValue: string
}

/**
 * Color Token Resolver
 *
 * Automatically maps color tokens to their WCAG AA compliant variants
 * based on the current theme and high contrast preference.
 */
export class ColorTokenResolver {
  private tokens: ColorToken[]
  private isDarkTheme: boolean
  private isHighContrast: boolean

  constructor(isDarkTheme: boolean = false, isHighContrast: boolean = false) {
    this.tokens = getAllTokens()
    this.isDarkTheme = isDarkTheme
    this.isHighContrast = isHighContrast
  }

  /**
   * Resolve a single color token to its appropriate value
   */
  resolveToken(tokenName: string): ResolvedColorToken | null {
    const token = this.tokens.find((t) => t.name === tokenName)
    if (!token) return null

    const originalValue = this.isDarkTheme ? token.darkValue : token.lightValue
    const resolvedValue = this.isHighContrast
      ? this.isDarkTheme
        ? token.darkHighContrast
        : token.lightHighContrast
      : originalValue

    return {
      name: tokenName,
      originalValue,
      resolvedValue,
      isHighContrast: this.isHighContrast
    }
  }

  /**
   * Resolve all tokens and return as CSS custom property map
   */
  resolveAllTokens(): Map<string, string> {
    const result = new Map<string, string>()

    for (const token of this.tokens) {
      const resolved = this.resolveToken(token.name)
      if (resolved) {
        result.set(`--${token.name}`, resolved.resolvedValue)
      }
    }

    return result
  }

  /**
   * Resolve only card-specific tokens
   */
  resolveCardTokens(): CardColorMapping[] {
    const result: CardColorMapping[] = []

    for (const token of cardTokens) {
      const resolved = this.resolveToken(token.name)
      if (resolved) {
        result.push({
          tokenName: token.name,
          cssProperty: `--${token.name}`,
          originalHSL: resolved.originalValue,
          resolvedHSL: resolved.resolvedValue,
          cssValue: `hsl(${resolved.resolvedValue})`
        })
      }
    }

    return result
  }

  /**
   * Get card contrast analysis
   */
  getCardContrastAnalysis(): ContrastInfo[] {
    return analyzeCardContrast(this.isDarkTheme, this.isHighContrast)
  }

  /**
   * Check if all card tokens meet WCAG AA requirements
   */
  allCardTokensMeetWCAGAA(): boolean {
    const analysis = this.getCardContrastAnalysis()
    return analysis.every(info => info.meetsAA)
  }

  /**
   * Get tokens that don't meet WCAG AA requirements
   */
  getFailingTokens(): ContrastInfo[] {
    const analysis = this.getCardContrastAnalysis()
    return analysis.filter(info => !info.meetsAA)
  }

  /**
   * Generate CSS string with resolved token values
   */
  generateCSS(): string {
    const tokens = this.resolveAllTokens()
    const lines: string[] = []

    tokens.forEach((value, key) => {
      lines.push(`  ${key}: ${value};`)
    })

    return lines.join('\n')
  }

  /**
   * Generate CSS only for card tokens
   */
  generateCardCSS(): string {
    const cardMappings = this.resolveCardTokens()
    const lines: string[] = []

    for (const mapping of cardMappings) {
      lines.push(`  ${mapping.cssProperty}: ${mapping.resolvedHSL};`)
    }

    return lines.join('\n')
  }

  /**
   * Apply resolved tokens to an element's style
   */
  applyToElement(element: HTMLElement): void {
    const tokens = this.resolveAllTokens()

    tokens.forEach((value, key) => {
      element.style.setProperty(key, value)
    })
  }

  /**
   * Apply only card tokens to an element
   */
  applyCardTokensToElement(element: HTMLElement): void {
    const cardMappings = this.resolveCardTokens()

    for (const mapping of cardMappings) {
      element.style.setProperty(mapping.cssProperty, mapping.resolvedHSL)
    }
  }

  /**
   * Remove applied tokens from an element
   */
  removeFromElement(element: HTMLElement): void {
    for (const token of this.tokens) {
      element.style.removeProperty(`--${token.name}`)
    }
  }

  /**
   * Remove only card tokens from an element
   */
  removeCardTokensFromElement(element: HTMLElement): void {
    for (const token of cardTokens) {
      element.style.removeProperty(`--${token.name}`)
    }
  }

  /**
   * Update the resolver state
   */
  update(isDarkTheme: boolean, isHighContrast: boolean): void {
    this.isDarkTheme = isDarkTheme
    this.isHighContrast = isHighContrast
  }

  /**
   * Get current state
   */
  getState(): { isDarkTheme: boolean; isHighContrast: boolean } {
    return {
      isDarkTheme: this.isDarkTheme,
      isHighContrast: this.isHighContrast
    }
  }
}

/**
 * Create a resolver instance with current settings
 */
export function createResolver(
  isDarkTheme: boolean,
  isHighContrast: boolean
): ColorTokenResolver {
  return new ColorTokenResolver(isDarkTheme, isHighContrast)
}

/**
 * Get high contrast CSS variables for a theme
 */
export function getHighContrastVariables(isDarkTheme: boolean): string {
  const resolver = new ColorTokenResolver(isDarkTheme, true)
  return resolver.generateCSS()
}
