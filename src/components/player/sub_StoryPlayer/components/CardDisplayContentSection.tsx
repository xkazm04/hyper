'use client'

import { cn } from '@/lib/utils'
import { Choice } from '@/lib/types'
import { CardDisplayTheme } from '../lib/cardDisplayTypes'
import { ChoiceGrid } from './CardDisplayChoiceGrid'
import { EndBadge } from './CardDisplayEndBadge'

// ============================================================================
// Content Section Component
// ============================================================================

interface ContentSectionProps {
  title: string | null
  content: string | null
  displayedText: string
  contentComplete: boolean
  isPreview: boolean
  onSkipContent: () => void
  titleFont?: string
  choices: Choice[]
  selectedChoiceIndex: number
  onChoiceClick?: (targetCardId: string) => void
  disabled: boolean
  variant: 'player' | 'preview'
  choiceStyle: Record<string, string | undefined>
  shadowStyle?: CardDisplayTheme['shadowStyle']
}

export function ContentSection({
  title,
  content,
  displayedText,
  contentComplete,
  isPreview,
  onSkipContent,
  titleFont,
  choices,
  selectedChoiceIndex,
  onChoiceClick,
  disabled,
  variant,
  choiceStyle,
  shadowStyle,
}: ContentSectionProps) {
  return (
    <div className="relative flex flex-col p-4 sm:p-6 md:p-8 lg:p-10">
      {/* Decorative corner ornaments - smaller on mobile */}
      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-t-2 border-primary/20 rounded-tl-sm" />
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-t-2 border-primary/20 rounded-tr-sm" />
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-b-2 border-primary/20 rounded-bl-sm" />
      <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-b-2 border-primary/20 rounded-br-sm" />

      {/* Title - elegant display typography */}
      <h1
        className={cn(
          'font-bold mb-3 sm:mb-4 text-center leading-tight tracking-tight',
          'text-lg sm:text-xl md:text-2xl lg:text-3xl',
          'bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text'
        )}
        style={{ fontFamily: titleFont, color: 'hsl(var(--foreground))' }}
      >
        {title}
      </h1>

      {/* Content text - book-like readability */}
      {content && (
        <div
          className={cn(
            'max-w-prose mx-auto mb-5 sm:mb-6 md:mb-8',
            !isPreview && !contentComplete && 'cursor-pointer group'
          )}
          onClick={() => !isPreview && !contentComplete && onSkipContent()}
          title={!isPreview && !contentComplete ? 'Click to skip animation' : undefined}
        >
          <p className={cn(
            'whitespace-pre-wrap text-center',
            'text-sm sm:text-base md:text-lg leading-relaxed sm:leading-loose',
            'text-muted-foreground/90',
            // Elegant first letter styling - smaller on mobile
            'first-letter:text-xl sm:first-letter:text-2xl first-letter:font-bold first-letter:text-foreground first-letter:mr-0.5'
          )}>
            {isPreview ? content : displayedText}
            {!isPreview && !contentComplete && (
              <span className="inline-block w-0.5 h-4 sm:h-5 bg-primary/70 ml-0.5 animate-pulse" />
            )}
          </p>
          {!isPreview && !contentComplete && (
            <p className="text-[10px] sm:text-xs text-muted-foreground/50 text-center mt-1.5 sm:mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to skip
            </p>
          )}
        </div>
      )}

      {/* Decorative divider above choices */}
      {(choices.length > 0 || !content) && (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
          <div className="h-px flex-1 max-w-12 sm:max-w-16 bg-gradient-to-r from-transparent to-border/50" />
          <span className="text-[10px] sm:text-xs text-muted-foreground/50 font-medium uppercase tracking-wider sm:tracking-widest">
            {choices.length > 0 ? 'Choose your path' : 'The End'}
          </span>
          <div className="h-px flex-1 max-w-12 sm:max-w-16 bg-gradient-to-l from-transparent to-border/50" />
        </div>
      )}

      {/* Choices or End Badge */}
      {choices.length > 0 ? (
        <ChoiceGrid
          choices={choices}
          selectedIndex={selectedChoiceIndex}
          onChoiceClick={onChoiceClick}
          disabled={disabled}
          variant={variant}
          style={choiceStyle}
          shadowStyle={shadowStyle}
        />
      ) : (
        <EndBadge variant={variant} style={choiceStyle} shadowStyle={shadowStyle} />
      )}
    </div>
  )
}
