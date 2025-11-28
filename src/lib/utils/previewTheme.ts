/**
 * Preview Theme Extraction
 * 
 * Extracts card preview styling from art styles for visual consistency.
 * Maps art style characteristics to UI theme properties.
 */

import { ART_STYLES, getArtStyleById, getDefaultArtStyle } from '@/app/prompts/artstyles'
import type { PreviewTheme } from '@/lib/types'

/**
 * Art style to theme mappings
 * Each art style maps to specific visual characteristics for the card preview
 */
const ART_STYLE_THEMES: Record<string, Partial<PreviewTheme>> = {
  // Invincible Cartoon - bold, clean, comic-book
  cartoon_invincible: {
    fontFamily: 'sans-serif',
    titleFont: 'sans-serif',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: 3,
    messageBackground: '#fef3c7', // amber-100
    messageTextColor: '#78350f', // amber-900
    messageBorderColor: '#f59e0b', // amber-500
    choiceBackground: '#fef08a', // yellow-200
    choiceTextColor: '#1f2937', // gray-800
    choiceBorderColor: '#eab308', // yellow-500
    choiceHoverBackground: '#fde047', // yellow-300
    accentColor: '#f59e0b', // amber-500
    shadowStyle: 'hard',
    overlayOpacity: 0.4,
  },

  // Arcane - painterly, atmospheric, dark cinematic
  arcane: {
    fontFamily: 'serif',
    titleFont: 'serif',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: 2,
    messageBackground: '#1e1b4b', // indigo-950
    messageTextColor: '#e0e7ff', // indigo-100
    messageBorderColor: '#6366f1', // indigo-500
    choiceBackground: '#312e81', // indigo-900
    choiceTextColor: '#e0e7ff', // indigo-100
    choiceBorderColor: '#818cf8', // indigo-400
    choiceHoverBackground: '#4338ca', // indigo-700
    accentColor: '#f472b6', // pink-400 (neon accent)
    shadowStyle: 'glow',
    overlayOpacity: 0.6,
  },

  // Star Wars Comic - vintage, ink, halftone
  star_wars_comic: {
    fontFamily: 'serif',
    titleFont: 'serif',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: 3,
    messageBackground: '#fefce8', // yellow-50
    messageTextColor: '#1c1917', // stone-900
    messageBorderColor: '#78716c', // stone-500
    choiceBackground: '#fef9c3', // yellow-100
    choiceTextColor: '#1c1917', // stone-900
    choiceBorderColor: '#a8a29e', // stone-400
    choiceHoverBackground: '#fef08a', // yellow-200
    accentColor: '#ca8a04', // yellow-600
    shadowStyle: 'hard',
    overlayOpacity: 0.3,
  },

  // Cyberpunk Comic - neon, gritty, dark
  cyberpunk_comic: {
    fontFamily: 'mono',
    titleFont: 'sans-serif',
    borderRadius: 'none',
    borderStyle: 'solid',
    borderWidth: 2,
    messageBackground: '#0f172a', // slate-900
    messageTextColor: '#22d3ee', // cyan-400
    messageBorderColor: '#06b6d4', // cyan-500
    choiceBackground: '#1e293b', // slate-800
    choiceTextColor: '#f472b6', // pink-400
    choiceBorderColor: '#ec4899', // pink-500
    choiceHoverBackground: '#334155', // slate-700
    accentColor: '#22d3ee', // cyan-400
    shadowStyle: 'glow',
    overlayOpacity: 0.7,
  },

  // Witcher Bestiary - monochrome, parchment, ink
  witcher_book: {
    fontFamily: 'serif',
    titleFont: 'serif',
    borderRadius: 'sm',
    borderStyle: 'double',
    borderWidth: 3,
    messageBackground: '#fef3c7', // amber-100 (parchment)
    messageTextColor: '#1c1917', // stone-900
    messageBorderColor: '#78716c', // stone-500
    choiceBackground: '#f5f5f4', // stone-100
    choiceTextColor: '#1c1917', // stone-900
    choiceBorderColor: '#a8a29e', // stone-400
    choiceHoverBackground: '#e7e5e4', // stone-200
    accentColor: '#78716c', // stone-500
    shadowStyle: 'none',
    overlayOpacity: 0.2,
  },

  // Dispatch Tactical - clean, geometric, minimal
  dispatch: {
    fontFamily: 'sans-serif',
    titleFont: 'sans-serif',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: 2,
    messageBackground: '#f1f5f9', // slate-100
    messageTextColor: '#0f172a', // slate-900
    messageBorderColor: '#64748b', // slate-500
    choiceBackground: '#e2e8f0', // slate-200
    choiceTextColor: '#0f172a', // slate-900
    choiceBorderColor: '#94a3b8', // slate-400
    choiceHoverBackground: '#cbd5e1', // slate-300
    accentColor: '#3b82f6', // blue-500
    shadowStyle: 'soft',
    overlayOpacity: 0.3,
  },

  // Warhammer Grimdark - baroque, gothic, dark
  warhammer_rogue_trader: {
    fontFamily: 'serif',
    titleFont: 'fantasy',
    borderRadius: 'sm',
    borderStyle: 'double',
    borderWidth: 4,
    messageBackground: '#1c1917', // stone-900
    messageTextColor: '#fcd34d', // amber-300
    messageBorderColor: '#b45309', // amber-700
    choiceBackground: '#292524', // stone-800
    choiceTextColor: '#fef3c7', // amber-100
    choiceBorderColor: '#d97706', // amber-600
    choiceHoverBackground: '#44403c', // stone-700
    accentColor: '#b45309', // amber-700
    shadowStyle: 'none',
    overlayOpacity: 0.7,
  },

  // Adventure Journal - pencil, sketch, paper
  adventure_journal: {
    fontFamily: 'serif',
    titleFont: 'serif',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: 2,
    messageBackground: '#fffbeb', // amber-50
    messageTextColor: '#451a03', // amber-950
    messageBorderColor: '#d97706', // amber-600
    choiceBackground: '#fef3c7', // amber-100
    choiceTextColor: '#451a03', // amber-950
    choiceBorderColor: '#b45309', // amber-700
    choiceHoverBackground: '#fde68a', // amber-200
    accentColor: '#b45309', // amber-700
    shadowStyle: 'hard',
    overlayOpacity: 0.25,
  },

  // Expedition Sketch - parchment, vintage, weathered
  expedition_sketch: {
    fontFamily: 'serif',
    titleFont: 'serif',
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: 2,
    messageBackground: '#fefce8', // yellow-50
    messageTextColor: '#713f12', // yellow-900
    messageBorderColor: '#a16207', // yellow-700
    choiceBackground: '#fef9c3', // yellow-100
    choiceTextColor: '#713f12', // yellow-900
    choiceBorderColor: '#ca8a04', // yellow-600
    choiceHoverBackground: '#fef08a', // yellow-200
    accentColor: '#a16207', // yellow-700
    shadowStyle: 'soft',
    overlayOpacity: 0.2,
  },

  // Artisan Illustration - elegant, refined, traditional
  artisan_illustration: {
    fontFamily: 'serif',
    titleFont: 'serif',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: 2,
    messageBackground: '#fafaf9', // stone-50
    messageTextColor: '#1c1917', // stone-900
    messageBorderColor: '#78716c', // stone-500
    choiceBackground: '#f5f5f4', // stone-100
    choiceTextColor: '#1c1917', // stone-900
    choiceBorderColor: '#a8a29e', // stone-400
    choiceHoverBackground: '#e7e5e4', // stone-200
    accentColor: '#57534e', // stone-600
    shadowStyle: 'soft',
    overlayOpacity: 0.3,
  },
}

/**
 * Default vintage theme - used when no art style is selected
 * Matches the app's neobrutalist vintage aesthetic
 */
export const DEFAULT_PREVIEW_THEME: PreviewTheme = {
  fontFamily: 'serif',
  titleFont: 'serif',
  borderRadius: 'md',
  borderStyle: 'solid',
  borderWidth: 3,
  messageBackground: '#fffbeb', // amber-50
  messageTextColor: '#451a03', // amber-950
  messageBorderColor: '#d97706', // amber-600
  choiceBackground: '#fef3c7', // amber-100
  choiceTextColor: '#451a03', // amber-950
  choiceBorderColor: '#b45309', // amber-700
  choiceHoverBackground: '#fde68a', // amber-200
  accentColor: '#b45309', // amber-700
  shadowStyle: 'hard',
  overlayOpacity: 0.25,
}

/**
 * Extract a preview theme from an art style ID
 */
export function extractPreviewTheme(artStyleId: string | null): PreviewTheme {
  if (!artStyleId) {
    return DEFAULT_PREVIEW_THEME
  }

  const styleTheme = ART_STYLE_THEMES[artStyleId]
  if (!styleTheme) {
    return DEFAULT_PREVIEW_THEME
  }

  return {
    ...DEFAULT_PREVIEW_THEME,
    ...styleTheme,
  }
}

/**
 * Get all available art style IDs with their theme previews
 */
export function getArtStyleThemePreviews(): Array<{
  id: string
  label: string
  theme: PreviewTheme
}> {
  return ART_STYLES.map(style => ({
    id: style.id,
    label: style.label,
    theme: extractPreviewTheme(style.id),
  }))
}

/**
 * Convert theme to CSS custom properties for dynamic styling
 */
export function themeToCSS(theme: PreviewTheme): Record<string, string> {
  return {
    '--preview-font-family': getFontFamilyStack(theme.fontFamily),
    '--preview-title-font': getFontFamilyStack(theme.titleFont),
    '--preview-border-radius': getBorderRadius(theme.borderRadius),
    '--preview-border-style': theme.borderStyle,
    '--preview-border-width': `${theme.borderWidth}px`,
    '--preview-message-bg': theme.messageBackground,
    '--preview-message-text': theme.messageTextColor,
    '--preview-message-border': theme.messageBorderColor,
    '--preview-choice-bg': theme.choiceBackground,
    '--preview-choice-text': theme.choiceTextColor,
    '--preview-choice-border': theme.choiceBorderColor,
    '--preview-choice-hover': theme.choiceHoverBackground,
    '--preview-accent': theme.accentColor,
    '--preview-overlay-opacity': String(theme.overlayOpacity),
  }
}

function getFontFamilyStack(font: PreviewTheme['fontFamily']): string {
  switch (font) {
    case 'serif':
      return 'Georgia, Cambria, "Times New Roman", Times, serif'
    case 'mono':
      return 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace'
    case 'fantasy':
      return 'Copperplate, Papyrus, fantasy'
    case 'sans-serif':
    default:
      return 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif'
  }
}

function getBorderRadius(radius: PreviewTheme['borderRadius']): string {
  switch (radius) {
    case 'none':
      return '0'
    case 'sm':
      return '0.25rem'
    case 'lg':
      return '0.75rem'
    case 'full':
      return '9999px'
    case 'md':
    default:
      return '0.5rem'
  }
}
