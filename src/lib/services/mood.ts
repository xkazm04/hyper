/**
 * Mood Detection Service
 *
 * Analyzes story content to extract mood-based color palettes:
 * - Extracts dominant colors from card images using Canvas API
 * - Analyzes story title sentiment for color associations
 * - Converts colors to HSL format for CSS variable compatibility
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

/**
 * Converts RGB to HSL format string
 * @param r - Red (0-255)
 * @param g - Green (0-255)
 * @param b - Blue (0-255)
 * @returns HSL string "H S% L%"
 */
function rgbToHsl(r: number, g: number, b: number): string {
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
function adjustLightness(hsl: string, adjustment: number): string {
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
function adjustSaturation(hsl: string, adjustment: number): string {
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

/**
 * Mood keywords mapped to HSL hue values
 */
const moodHueMap: Record<string, number> = {
  // Warm / Energetic
  adventure: 25,
  action: 15,
  exciting: 20,
  fire: 10,
  battle: 0,
  war: 5,
  anger: 0,
  passion: 350,
  love: 340,
  romance: 330,

  // Cool / Calm
  ocean: 200,
  sea: 195,
  water: 200,
  calm: 190,
  peace: 180,
  serene: 185,
  ice: 195,
  winter: 200,
  snow: 200,

  // Nature / Growth
  forest: 120,
  nature: 110,
  growth: 100,
  life: 115,
  spring: 90,
  garden: 100,
  tree: 110,
  plant: 105,

  // Mystery / Magic
  mystery: 270,
  magic: 280,
  mystic: 275,
  dark: 260,
  night: 250,
  shadow: 265,
  dream: 270,
  fantasy: 285,
  enchanted: 280,

  // Sunny / Happy
  happy: 50,
  joy: 45,
  sun: 45,
  sunny: 48,
  bright: 50,
  light: 55,
  gold: 45,
  treasure: 40,

  // Earth / Grounded
  earth: 30,
  desert: 35,
  sand: 38,
  autumn: 25,
  fall: 28,
  harvest: 30,

  // Sky / Space
  sky: 210,
  space: 240,
  star: 45,
  cosmic: 260,
  galaxy: 270,
  moon: 220,

  // Spooky / Halloween
  spooky: 280,
  halloween: 275,
  scary: 0,
  horror: 5,
  ghost: 240,

  // Default neutral
  story: 210,
  tale: 210,
  journey: 200,
}

/**
 * Analyzes title sentiment to generate mood colors
 * @param title - Story title to analyze
 * @returns MoodColors based on sentiment analysis
 */
export function analyzeTitleSentiment(title: string): MoodColors {
  const lowerTitle = title.toLowerCase()

  // Find matching mood keyword
  let dominantHue = 210 // Default blue
  let saturation = 60
  let lightness = 50

  for (const [keyword, hue] of Object.entries(moodHueMap)) {
    if (lowerTitle.includes(keyword)) {
      dominantHue = hue
      break
    }
  }

  // Adjust saturation based on intensity words
  if (lowerTitle.includes('dark') || lowerTitle.includes('deep')) {
    saturation = 40
    lightness = 35
  } else if (lowerTitle.includes('bright') || lowerTitle.includes('vivid')) {
    saturation = 80
    lightness = 55
  } else if (lowerTitle.includes('mystic') || lowerTitle.includes('ancient')) {
    saturation = 50
    lightness = 40
  }

  const primaryHsl = `${dominantHue} ${saturation}% ${lightness}%`

  return {
    primary: primaryHsl,
    secondary: `${dominantHue} ${saturation - 10}% ${lightness + 10}%`,
    muted: `${dominantHue} ${Math.max(10, saturation - 40)}% ${Math.min(92, lightness + 35)}%`,
    accent: `${(dominantHue + 30) % 360} ${saturation + 10}% ${lightness}%`,
  }
}

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
