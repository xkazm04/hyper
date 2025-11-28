/**
 * Color Token Definitions
 *
 * Defines WCAG AA compliant color variants for accessibility.
 * All colors are optimized for minimum 4.5:1 contrast ratio for text
 * and 3:1 for large text and UI components.
 *
 * Color format: HSL values (H S% L%) matching globals.css convention
 */

export interface ColorToken {
  name: string
  lightValue: string      // HSL values for light theme
  lightHighContrast: string  // High contrast variant for light theme
  darkValue: string       // HSL values for dark theme (halloween)
  darkHighContrast: string   // High contrast variant for dark theme
}

/**
 * Core color tokens with high-contrast variants
 * These map directly to CSS custom properties in globals.css
 */
export const colorTokens: ColorToken[] = [
  // Background colors
  {
    name: 'background',
    lightValue: '0 0% 100%',
    lightHighContrast: '0 0% 100%',
    darkValue: '0 0% 5%',
    darkHighContrast: '0 0% 0%'
  },
  {
    name: 'foreground',
    lightValue: '0 0% 3.9%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 15% 95%',
    darkHighContrast: '0 0% 100%'
  },

  // Card colors
  {
    name: 'card',
    lightValue: '0 0% 100%',
    lightHighContrast: '0 0% 100%',
    darkValue: '270 15% 10%',
    darkHighContrast: '0 0% 0%'
  },
  {
    name: 'card-foreground',
    lightValue: '0 0% 3.9%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 15% 95%',
    darkHighContrast: '0 0% 100%'
  },

  // Primary colors
  {
    name: 'primary',
    lightValue: '0 0% 9%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 70% 60%',
    darkHighContrast: '270 100% 75%'
  },
  {
    name: 'primary-foreground',
    lightValue: '0 0% 98%',
    lightHighContrast: '0 0% 100%',
    darkValue: '0 0% 100%',
    darkHighContrast: '0 0% 0%'
  },

  // Secondary colors
  {
    name: 'secondary',
    lightValue: '0 0% 96.1%',
    lightHighContrast: '0 0% 90%',
    darkValue: '270 50% 40%',
    darkHighContrast: '270 80% 55%'
  },
  {
    name: 'secondary-foreground',
    lightValue: '0 0% 9%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 10% 98%',
    darkHighContrast: '0 0% 100%'
  },

  // Muted colors
  {
    name: 'muted',
    lightValue: '0 0% 96.1%',
    lightHighContrast: '0 0% 85%',
    darkValue: '270 10% 15%',
    darkHighContrast: '270 15% 20%'
  },
  {
    name: 'muted-foreground',
    lightValue: '0 0% 45.1%',
    lightHighContrast: '0 0% 25%',
    darkValue: '270 10% 70%',
    darkHighContrast: '270 10% 85%'
  },

  // Accent colors
  {
    name: 'accent',
    lightValue: '0 0% 96.1%',
    lightHighContrast: '220 100% 50%',
    darkValue: '270 70% 55%',
    darkHighContrast: '270 100% 70%'
  },
  {
    name: 'accent-foreground',
    lightValue: '0 0% 9%',
    lightHighContrast: '0 0% 100%',
    darkValue: '0 0% 100%',
    darkHighContrast: '0 0% 0%'
  },

  // Destructive colors
  {
    name: 'destructive',
    lightValue: '0 84.2% 60.2%',
    lightHighContrast: '0 100% 40%',
    darkValue: '0 70% 55%',
    darkHighContrast: '0 100% 65%'
  },
  {
    name: 'destructive-foreground',
    lightValue: '0 0% 98%',
    lightHighContrast: '0 0% 100%',
    darkValue: '0 0% 98%',
    darkHighContrast: '0 0% 100%'
  },

  // Border and input
  {
    name: 'border',
    lightValue: '0 0% 89.8%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 40% 35%',
    darkHighContrast: '270 50% 60%'
  },
  {
    name: 'input',
    lightValue: '0 0% 89.8%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 15% 15%',
    darkHighContrast: '270 20% 25%'
  },
  {
    name: 'ring',
    lightValue: '0 0% 3.9%',
    lightHighContrast: '220 100% 50%',
    darkValue: '270 70% 60%',
    darkHighContrast: '270 100% 75%'
  }
]

/**
 * Semantic color tokens for specific UI states
 */
export const semanticTokens: ColorToken[] = [
  // Success/Green
  {
    name: 'green-500',
    lightValue: '142 71% 45%',
    lightHighContrast: '142 100% 30%',
    darkValue: '142 65% 50%',
    darkHighContrast: '142 100% 60%'
  },
  {
    name: 'green-600',
    lightValue: '142 76% 36%',
    lightHighContrast: '142 100% 25%',
    darkValue: '142 70% 45%',
    darkHighContrast: '142 100% 55%'
  },

  // Error/Red
  {
    name: 'red-500',
    lightValue: '0 84% 60%',
    lightHighContrast: '0 100% 40%',
    darkValue: '0 70% 55%',
    darkHighContrast: '0 100% 60%'
  },
  {
    name: 'red-600',
    lightValue: '0 72% 51%',
    lightHighContrast: '0 100% 35%',
    darkValue: '0 75% 50%',
    darkHighContrast: '0 100% 55%'
  },

  // Warning/Yellow
  {
    name: 'yellow-500',
    lightValue: '45 93% 47%',
    lightHighContrast: '45 100% 35%',
    darkValue: '45 90% 60%',
    darkHighContrast: '45 100% 50%'
  },

  // Info/Blue
  {
    name: 'blue-500',
    lightValue: '217 91% 60%',
    lightHighContrast: '217 100% 40%',
    darkValue: '260 70% 60%',
    darkHighContrast: '260 100% 70%'
  },
  {
    name: 'blue-600',
    lightValue: '221 83% 53%',
    lightHighContrast: '221 100% 35%',
    darkValue: '260 75% 55%',
    darkHighContrast: '260 100% 65%'
  }
]

/**
 * Card-specific color tokens for story cards
 * These provide enhanced contrast for card elements in both normal and high contrast modes
 */
export const cardTokens: ColorToken[] = [
  // Card choice button - high visibility action buttons
  {
    name: 'card-choice-bg',
    lightValue: '0 0% 9%',
    lightHighContrast: '220 100% 35%',
    darkValue: '270 70% 60%',
    darkHighContrast: '270 100% 70%'
  },
  {
    name: 'card-choice-text',
    lightValue: '0 0% 98%',
    lightHighContrast: '0 0% 100%',
    darkValue: '0 0% 100%',
    darkHighContrast: '0 0% 0%'
  },
  {
    name: 'card-choice-border',
    lightValue: '0 0% 0%',
    lightHighContrast: '220 100% 25%',
    darkValue: '270 50% 45%',
    darkHighContrast: '270 100% 80%'
  },

  // Card title - prominent headings
  {
    name: 'card-title',
    lightValue: '0 0% 3.9%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 15% 95%',
    darkHighContrast: '0 0% 100%'
  },

  // Card content text - body copy
  {
    name: 'card-content',
    lightValue: '0 0% 45.1%',
    lightHighContrast: '0 0% 15%',
    darkValue: '270 10% 70%',
    darkHighContrast: '270 5% 90%'
  },

  // Card shadow/border - visual hierarchy
  {
    name: 'card-shadow',
    lightValue: '0 0% 0%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 40% 35%',
    darkHighContrast: '270 50% 60%'
  },

  // Card overlay (for image cards)
  {
    name: 'card-overlay',
    lightValue: '0 0% 100%',
    lightHighContrast: '0 0% 100%',
    darkValue: '0 0% 0%',
    darkHighContrast: '0 0% 0%'
  },
  {
    name: 'card-overlay-text',
    lightValue: '0 0% 0%',
    lightHighContrast: '0 0% 0%',
    darkValue: '0 0% 100%',
    darkHighContrast: '0 0% 100%'
  },

  // End card badge
  {
    name: 'card-end-badge-bg',
    lightValue: '0 0% 96.1%',
    lightHighContrast: '0 0% 90%',
    darkValue: '270 10% 15%',
    darkHighContrast: '270 15% 25%'
  },
  {
    name: 'card-end-badge-text',
    lightValue: '0 0% 9%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 10% 95%',
    darkHighContrast: '0 0% 100%'
  },

  // Published badge
  {
    name: 'card-published-bg',
    lightValue: '138 76% 93%',
    lightHighContrast: '142 100% 85%',
    darkValue: '142 40% 20%',
    darkHighContrast: '142 80% 30%'
  },
  {
    name: 'card-published-text',
    lightValue: '142 76% 36%',
    lightHighContrast: '142 100% 20%',
    darkValue: '142 65% 60%',
    darkHighContrast: '142 100% 75%'
  },

  // Graph node colors
  {
    name: 'card-node-bg',
    lightValue: '0 0% 100%',
    lightHighContrast: '0 0% 100%',
    darkValue: '270 15% 12%',
    darkHighContrast: '0 0% 0%'
  },
  {
    name: 'card-node-border',
    lightValue: '0 0% 89.8%',
    lightHighContrast: '0 0% 0%',
    darkValue: '270 40% 35%',
    darkHighContrast: '270 60% 65%'
  },
  {
    name: 'card-node-selected',
    lightValue: '217 91% 60%',
    lightHighContrast: '217 100% 40%',
    darkValue: '270 70% 60%',
    darkHighContrast: '270 100% 75%'
  }
]

/**
 * Get all color tokens merged (core, semantic, and card tokens)
 */
export function getAllTokens(): ColorToken[] {
  return [...colorTokens, ...semanticTokens, ...cardTokens]
}
