/**
 * Mood Detection Types
 */

/**
 * Extracted mood colors in HSL format (without hsl() wrapper)
 * Format: "H S% L%"
 */
export interface MoodColors {
  primary: string       // Main accent color
  secondary: string     // Supporting color
  muted: string         // Subtle background variation
  accent: string        // Highlight color
}

/**
 * Default mood colors - neutral warm tones
 */
export const defaultMoodColors: MoodColors = {
  primary: '210 70% 50%',      // Blue
  secondary: '210 50% 60%',    // Light blue
  muted: '210 20% 92%',        // Very light blue-gray
  accent: '210 80% 55%',       // Bright blue
}
