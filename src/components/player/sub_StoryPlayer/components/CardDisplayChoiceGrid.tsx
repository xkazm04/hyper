'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Choice } from '@/lib/types'
import { CardDisplayTheme } from '../lib/cardDisplayTypes'

// ============================================================================
// Choice Grid Component
// ============================================================================

interface ChoiceGridProps {
  choices: Choice[]
  selectedIndex: number
  onChoiceClick?: (targetCardId: string) => void
  disabled?: boolean
  variant: 'player' | 'preview'
  style: Record<string, string | undefined>
  shadowStyle?: CardDisplayTheme['shadowStyle']
}

export function ChoiceGrid({ choices, selectedIndex, onChoiceClick, disabled, style }: ChoiceGridProps) {
  // Unified 2x2 grid for both variants with elegant button design
  const gridChoices = choices.slice(0, 4) // Max 4 choices in grid

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-auto" data-testid="card-choices">
      {gridChoices.map((choice, index) => (
        <motion.button
          key={choice.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: index * 0.08,
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          onClick={() => onChoiceClick?.(choice.targetCardId)}
          disabled={disabled}
          className={cn(
            'group py-3 sm:py-4 px-3 sm:px-5 text-sm sm:text-base font-semibold',
            'rounded-xl transition-all duration-300 ease-out',
            'hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]',
            'touch-manipulation min-h-[52px] sm:min-h-[64px]',
            'flex items-center justify-center text-center',
            index === selectedIndex && 'ring-2 ring-offset-2 ring-offset-card',
            // Subtle gradient overlay on hover
            'relative overflow-hidden',
            // If only 1 choice, span full width
            gridChoices.length === 1 && 'col-span-2',
            // If 3 choices, last one spans full width
            gridChoices.length === 3 && index === 2 && 'col-span-2',
            // Disabled state
            disabled && 'opacity-60 cursor-not-allowed'
          )}
          style={{
            ...style,
            ['--tw-ring-color' as string]: style.backgroundColor,
          }}
          data-testid={`choice-btn-${index}`}
        >
          {/* Hover shine effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          {/* Choice number indicator */}
          <span className="absolute top-1 left-2 text-[10px] opacity-40 font-mono">
            {index + 1}
          </span>
          <span className="relative leading-tight">{choice.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
