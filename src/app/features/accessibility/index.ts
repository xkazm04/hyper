// High Contrast Accessibility Feature
// Provides WCAG AA compliant color mapping for improved accessibility

// Context and Provider
export {
  HighContrastProvider,
  useHighContrastContext,
  type HighContrastMode
} from './HighContrastContext'

export { HighContrastWrapper } from './HighContrastWrapper'

// Components
export { HighContrastPreview } from './components/HighContrastPreview'
export { HighContrastToggle, HighContrastButton } from './components/HighContrastToggle'
export { AccessibilityToolbar, HighContrastModeSelector } from './components/AccessibilityToolbar'
export { CardContrastPreview, CardContrastIndicator } from './components/CardContrastPreview'

// Hooks
export { useHighContrast } from './lib/use-high-contrast'
export {
  useCardContrast,
  useCardContrastRef,
  useCardContrastObserver
} from './lib/use-card-contrast'

// Utilities
export {
  ColorTokenResolver,
  createResolver,
  getHighContrastVariables,
  type CardColorMapping
} from './lib/color-token-resolver'

export {
  colorTokens,
  semanticTokens,
  cardTokens,
  getAllTokens,
  meetsWCAGAA,
  calculateContrastRatio,
  parseHSL,
  analyzeCardContrast,
  findAccessibleVariant,
  type ColorToken,
  type ContrastInfo
} from './lib/high-contrast-palette'
