'use client'

import { FileText, ImageIcon, Volume2, Play, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ActionIconButton } from './ActionIconButton'
import { GenerationState } from './lib/types'

// ============================================================================
// Action Bar - Compact row of quick action icons for Content/Image/Audio
// ============================================================================

interface ActionBarProps {
  // Content
  hasContent: boolean
  contentState: GenerationState
  onGenerateContent: () => void
  onEditContent: () => void
  // Image
  hasImage: boolean
  imageState: GenerationState
  canGenerateImage: boolean
  onGenerateImage: () => void
  // Audio
  hasAudio: boolean
  audioState: GenerationState
  canGenerateAudio: boolean
  onGenerateAudio: () => void
  isPlaying: boolean
  isLoadingAudio: boolean
  onTogglePlayback: () => void
  // Theme
  isHalloween?: boolean
}

export function ActionBar({
  hasContent,
  contentState,
  onGenerateContent,
  onEditContent,
  hasImage,
  imageState,
  canGenerateImage,
  onGenerateImage,
  hasAudio,
  audioState,
  canGenerateAudio,
  onGenerateAudio,
  isPlaying,
  isLoadingAudio,
  onTogglePlayback,
  isHalloween,
}: ActionBarProps) {
  return (
    <div className="px-4 py-2">
      {/* Quick Action Icons - Single compact row */}
      <div className="flex items-center justify-center gap-3">
        {/* Content Button */}
        <ActionIconButton
          icon={FileText}
          label="Content"
          done={hasContent}
          state={contentState}
          isHalloween={isHalloween}
          onClick={hasContent ? onEditContent : onGenerateContent}
        />

        {/* Image Button */}
        <ActionIconButton
          icon={ImageIcon}
          label="Image"
          done={hasImage}
          state={imageState}
          isHalloween={isHalloween}
          disabled={!canGenerateImage && !hasImage}
          onClick={onGenerateImage}
        />

        {/* Audio Button */}
        <ActionIconButton
          icon={Volume2}
          label="Audio"
          done={hasAudio}
          state={audioState}
          isHalloween={isHalloween}
          disabled={!canGenerateAudio && !hasAudio}
          onClick={onGenerateAudio}
        />

        {/* Audio Playback Button - inline when audio exists */}
        {hasAudio && (
          <button
            onClick={onTogglePlayback}
            disabled={isLoadingAudio}
            className={cn(
              'flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all',
              'border-2 min-w-[72px]',
              isHalloween
                ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border-orange-500/30'
                : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/30'
            )}
            title={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {isLoadingAudio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide">
              {isPlaying ? 'Pause' : 'Play'}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
