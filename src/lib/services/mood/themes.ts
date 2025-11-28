/**
 * Mood Themes - Keyword to color mappings
 */

import { MoodColors } from './types'

/**
 * Mood keywords mapped to HSL hue values
 */
export const moodHueMap: Record<string, number> = {
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
