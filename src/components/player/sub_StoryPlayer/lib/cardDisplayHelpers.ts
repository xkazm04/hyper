import { BookOpen, Cpu, User } from 'lucide-react'
import { createElement } from 'react'
import { StoryCard } from '@/lib/types'
import { CardDisplayTheme } from './cardDisplayTypes'

// ============================================================================
// Helper Functions
// ============================================================================

export function getShadowClass(style: CardDisplayTheme['shadowStyle']) {
  switch (style) {
    case 'none':
      return ''
    case 'soft':
      return 'shadow-lg'
    case 'glow':
      return 'shadow-lg shadow-primary/30'
    case 'hard':
    default:
      return 'shadow-[4px_4px_0px_0px_hsl(var(--border))]'
  }
}

export function getSpeakerIcon(speakerType: StoryCard['speakerType']) {
  const iconClass = 'w-3.5 h-3.5'
  switch (speakerType) {
    case 'narrator':
      return createElement(BookOpen, { className: iconClass })
    case 'system':
      return createElement(Cpu, { className: iconClass })
    case 'character':
    default:
      return createElement(User, { className: iconClass })
  }
}
