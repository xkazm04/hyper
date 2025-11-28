/**
 * Mood Transitions - Color blending and transitions
 */

import { MoodColors, defaultMoodColors } from './types'
import { extractColorsFromImage } from './analyzer'
import { analyzeTitleSentiment } from './themes'

/**
 * Gets mood colors from image or falls back to title sentiment
 * @param imageUrl - Optional image URL to extract colors from
 * @param title - Story title for sentiment analysis fallback
 * @returns Promise resolving to MoodColors
 */
export async function getMoodColors(
  imageUrl: string | null | undefined,
  title: string
): Promise<MoodColors> {
  // Try to extract from image first
  if (imageUrl) {
    const imageColors = await extractColorsFromImage(imageUrl)
    if (imageColors) {
      return imageColors
    }
  }

  // Fall back to title sentiment analysis
  if (title && title.trim()) {
    return analyzeTitleSentiment(title)
  }

  // Return defaults if nothing else works
  return defaultMoodColors
}

/**
 * Blends two HSL colors
 * @param color1 - First HSL color string
 * @param color2 - Second HSL color string
 * @param ratio - Blend ratio (0 = all color1, 1 = all color2)
 * @returns Blended HSL string
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  const parts1 = color1.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  const parts2 = color2.match(/(\d+)\s+(\d+)%\s+(\d+)%/)

  if (!parts1 || !parts2) return color1

  const h1 = parseInt(parts1[1])
  const s1 = parseInt(parts1[2])
  const l1 = parseInt(parts1[3])

  const h2 = parseInt(parts2[1])
  const s2 = parseInt(parts2[2])
  const l2 = parseInt(parts2[3])

  // Handle hue wrapping (e.g., blending 350 and 10)
  let hDiff = h2 - h1
  if (hDiff > 180) hDiff -= 360
  if (hDiff < -180) hDiff += 360

  const h = Math.round((h1 + hDiff * ratio + 360) % 360)
  const s = Math.round(s1 + (s2 - s1) * ratio)
  const l = Math.round(l1 + (l2 - l1) * ratio)

  return `${h} ${s}% ${l}%`
}
