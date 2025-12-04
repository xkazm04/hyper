'use client'

/**
 * Theme Context - Backward Compatibility Layer
 *
 * This file re-exports the theme hook from the new location for backward compatibility.
 * The actual implementation now uses next-themes under the hood.
 *
 * @deprecated Import useTheme from '@/hooks/useTheme' for new code.
 */

// Re-export the compatibility hook
export { useTheme } from '@/hooks/useTheme'
export type { ThemeContextType } from '@/hooks/useTheme'

// Re-export theme config for convenience
export { themes, defaultTheme } from '@/lib/theme/theme-config'
export type { ThemeName, ThemeConfig } from '@/lib/theme/theme-config'

/**
 * @deprecated ThemeProvider is now provided by next-themes in layout.tsx.
 * This export is kept for import compatibility only - it's a no-op wrapper.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return children
}
