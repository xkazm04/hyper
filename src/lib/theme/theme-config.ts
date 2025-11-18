/**
 * Theme name type - union of all available theme names
 * @remarks This type is automatically derived from the themes array
 */
export type ThemeName = 'light' | 'halloween'

/**
 * Theme configuration interface
 * @property {ThemeName} name - Unique identifier for the theme (used as CSS class)
 * @property {string} label - Human-readable display name
 * @property {string} icon - Emoji or icon representing the theme
 * @property {string} description - Brief description of the theme's appearance
 */
export interface ThemeConfig {
  name: ThemeName
  label: string
  icon: string
  description: string
}

/**
 * Array of all available themes
 * 
 * To add a new theme:
 * 1. Add theme configuration here
 * 2. Define CSS variables in globals.css with a class matching the theme name
 * 3. Update the ThemeName type to include the new theme
 * 
 * @example
 * ```typescript
 * {
 *   name: 'dark',
 *   label: 'Dark',
 *   icon: '🌙',
 *   description: 'Dark theme for night owls'
 * }
 * ```
 */
export const themes: ThemeConfig[] = [
  {
    name: 'light',
    label: 'Light',
    icon: '☀️',
    description: 'Clean and bright default theme'
  },
  {
    name: 'halloween',
    label: 'Halloween',
    icon: '🎃',
    description: 'Spooky dark theme with purple accents'
  }
]

/**
 * Default theme applied on first visit
 * @remarks This theme is used when no saved preference exists in localStorage
 */
export const defaultTheme: ThemeName = 'light'
