/**
 * Mood Analyzer - Color extraction from images
 */

import { MoodColors } from './types'

/**
 * Converts RGB to HSL format string
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns HSL string "H S% L%"
 */
export function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Adjusts lightness of an HSL color
 * @param hsl - HSL string "H S% L%"
 * @param adjustment - Amount to adjust lightness (-100 to 100)
 * @returns Adjusted HSL string
 */
export function adjustLightness(hsl: string, adjustment: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!parts) return hsl

  const h = parseInt(parts[1])
  const s = parseInt(parts[2])
  const l = Math.max(0, Math.min(100, parseInt(parts[3]) + adjustment))

  return `${h} ${s}% ${l}%`
}

/**
 * Adjusts saturation of an HSL color
 * @param hsl - HSL string "H S% L%"
 * @param adjustment - Amount to adjust saturation (-100 to 100)
 * @returns Adjusted HSL string
 */
export function adjustSaturation(hsl: string, adjustment: number): string {
  const parts = hsl.match(/(\d+)\s+(\d+)%\s+(\d+)%/)
  if (!parts) return hsl

  const h = parseInt(parts[1])
  const s = Math.max(0, Math.min(100, parseInt(parts[2]) + adjustment))
  const l = parseInt(parts[3])

  return `${h} ${s}% ${l}%`
}

/**
 * Extracts dominant color from an image using Canvas API
 * @param imageUrl - URL of the image to analyze
 * @returns Promise resolving to MoodColors or null if extraction fails
 */
export async function extractColorsFromImage(imageUrl: string): Promise<MoodColors | null> {
  if (typeof window === 'undefined') return null

  try {
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(null)
            return
          }

          // Use small size for performance
          const sampleSize = 50
          canvas.width = sampleSize
          canvas.height = sampleSize
          ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

          const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
          const pixels = imageData.data

          // Collect color samples
          const colorCounts: Map<string, { r: number; g: number; b: number; count: number }> = new Map()

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]
            const a = pixels[i + 3]

            // Skip transparent pixels
            if (a < 128) continue

            // Quantize colors for grouping (reduce to 32 levels per channel)
            const qr = Math.floor(r / 8) * 8
            const qg = Math.floor(g / 8) * 8
            const qb = Math.floor(b / 8) * 8
            const key = `${qr},${qg},${qb}`

            const existing = colorCounts.get(key)
            if (existing) {
              existing.count++
              existing.r = (existing.r + r) / 2
              existing.g = (existing.g + g) / 2
              existing.b = (existing.b + b) / 2
            } else {
              colorCounts.set(key, { r, g, b, count: 1 })
            }
          }

          // Find dominant colors
          const sortedColors = Array.from(colorCounts.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

          if (sortedColors.length === 0) {
            resolve(null)
            return
          }

          // Find most vibrant color (highest saturation)
          let mostVibrant = sortedColors[0]
          let highestSat = 0

          for (const color of sortedColors) {
            const hsl = rgbToHsl(color.r, color.g, color.b)
            const satMatch = hsl.match(/\d+\s+(\d+)%/)
            const sat = satMatch ? parseInt(satMatch[1]) : 0
            if (sat > highestSat) {
              highestSat = sat
              mostVibrant = color
            }
          }

          const primaryHsl = rgbToHsl(mostVibrant.r, mostVibrant.g, mostVibrant.b)

          // Create variations
          const secondaryColor = sortedColors[1] || mostVibrant
          const secondaryHsl = rgbToHsl(secondaryColor.r, secondaryColor.g, secondaryColor.b)
          const mutedHsl = adjustLightness(adjustSaturation(primaryHsl, -30), 40)
          const accentHsl = adjustLightness(primaryHsl, -10)

          resolve({
            primary: primaryHsl,
            secondary: secondaryHsl,
            muted: mutedHsl,
            accent: accentHsl,
          })
        } catch (err) {
          console.warn('[Mood] Canvas extraction error:', err)
          resolve(null)
        }
      }

      img.onerror = () => {
        console.warn('[Mood] Failed to load image:', imageUrl)
        resolve(null)
      }

      // Set timeout for image loading
      setTimeout(() => {
        resolve(null)
      }, 5000)

      img.src = imageUrl
    })
  } catch (error) {
    console.warn('[Mood] Failed to extract colors from image:', error)
    return null
  }
}
