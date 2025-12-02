'use client'

import { forwardRef, useMemo } from 'react'
import Image from 'next/image'
import { StoryCard, Choice } from '@/lib/types'
import { FileText, BookOpen, User, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'

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
}

// ============================================================================
// Helper Functions
// ============================================================================

const defaultTheme: CardDisplayTheme = {
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

function getShadowClass(style: CardDisplayTheme['shadowStyle']) {
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

function getSpeakerIcon(speakerType: StoryCard['speakerType']) {
  switch (speakerType) {
    case 'narrator':
      return <BookOpen className="w-3.5 h-3.5" />
    case 'system':
      return <Cpu className="w-3.5 h-3.5" />
    case 'character':
    default:
      return <User className="w-3.5 h-3.5" />
  }
}

// ============================================================================
// Components
// ============================================================================

/**
 * CardDisplay - Unified story card display component
 *
 * Can be used in two variants:
 * - 'player': Full-size player layout with aspect-video image
 * - 'preview': Compact preview layout with 1:1 aspect ratio
 */
export const CardDisplay = forwardRef<HTMLDivElement, CardDisplayProps>(
  function CardDisplay(
    {
      card,
      choices,
      selectedChoiceIndex = -1,
      onChoiceClick,
      theme = {},
      variant = 'player',
      className,
      disabled = false,
    },
    ref
  ) {
    const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme])

    const isPreview = variant === 'preview'

    // Style objects
    const cardStyle = useMemo(() => ({
      borderRadius: mergedTheme.borderRadius,
      borderWidth: mergedTheme.borderWidth,
      borderStyle: mergedTheme.borderStyle,
      borderColor: 'hsl(var(--border))',
      fontFamily: mergedTheme.fontFamily,
    }), [mergedTheme])

    const choiceStyle = useMemo(() => ({
      backgroundColor: mergedTheme.choiceBg,
      color: mergedTheme.choiceText,
      borderColor: mergedTheme.choiceBorder,
      borderWidth: '2px',
      borderStyle: 'solid',
      borderRadius: mergedTheme.borderRadius,
    }), [mergedTheme])

    const messageStyle = useMemo(() => ({
      backgroundColor: mergedTheme.messageBg,
      color: mergedTheme.messageText,
      borderColor: mergedTheme.messageBorder,
      borderWidth: '2px',
      borderStyle: 'solid',
      borderRadius: mergedTheme.borderRadius,
    }), [mergedTheme])

    return (
      <div
        ref={ref}
        className={cn(
          'bg-card overflow-hidden',
          getShadowClass(mergedTheme.shadowStyle),
          isPreview ? 'aspect-square' : 'rounded-lg',
          className
        )}
        style={cardStyle as any}
        data-story-card
        data-testid={isPreview ? 'story-card-preview' : 'story-card-player'}
      >
        {/* Image Section */}
        <div
          className={cn(
            'relative w-full bg-muted overflow-hidden',
            isPreview ? 'h-[55%]' : 'aspect-video'
          )}
          style={isPreview ? {
            borderBottomWidth: mergedTheme.borderWidth,
            borderBottomStyle: mergedTheme.borderStyle as any,
            borderBottomColor: 'hsl(var(--border))',
          } : undefined}
        >
          {card.imageUrl ? (
            <>
              <Image
                src={card.imageUrl}
                alt={card.title || 'Card image'}
                fill
                className={cn(
                  'object-cover',
                  !isPreview && 'animate-image-zoom transition-transform duration-300'
                )}
                priority={!isPreview}
                sizes={isPreview ? '384px' : '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px'}
              />
              {/* Overlay for message readability */}
              {card.message && (
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                  style={{ opacity: mergedTheme.overlayOpacity }}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center text-muted-foreground">
                <FileText className={cn('mx-auto mb-2 opacity-40', isPreview ? 'w-12 h-12' : 'w-16 h-16')} />
                <p className="text-xs font-medium">No image</p>
              </div>
            </div>
          )}

          {/* Message bubble overlay - positioned at bottom of image */}
          {card.message && (
            <div className={cn('absolute left-2 right-2', isPreview ? 'bottom-2' : 'bottom-4')}>
              <div className={isPreview ? 'p-2.5' : 'p-4'} style={messageStyle as any}>
                {card.speaker && (
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-bold opacity-70">
                    {getSpeakerIcon(card.speakerType)}
                    <span>{card.speaker}</span>
                  </div>
                )}
                <p
                  className={cn(
                    'leading-snug',
                    isPreview ? 'text-sm' : 'text-base',
                    card.speakerType === 'narrator' && 'italic',
                    card.speakerType === 'system' && 'font-mono text-xs'
                  )}
                >
                  {card.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className={cn('flex flex-col', isPreview ? 'h-[45%] p-3' : 'p-4 sm:p-6 md:p-8')}>
          {/* Title - only in player mode, preview uses header */}
          {!isPreview && (
            <h1
              className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-center leading-tight"
              style={{ fontFamily: mergedTheme.titleFont, color: 'hsl(var(--foreground))' }}
            >
              {card.title}
            </h1>
          )}

          {/* Content text - only in player mode */}
          {!isPreview && card.content && (
            <div className="prose prose-sm sm:prose-base max-w-none mb-6 text-center">
              <p className="leading-relaxed whitespace-pre-wrap text-sm sm:text-base text-muted-foreground">
                {card.content}
              </p>
            </div>
          )}

          {/* Choices */}
          {choices.length > 0 ? (
            <ChoiceGrid
              choices={choices}
              selectedIndex={selectedChoiceIndex}
              onChoiceClick={onChoiceClick}
              disabled={disabled}
              variant={variant}
              style={choiceStyle}
              shadowStyle={mergedTheme.shadowStyle}
            />
          ) : (
            <EndBadge variant={variant} style={choiceStyle} shadowStyle={mergedTheme.shadowStyle} />
          )}
        </div>
      </div>
    )
  }
)

// ============================================================================
// Choice Grid Sub-component
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

function ChoiceGrid({ choices, selectedIndex, onChoiceClick, disabled, variant, style, shadowStyle }: ChoiceGridProps) {
  const isPreview = variant === 'preview'

  if (isPreview) {
    // 2x2 grid for preview, filling from bottom-right
    const grid: (Choice | null)[] = [null, null, null, null]
    const count = choices.length
    if (count === 1) grid[3] = choices[0]
    else if (count === 2) { grid[2] = choices[0]; grid[3] = choices[1] }
    else if (count === 3) { grid[1] = choices[0]; grid[2] = choices[1]; grid[3] = choices[2] }
    else if (count >= 4) { grid[0] = choices[0]; grid[1] = choices[1]; grid[2] = choices[2]; grid[3] = choices[3] }

    return (
      <div className="flex-1 grid grid-cols-2 gap-2" data-testid="card-choices">
        {grid.map((choice, index) => (
          <div
            key={choice?.id ?? `empty-${index}`}
            className={cn('transition-all', choice ? 'cursor-pointer' : 'bg-transparent')}
            style={choice ? {
              ...style,
              boxShadow: shadowStyle === 'hard' ? `2px 2px 0px 0px ${style.borderColor}` : 'none',
            } : undefined}
          >
            {choice && (
              <button
                disabled={disabled}
                onClick={() => onChoiceClick?.(choice.targetCardId)}
                className="w-full h-full px-2 py-1.5 text-xs font-semibold text-center flex items-center justify-center leading-tight"
                style={{ color: style.color }}
                data-testid={`choice-btn-${index}`}
              >
                {choice.label}
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Linear list for player
  return (
    <div className="space-y-2.5 sm:space-y-3 mt-auto" data-testid="card-choices">
      {choices.map((choice, index) => (
        <button
          key={choice.id}
          onClick={() => onChoiceClick?.(choice.targetCardId)}
          disabled={disabled}
          className={cn(
            'w-full py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200',
            'hover:scale-[1.02] active:scale-[0.98] touch-manipulation min-h-[44px]',
            index === selectedIndex && 'ring-2 ring-offset-2 ring-offset-card'
          )}
          style={{
            ...style,
            ['--tw-ring-color' as string]: style.backgroundColor,
          }}
          data-testid={`choice-btn-${index}`}
        >
          {choice.label}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// End Badge Sub-component
// ============================================================================

interface EndBadgeProps {
  variant: 'player' | 'preview'
  style: Record<string, string | undefined>
  shadowStyle?: CardDisplayTheme['shadowStyle']
}

function EndBadge({ variant, style, shadowStyle }: EndBadgeProps) {
  const isPreview = variant === 'preview'

  return (
    <div className="flex-1 flex items-center justify-center" data-testid="card-end">
      <div
        className={cn('text-center', isPreview ? 'px-4 py-3' : 'px-6 py-4')}
        style={{
          ...style,
          boxShadow: shadowStyle === 'hard' ? `2px 2px 0px 0px ${style.borderColor}` : 'none',
        }}
      >
        <p className={cn('font-bold', isPreview ? 'text-sm' : 'text-lg')} style={{ color: style.color }}>
          {isPreview ? '✦ The End ✦' : 'The End'}
        </p>
        <p className={cn('mt-1 opacity-70', isPreview ? 'text-xs' : 'text-sm')} style={{ color: style.color }}>
          {isPreview ? 'No choices configured' : "You've reached the end of this story path"}
        </p>
      </div>
    </div>
  )
}

CardDisplay.displayName = 'CardDisplay'
