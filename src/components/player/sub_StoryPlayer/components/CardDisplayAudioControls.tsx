'use client'

import { Loader2, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Audio Controls Component
// ============================================================================

interface AudioControlsProps {
  isPlaying: boolean
  isLoading: boolean
  isMuted: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
}

export function AudioControls({
  isPlaying,
  isLoading,
  isMuted,
  onTogglePlay,
  onToggleMute,
}: AudioControlsProps) {
  return (
    <div className="absolute top-2 right-2 z-20 flex items-center gap-0.5">
      <button
        type="button"
        onClick={onTogglePlay}
        disabled={isLoading}
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-full touch-manipulation',
          'bg-black/60 backdrop-blur-sm text-white',
          'hover:bg-black/80 transition-all duration-200',
          'shadow-lg disabled:opacity-50'
        )}
        aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
        data-testid="audio-play-btn"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </button>
      <button
        type="button"
        onClick={onToggleMute}
        className={cn(
          'flex items-center justify-center w-11 h-11 rounded-full touch-manipulation',
          'bg-black/60 backdrop-blur-sm text-white',
          'hover:bg-black/80 transition-all duration-200',
          'shadow-lg'
        )}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        data-testid="audio-mute-btn"
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}
