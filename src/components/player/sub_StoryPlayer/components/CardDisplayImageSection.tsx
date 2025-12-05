'use client'

import { RefObject, MutableRefObject } from 'react'
import Image from 'next/image'
import { FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { StoryCard } from '@/lib/types'
import { CardDisplayTheme } from '../lib/cardDisplayTypes'
import { getSpeakerIcon } from '../lib/cardDisplayHelpers'

// ============================================================================
// Image Section Component
// ============================================================================

interface ImageSectionProps {
  card: StoryCard
  isPreview: boolean
  parallaxRef: RefObject<HTMLDivElement | null>
  parallaxTransform: { x: number; y: number }
  messageStyle: Record<string, string | undefined>
  overlayOpacity?: number
}

export function ImageSection({
  card,
  isPreview,
  parallaxRef,
  parallaxTransform,
  messageStyle,
  overlayOpacity = 0.6,
}: ImageSectionProps) {
  return (
    <div
      ref={parallaxRef}
      className="relative w-full bg-muted overflow-hidden aspect-video"
    >
      {card.imageUrl ? (
        <>
          <motion.div
            className="absolute inset-0"
            animate={{
              x: parallaxTransform.x,
              y: parallaxTransform.y,
              scale: isPreview ? 1 : 1.05,
            }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
          >
            <Image
              src={card.imageUrl}
              alt={card.title || 'Card image'}
              fill
              className="object-cover"
              priority={!isPreview}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
            />
          </motion.div>
          {/* Cinematic vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
          {/* Overlay for message readability */}
          {card.message && (
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
              style={{ opacity: overlayOpacity }}
            />
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
          <div className="text-center text-muted-foreground">
            <FileText className="mx-auto mb-1.5 sm:mb-2 opacity-30 w-10 h-10 sm:w-16 sm:h-16" />
            <p className="text-xs sm:text-sm font-medium">Scene awaits...</p>
          </div>
        </div>
      )}

      {/* Message bubble overlay - elegant glassmorphism */}
      {card.message && (
        <div className="absolute left-2 right-2 bottom-2 sm:left-4 sm:right-4 sm:bottom-6">
          <div
            className="backdrop-blur-md p-3 sm:p-4 md:p-5 rounded-lg sm:rounded-xl"
            style={{
              ...messageStyle,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            } as React.CSSProperties}
          >
            {card.speaker && (
              <div className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5 text-xs sm:text-sm font-bold text-white/80">
                {getSpeakerIcon(card.speakerType)}
                <span className="truncate">{card.speaker}</span>
              </div>
            )}
            <p
              className={cn(
                'text-white text-sm sm:text-base md:text-lg leading-relaxed',
                card.speakerType === 'narrator' && 'italic',
                card.speakerType === 'system' && 'font-mono text-xs sm:text-sm'
              )}
            >
              {card.message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
