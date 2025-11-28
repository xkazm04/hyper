/**
 * High-Contrast Color Palette
 *
 * Re-exports all color palette functionality from modular sub-files.
 * This file maintains backward compatibility with existing imports.
 */

// Re-export all color tokens and types
export {
  colorTokens,
  semanticTokens,
  cardTokens,
  getAllTokens,
  type ColorToken
} from './palette/colors'

// Re-export contrast calculation utilities
export {
  parseHSL,
  hslToRelativeLuminance,
  calculateContrastRatio,
  analyzeCardContrast,
  type ContrastInfo
} from './palette/contrast'

// Re-export accessibility utilities
export {
  meetsWCAGAA,
  findAccessibleVariant
} from './palette/accessibility'
