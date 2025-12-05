import { StoryCard, Choice } from '@/lib/types'

// ============================================================================
// Types
// ============================================================================

export interface CardDisplayTheme {
  borderRadius?: string
  borderWidth?: string
  borderStyle?: string
  shadowStyle?: 'none' | 'soft' | 'hard' | 'glow'
  fontFamily?: string
  titleFont?: string
  overlayOpacity?: number
  choiceBg?: string
  choiceText?: string
  choiceBorder?: string
  messageBg?: string
  messageText?: string
  messageBorder?: string
  accent?: string
}

export interface CardDisplayProps {
  card: StoryCard
  choices: Choice[]
  selectedChoiceIndex?: number
  onChoiceClick?: (targetCardId: string) => void
  theme?: CardDisplayTheme
  variant?: 'player' | 'preview'
  className?: string
  disabled?: boolean
  /** Enable audio autoplay when card loads */
  autoplayAudio?: boolean
  /** Callback when audio finishes playing */
  onAudioEnd?: () => void
}

// ============================================================================
// Default Theme Config
// ============================================================================

export const defaultTheme: CardDisplayTheme = {
  borderRadius: '0.5rem',
  borderWidth: '2px',
  borderStyle: 'solid',
  shadowStyle: 'soft',
  fontFamily: 'inherit',
  titleFont: 'inherit',
  overlayOpacity: 0.6,
  choiceBg: 'hsl(var(--primary))',
  choiceText: 'hsl(var(--primary-foreground))',
  choiceBorder: 'hsl(var(--border))',
  messageBg: 'hsl(var(--card) / 0.95)',
  messageText: 'hsl(var(--foreground))',
  messageBorder: 'hsl(var(--border))',
  accent: 'hsl(var(--primary))',
}
