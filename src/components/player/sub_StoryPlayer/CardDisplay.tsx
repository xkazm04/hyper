'use client'

import { forwardRef, useMemo, useRef, useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { StoryCard, Choice } from '@/lib/types'
import { FileText, BookOpen, User, Cpu, Volume2, VolumeX, Play, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
// Audio Hook - Uses blob fetch for compatibility
// ============================================================================

function useAudioPlayer(audioUrl: string | null, autoplay: boolean, onAudioEnd?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Load and optionally autoplay when URL changes
  useEffect(() => {
    if (currentUrlRef.current === audioUrl) return

    // Cleanup previous audio
    cleanup()
    currentUrlRef.current = audioUrl
    setIsPlaying(false)

    if (!audioUrl) return

    // If autoplay, load immediately
    if (autoplay) {
      loadAndPlay()
    }

    async function loadAndPlay() {
      if (!audioUrl) return

      setIsLoading(true)
      try {
        const response = await fetch(audioUrl)
        if (!response.ok) throw new Error('Failed to fetch audio')

        const blob = await response.blob()
        const audioBlob = new Blob([blob], { type: 'audio/mpeg' })
        const blobUrl = URL.createObjectURL(audioBlob)
        blobUrlRef.current = blobUrl

        const audio = new Audio()
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
          onAudioEnd?.()
        }
        audio.onpause = () => setIsPlaying(false)
        audio.onplay = () => {
          setIsPlaying(true)
          setIsLoading(false)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          setIsLoading(false)
        }

        audio.src = blobUrl
        audio.muted = isMuted

        // Try to play
        try {
          await audio.play()
        } catch {
          // Autoplay blocked by browser
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Audio load error:', err)
        setIsLoading(false)
      }
    }
  }, [audioUrl, autoplay, cleanup, isMuted, onAudioEnd])

  // Toggle playback
  const togglePlay = useCallback(async () => {
    if (!audioUrl) return

    // If already playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      return
    }

    // If audio not loaded yet, load and play
    if (!audioRef.current || !blobUrlRef.current) {
      setIsLoading(true)
      try {
        const response = await fetch(audioUrl)
        if (!response.ok) throw new Error('Failed to fetch audio')

        const blob = await response.blob()
        const audioBlob = new Blob([blob], { type: 'audio/mpeg' })
        const blobUrl = URL.createObjectURL(audioBlob)

        // Cleanup old blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
        }
        blobUrlRef.current = blobUrl

        const audio = new Audio()
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
          onAudioEnd?.()
        }
        audio.onpause = () => setIsPlaying(false)
        audio.onplay = () => {
          setIsPlaying(true)
          setIsLoading(false)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          setIsLoading(false)
        }

        audio.src = blobUrl
        audio.muted = isMuted
        await audio.play()
      } catch (err) {
        console.error('Audio play error:', err)
        setIsLoading(false)
      }
    } else {
      // Audio loaded, just play
      try {
        await audioRef.current.play()
      } catch (err) {
        console.error('Audio play error:', err)
      }
    }
  }, [audioUrl, isPlaying, isMuted, onAudioEnd])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
    }
    setIsMuted(prev => !prev)
  }, [])

  return { isPlaying, isLoading, isMuted, togglePlay, toggleMute }
}

// ============================================================================
// Typewriter Hook - Animates text appearance
// ============================================================================

function useTypewriter(text: string | null, enabled: boolean, speed: number = 25) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const previousTextRef = useRef<string | null>(null)

  useEffect(() => {
    // Reset when text changes
    if (text !== previousTextRef.current) {
      previousTextRef.current = text
      setDisplayedText('')
      setIsComplete(false)
    }

    if (!text || !enabled) {
      setDisplayedText(text || '')
      setIsComplete(true)
      return
    }

    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(intervalId)
      }
    }, speed)

    return () => clearInterval(intervalId)
  }, [text, enabled, speed])

  const skip = useCallback(() => {
    if (text) {
      setDisplayedText(text)
      setIsComplete(true)
    }
  }, [text])

  return { displayedText, isComplete, skip }
}

// ============================================================================
// Mouse Parallax Hook - Creates depth effect on hover
// ============================================================================

function useParallax(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!enabled || !ref.current) return

    const element = ref.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = (e.clientX - centerX) / rect.width * 10
      const y = (e.clientY - centerY) / rect.height * 10
      setTransform({ x, y })
    }

    const handleMouseLeave = () => {
      setTransform({ x: 0, y: 0 })
    }

    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enabled])

  return { ref, transform }
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
 *
 * Features:
 * - Audio narration with autoplay support (uses blob fetch for compatibility)
 * - Elegant typography and spacing
 * - Animated transitions
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

    // Typewriter effect for content (player mode only)
    const { displayedText: contentText, isComplete: contentComplete, skip: skipContent } = useTypewriter(
      card.content || null,
      !isPreview,
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
          'bg-card overflow-hidden relative',
          getShadowClass(mergedTheme.shadowStyle),
          isPreview ? 'aspect-square' : 'rounded-xl',
          // Elegant border glow effect for player mode
          !isPreview && 'ring-1 ring-border/50',
          // Ambient glow from card accent color
          !isPreview && 'shadow-[0_0_60px_-15px_hsl(var(--primary)/0.3)]',
          className
        )}
        style={cardStyle as any}
        data-story-card
        data-testid={isPreview ? 'story-card-preview' : 'story-card-player'}
      >
        {/* Audio controls - top right corner (player mode only) */}
        {hasAudio && !isPreview && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full',
                'bg-black/60 backdrop-blur-sm text-white',
                'hover:bg-black/80 transition-all duration-200',
                'shadow-lg disabled:opacity-50'
              )}
              aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-full',
                'bg-black/60 backdrop-blur-sm text-white',
                'hover:bg-black/80 transition-all duration-200',
                'shadow-lg'
              )}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Image Section - enhanced with vignette effect and parallax */}
        <div
          ref={parallaxRef}
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
                  sizes={isPreview ? '384px' : '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px'}
                />
              </motion.div>
              {/* Cinematic vignette overlay */}
              {!isPreview && (
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
              )}
              {/* Overlay for message readability */}
              {card.message && (
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                  style={{ opacity: mergedTheme.overlayOpacity }}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
              <div className="text-center text-muted-foreground">
                <FileText className={cn('mx-auto mb-2 opacity-30', isPreview ? 'w-12 h-12' : 'w-20 h-20')} />
                <p className={cn('font-medium', isPreview ? 'text-xs' : 'text-sm')}>Scene awaits...</p>
              </div>
            </div>
          )}

          {/* Message bubble overlay - elegant glassmorphism */}
          {card.message && (
            <div className={cn('absolute left-3 right-3', isPreview ? 'bottom-2' : 'bottom-4 sm:bottom-6')}>
              <div
                className={cn(
                  'backdrop-blur-md',
                  isPreview ? 'p-2.5 rounded-lg' : 'p-4 sm:p-5 rounded-xl'
                )}
                style={{
                  ...messageStyle,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                } as any}
              >
                {card.speaker && (
                  <div className={cn(
                    'flex items-center gap-1.5 mb-1.5',
                    isPreview ? 'text-xs' : 'text-sm',
                    'font-bold text-white/80'
                  )}>
                    {getSpeakerIcon(card.speakerType)}
                    <span>{card.speaker}</span>
                  </div>
                )}
                <p
                  className={cn(
                    'text-white',
                    isPreview ? 'text-sm leading-snug' : 'text-base sm:text-lg leading-relaxed',
                    card.speakerType === 'narrator' && 'italic',
                    card.speakerType === 'system' && 'font-mono text-sm'
                  )}
                >
                  {card.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content Section - refined typography */}
        <div className={cn(
          'flex flex-col',
          isPreview ? 'h-[45%] p-3' : 'p-5 sm:p-8 md:p-10'
        )}>
          {/* Title - elegant display typography */}
          {!isPreview && (
            <h1
              className={cn(
                'font-bold mb-5 text-center leading-tight tracking-tight',
                'text-2xl sm:text-3xl md:text-4xl',
                'bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text'
              )}
              style={{ fontFamily: mergedTheme.titleFont, color: 'hsl(var(--foreground))' }}
            >
              {card.title}
            </h1>
          )}

          {/* Content text - book-like readability with typewriter effect */}
          {!isPreview && card.content && (
            <div
              className="max-w-prose mx-auto mb-8 cursor-pointer group"
              onClick={() => !contentComplete && skipContent()}
              title={!contentComplete ? 'Click to skip animation' : undefined}
            >
              <p className={cn(
                'whitespace-pre-wrap text-center',
                'text-base sm:text-lg leading-relaxed sm:leading-loose',
                'text-muted-foreground/90'
              )}>
                {contentText}
                {!contentComplete && (
                  <span className="inline-block w-0.5 h-5 bg-primary/70 ml-0.5 animate-pulse" />
                )}
              </p>
              {!contentComplete && (
                <p className="text-xs text-muted-foreground/50 text-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to skip
                </p>
              )}
            </div>
          )}

          {/* Choices - enhanced with better spacing */}
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
      </motion.div>
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

  // 2x2 grid for player - elegant button design with staggered animation
  // Fill grid from top-left for natural reading order
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
            'group py-4 sm:py-5 px-4 sm:px-6 text-sm sm:text-base font-semibold',
            'rounded-xl transition-all duration-300 ease-out',
            'hover:scale-[1.03] hover:shadow-xl active:scale-[0.97]',
            'touch-manipulation min-h-[60px] sm:min-h-[72px]',
            'flex items-center justify-center text-center',
            index === selectedIndex && 'ring-2 ring-offset-2 ring-offset-card',
            // Subtle gradient overlay on hover
            'relative overflow-hidden',
            // If only 1 choice, span full width
            gridChoices.length === 1 && 'col-span-2',
            // If 3 choices, last one spans full width
            gridChoices.length === 3 && index === 2 && 'col-span-2'
          )}
          style={{
            ...style,
            ['--tw-ring-color' as string]: style.backgroundColor,
          }}
          data-testid={`choice-btn-${index}`}
        >
          {/* Hover shine effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative leading-tight">{choice.label}</span>
        </motion.button>
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
        className={cn(
          'text-center rounded-xl',
          isPreview ? 'px-4 py-3' : 'px-8 py-6'
        )}
        style={{
          ...style,
          boxShadow: shadowStyle === 'hard' ? `2px 2px 0px 0px ${style.borderColor}` : 'none',
        }}
      >
        {/* Decorative stars */}
        <div className={cn('mb-2', isPreview ? 'text-lg' : 'text-2xl')} style={{ color: style.color }}>
          ✦ ✦ ✦
        </div>
        <p className={cn('font-bold tracking-wide', isPreview ? 'text-sm' : 'text-xl')} style={{ color: style.color }}>
          {isPreview ? 'The End' : 'The End'}
        </p>
        <p className={cn('mt-2 opacity-70', isPreview ? 'text-xs' : 'text-sm')} style={{ color: style.color }}>
          {isPreview ? 'No choices configured' : "You've reached the end of this story path"}
        </p>
        {!isPreview && (
          <p className="mt-4 text-xs opacity-50" style={{ color: style.color }}>
            Thank you for playing
          </p>
        )}
      </div>
    </div>
  )
}

CardDisplay.displayName = 'CardDisplay'
