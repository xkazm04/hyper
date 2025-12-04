'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Radio, Volume2, VolumeX, Music2 } from 'lucide-react'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

// Lofi Girl livestream - runs 24/7
const LOFI_VIDEO_ID = 'jfKfPfyJRdk'

interface YouTubeRadioProps {
  className?: string
}

export function YouTubeRadio({ className }: YouTubeRadioProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const apiLoadedRef = useRef(false)

  // Lazy load YouTube API only when user interacts
  const loadYouTubeAPI = useCallback(() => {
    if (apiLoadedRef.current) return Promise.resolve()

    return new Promise<void>((resolve) => {
      // Check if API is already loaded
      if (window.YT && window.YT.Player) {
        apiLoadedRef.current = true
        resolve()
        return
      }

      // Load the API script
      const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]')
      if (!existingScript) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }

      // Wait for API to be ready
      const previousCallback = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.()
        apiLoadedRef.current = true
        resolve()
      }

      // If API was already loaded but callback wasn't called
      if (window.YT && window.YT.Player) {
        apiLoadedRef.current = true
        resolve()
      }
    })
  }, [])

  // Initialize player
  const initPlayer = useCallback(() => {
    if (playerRef.current || !containerRef.current) return

    const playerDiv = document.createElement('div')
    playerDiv.id = 'yt-radio-player'
    containerRef.current.appendChild(playerDiv)

    playerRef.current = new window.YT.Player('yt-radio-player', {
      videoId: LOFI_VIDEO_ID,
      width: 1,
      height: 1,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 0,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          setIsReady(true)
          setIsLoading(false)
        },
        onStateChange: (e: any) => {
          setIsPlaying(e.data === window.YT.PlayerState.PLAYING)
          if (e.data === window.YT.PlayerState.PLAYING) {
            setIsLoading(false)
          }
        },
        onError: () => {
          setIsLoading(false)
          setIsReady(false)
        },
      },
    })
  }, [])

  // Handle play/pause toggle
  const togglePlay = useCallback(async () => {
    if (isLoading) return

    // First click - load API and initialize player
    if (!apiLoadedRef.current || !playerRef.current) {
      setIsLoading(true)
      await loadYouTubeAPI()
      initPlayer()
      // Player will auto-play after ready due to the state below
      return
    }

    if (!playerRef.current) return

    if (isPlaying) {
      playerRef.current.pauseVideo()
    } else {
      setIsLoading(true)
      playerRef.current.playVideo()
    }
  }, [isPlaying, isLoading, loadYouTubeAPI, initPlayer])

  // Auto-play when player becomes ready (after first click)
  useEffect(() => {
    if (isReady && !isPlaying && isLoading && playerRef.current) {
      playerRef.current.playVideo()
    }
  }, [isReady, isPlaying, isLoading])

  // Handle mute toggle
  const toggleMute = useCallback(() => {
    if (!playerRef.current || !isReady) return

    if (isMuted) {
      playerRef.current.unMute()
      setIsMuted(false)
    } else {
      playerRef.current.mute()
      setIsMuted(true)
    }
  }, [isMuted, isReady])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerRef.current?.destroy()
    }
  }, [])

  return (
    <div
      className={cn('relative flex items-center gap-1', className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Hidden YouTube player container */}
      <div
        ref={containerRef}
        className="absolute w-0 h-0 overflow-hidden pointer-events-none opacity-0"
        aria-hidden="true"
      />

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded whitespace-nowrap"
          style={{ backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
        >
          Lofi Radio
        </div>
      )}

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center transition-all',
          'border border-border',
          isPlaying
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground',
          isLoading && 'opacity-50 cursor-wait'
        )}
        title={isPlaying ? 'Pause lofi radio' : 'Play lofi radio'}
        aria-label={isPlaying ? 'Pause lofi radio' : 'Play lofi radio'}
      >
        {isLoading ? (
          <Radio className="w-4 h-4 animate-pulse" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Music2 className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Mute button - only show when playing */}
      {isPlaying && isReady && (
        <button
          onClick={toggleMute}
          className={cn(
            'w-6 h-6 rounded-full flex items-center justify-center transition-all',
            'text-muted-foreground hover:text-foreground'
          )}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      {/* Playing indicator */}
      {isPlaying && (
        <div className="flex items-center gap-0.5 ml-1">
          <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-0.5 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-0.5 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}
