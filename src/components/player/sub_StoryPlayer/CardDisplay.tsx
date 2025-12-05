'use client'

import { forwardRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// Types and config
import {
  CardDisplayProps,
  CardDisplayTheme,
  defaultTheme,
} from './lib/cardDisplayTypes'

// Helpers and hooks
import { getShadowClass } from './lib/cardDisplayHelpers'
import { useAudioPlayer } from './lib/cardDisplayAudio'
import { useTypewriter } from './lib/cardDisplayTypewriter'
import { useParallax } from './lib/cardDisplayParallax'

// Components
import { AudioControls } from './components/CardDisplayAudioControls'
import { ImageSection } from './components/CardDisplayImageSection'
import { ContentSection } from './components/CardDisplayContentSection'

// Re-export types for external use
export type { CardDisplayProps, CardDisplayTheme }

/**
 * CardDisplay - Unified story card display component
 *
 * Can be used in two variants:
 * - 'player': Full-size player layout with aspect-video image (typewriter enabled)
 * - 'preview': Full preview layout matching player style (no typewriter, interactive)
 *
 * Features:
 * - Audio narration with autoplay support (uses blob fetch for compatibility)
 * - Elegant typography with decorative elements
 * - Animated transitions
 * - Decorative corner ornaments and dividers
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
      autoplayAudio = false,
      onAudioEnd,
    },
    ref
  ) {
    const mergedTheme = useMemo(() => ({ ...defaultTheme, ...theme }), [theme])
    const isPreview = variant === 'preview'
    const hasAudio = !!card.audioUrl

    // Use custom audio hook with blob fetch
    const { isPlaying, isLoading, isMuted, togglePlay, toggleMute } = useAudioPlayer(
      hasAudio ? card.audioUrl : null,
      autoplayAudio && !isPreview,
      onAudioEnd
    )

    // Typewriter effect for content (player mode only - disabled for preview)
    const { displayedText: contentText, isComplete: contentComplete, skip: skipContent } = useTypewriter(
      card.content || null,
      !isPreview, // Only enable typewriter for player mode
      20
    )

    // Parallax effect for image (player mode only, with mouse)
    const { ref: parallaxRef, transform: parallaxTransform } = useParallax(!isPreview)

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
      <motion.div
        ref={ref}
        initial={!isPreview ? { opacity: 0, y: 30 } : false}
        animate={!isPreview ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={cn(
          'bg-card overflow-hidden relative rounded-xl',
          getShadowClass(mergedTheme.shadowStyle),
          // Elegant border glow effect
          'ring-1 ring-border/50',
          // Ambient glow from card accent color
          'shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]',
          className
        )}
        style={cardStyle as React.CSSProperties}
        data-story-card
        data-testid={isPreview ? 'story-card-preview' : 'story-card-player'}
      >
        {/* Audio controls - top right corner (player mode only) */}
        {hasAudio && !isPreview && (
          <AudioControls
            isPlaying={isPlaying}
            isLoading={isLoading}
            isMuted={isMuted}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
          />
        )}

        {/* Image Section */}
        <ImageSection
          card={card}
          isPreview={isPreview}
          parallaxRef={parallaxRef}
          parallaxTransform={parallaxTransform}
          messageStyle={messageStyle}
          overlayOpacity={mergedTheme.overlayOpacity}
        />

        {/* Content Section */}
        <ContentSection
          title={card.title}
          content={card.content}
          displayedText={contentText}
          contentComplete={contentComplete}
          isPreview={isPreview}
          onSkipContent={skipContent}
          titleFont={mergedTheme.titleFont}
          choices={choices}
          selectedChoiceIndex={selectedChoiceIndex}
          onChoiceClick={onChoiceClick}
          disabled={disabled}
          variant={variant}
          choiceStyle={choiceStyle}
          shadowStyle={mergedTheme.shadowStyle}
        />
      </motion.div>
    )
  }
)

CardDisplay.displayName = 'CardDisplay'
