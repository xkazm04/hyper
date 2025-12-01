'use client'

import { cn } from '@/lib/utils'
import type { PathCard } from '../lib/useStoryPath'
import { ImageIcon } from 'lucide-react'

interface PathCardThumbnailProps {
  pathCard: PathCard
  onClick?: () => void
  index: number
}

export function PathCardThumbnail({
  pathCard,
  onClick,
  index,
}: PathCardThumbnailProps) {
  const { card, isCurrentCard, isFutureCard, isPastCard } = pathCard

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex-shrink-0 group',
        'w-24 h-32 rounded-lg overflow-hidden',
        'border-2 transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        // Current card - prominent glow
        isCurrentCard && [
          'border-primary',
          'ring-4 ring-primary/30',
          'scale-110 z-10',
          'shadow-lg shadow-primary/20',
        ],
        // Past cards - muted
        isPastCard && [
          'border-muted-foreground/30',
          'opacity-70',
          'hover:opacity-100 hover:border-muted-foreground/50',
        ],
        // Future cards - dimmed with hint
        isFutureCard && [
          'border-border/50',
          'opacity-50',
          'hover:opacity-80 hover:border-border',
        ]
      )}
      style={{
        animationDelay: `${index * 50}ms`,
      }}
      data-testid={`path-card-thumbnail-${card.id}`}
      aria-label={`${isCurrentCard ? 'Current card: ' : ''}${card.title || 'Untitled'}`}
      aria-current={isCurrentCard ? 'true' : undefined}
    >
      {/* Card image or placeholder */}
      <div className="absolute inset-0 bg-muted">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.title || 'Card image'}
            className={cn(
              'w-full h-full object-cover',
              'transition-transform duration-200',
              'group-hover:scale-105'
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

      {/* Card title */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p
          className={cn(
            'text-xs font-medium text-white truncate',
            'drop-shadow-sm'
          )}
          title={card.title || 'Untitled'}
        >
          {card.title || 'Untitled'}
        </p>
      </div>

      {/* Current card indicator - soft glow effect */}
      {isCurrentCard && (
        <div
          className={cn(
            'absolute inset-0 pointer-events-none',
            'animate-pulse',
            'ring-2 ring-primary/50 ring-inset',
            'rounded-lg'
          )}
          data-testid="path-card-current-indicator"
        />
      )}

      {/* Order index badge for accessibility */}
      <div
        className={cn(
          'absolute top-1 left-1',
          'w-5 h-5 rounded-full',
          'flex items-center justify-center',
          'text-[10px] font-bold',
          isCurrentCard
            ? 'bg-primary text-primary-foreground'
            : isPastCard
              ? 'bg-muted-foreground/50 text-white'
              : 'bg-border/70 text-muted-foreground'
        )}
      >
        {pathCard.depth + 1}
      </div>
    </button>
  )
}
