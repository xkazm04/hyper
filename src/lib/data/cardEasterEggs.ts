/**
 * Easter egg content for card flip surprise feature
 * Each easter egg includes a fun fact, quirky illustration, or animation
 */

export interface EasterEgg {
  id: string
  type: 'fact' | 'illustration' | 'animation'
  content: string
  emoji?: string
  backgroundColor?: string
}

export const cardEasterEggs: EasterEgg[] = [
  {
    id: 'fact-1',
    type: 'fact',
    content: 'Did you know? The first hypercard was created in 1987 by Bill Atkinson!',
    emoji: '🎨',
    backgroundColor: '#FFE5B4',
  },
  {
    id: 'fact-2',
    type: 'fact',
    content: 'Fun fact: You can create entire interactive stories with just cards!',
    emoji: '📚',
    backgroundColor: '#E0BBE4',
  },
  {
    id: 'fact-3',
    type: 'fact',
    content: 'Easter egg unlocked! Keep exploring for more surprises!',
    emoji: '🥚',
    backgroundColor: '#B4E7CE',
  },
  {
    id: 'fact-4',
    type: 'fact',
    content: 'Cards are like mini-universes of creativity!',
    emoji: '✨',
    backgroundColor: '#FFDAC1',
  },
  {
    id: 'fact-5',
    type: 'fact',
    content: 'Double-click magic: Making editing delightful one flip at a time!',
    emoji: '🪄',
    backgroundColor: '#C7CEEA',
  },
  {
    id: 'illustration-1',
    type: 'illustration',
    content: '🎭 🎪 🎨 ✨',
    emoji: '🎭',
    backgroundColor: '#FFB7B2',
  },
  {
    id: 'illustration-2',
    type: 'illustration',
    content: '🚀 → 🌙 → ⭐',
    emoji: '🚀',
    backgroundColor: '#B2E7FF',
  },
  {
    id: 'animation-1',
    type: 'animation',
    content: 'You found the secret! 🎉',
    emoji: '🎉',
    backgroundColor: '#FFCCE5',
  },
  {
    id: 'fact-6',
    type: 'fact',
    content: 'Each card is a canvas for your imagination!',
    emoji: '🖼️',
    backgroundColor: '#D4F1F4',
  },
  {
    id: 'fact-7',
    type: 'fact',
    content: 'You just discovered one of the hidden delights of the editor!',
    emoji: '🔍',
    backgroundColor: '#FFE9C5',
  },
]

/**
 * Get a random easter egg
 */
export function getRandomEasterEgg(): EasterEgg {
  const randomIndex = Math.floor(Math.random() * cardEasterEggs.length)
  return cardEasterEggs[randomIndex]
}

/**
 * Get an easter egg by card ID (deterministic based on card ID hash)
 */
export function getEasterEggForCard(cardId: string): EasterEgg {
  // Simple hash function to get consistent easter egg for each card
  let hash = 0
  for (let i = 0; i < cardId.length; i++) {
    const char = cardId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  const index = Math.abs(hash) % cardEasterEggs.length
  return cardEasterEggs[index]
}
