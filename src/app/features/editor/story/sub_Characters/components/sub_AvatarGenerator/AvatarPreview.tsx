'use client'

import { Check, User, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Character } from '@/lib/types'

export interface GeneratedAvatar {
  url: string
  width: number
  height: number
  prompt?: string
}

interface CurrentAvatarProps {
  character: Character
  loading: boolean
  onRemoveAvatar: () => Promise<void>
}

export function CurrentAvatar({
  character,
  loading,
  onRemoveAvatar,
}: CurrentAvatarProps) {
  if (!character.avatarUrl) return null

  return (
    <div
      className="bg-card rounded-lg border-2 border-border p-4 halloween-bat-silhouette"
      data-testid="current-avatar-section"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Current Avatar</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemoveAvatar}
          disabled={loading}
          className="h-7 text-xs text-destructive hover:text-destructive"
          data-testid="remove-avatar-btn"
        >
          Remove
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-border">
          <img
            src={character.avatarUrl}
            alt={`${character.name} avatar`}
            className="w-full h-full object-cover"
            data-testid="current-avatar-img"
          />
        </div>
        {character.avatarPrompt && (
          <p className="text-xs text-muted-foreground italic flex-1 line-clamp-3">
            {character.avatarPrompt}
          </p>
        )}
      </div>
    </div>
  )
}

interface GeneratedAvatarsGridProps {
  generatedAvatars: GeneratedAvatar[]
  selectedAvatarIndex: number | null
  loading: boolean
  isSaving: boolean
  hasAvatar: boolean
  onSelectAvatar: (index: number) => void
  onClear: () => void
  onSetAvatar: () => void
}

export function GeneratedAvatarsGrid({
  generatedAvatars,
  selectedAvatarIndex,
  loading,
  isSaving,
  hasAvatar,
  onSelectAvatar,
  onClear,
  onSetAvatar,
}: GeneratedAvatarsGridProps) {
  if (generatedAvatars.length === 0) return null

  return (
    <div
      className="bg-card rounded-lg border-2 border-border p-4 space-y-4 halloween-bat-silhouette"
      data-testid="generated-avatars-grid"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Select an Avatar</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="h-7 text-xs"
          disabled={loading}
          data-testid="generate-new-avatars-btn"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Generate New
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {generatedAvatars.map((avatar, index) => (
          <button
            key={index}
            onClick={() => onSelectAvatar(index)}
            disabled={loading}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
              'hover:opacity-90 active:scale-[0.98]',
              selectedAvatarIndex === index
                ? 'border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                : 'border-border hover:border-border/80'
            )}
            data-testid={`avatar-option-${index}`}
          >
            <img
              src={avatar.url}
              alt={`Avatar option ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {selectedAvatarIndex === index && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Set Avatar Button */}
      {selectedAvatarIndex !== null && (
        <Button
          onClick={onSetAvatar}
          disabled={loading}
          className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          data-testid="set-avatar-btn"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <User className="w-4 h-4 mr-2" />
              {hasAvatar ? 'Replace Avatar' : 'Set as Avatar'}
            </>
          )}
        </Button>
      )}
    </div>
  )
}

interface GenerateButtonProps {
  loading: boolean
  isGenerating: boolean
  onGenerate: () => void
}

export function GenerateButton({
  loading,
  isGenerating,
  onGenerate,
}: GenerateButtonProps) {
  return (
    <Button
      onClick={onGenerate}
      disabled={loading}
      className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
      data-testid="generate-avatars-btn"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating 4 Avatars...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate 4 Avatar Variations
        </>
      )}
    </Button>
  )
}

interface ErrorMessageProps {
  error: string | null
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null

  return (
    <div
      className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-3"
      data-testid="avatar-error-message"
    >
      <p className="text-xs text-destructive">{error}</p>
    </div>
  )
}

interface EmptyStateProps {
  hasAvatar: boolean
  generatedAvatarsLength: number
}

export function EmptyState({ hasAvatar, generatedAvatarsLength }: EmptyStateProps) {
  if (hasAvatar || generatedAvatarsLength > 0) return null

  return (
    <div
      className="border-2 border-dashed border-border rounded-lg p-6 text-center"
      data-testid="avatar-empty-state"
    >
      <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
      <h3 className="text-sm font-semibold mb-1">No Avatar Yet</h3>
      <p className="text-xs text-muted-foreground">
        Choose a style above and generate avatar variations for your character
      </p>
    </div>
  )
}

interface CancelledPlaceholderProps {
  onRetry: () => void
  loading?: boolean
}

export function CancelledPlaceholder({ onRetry, loading = false }: CancelledPlaceholderProps) {
  return (
    <div
      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center bg-muted/30"
      data-testid="cancelled-placeholder"
    >
      <RefreshCw className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
      <h3 className="text-sm font-semibold mb-1 text-muted-foreground">Generation Cancelled</h3>
      <p className="text-xs text-muted-foreground mb-4">
        The previous image generation was cancelled. You can try again when ready.
      </p>
      <Button
        onClick={onRetry}
        disabled={loading}
        size="sm"
        variant="outline"
        className="border-2"
        data-testid="cancelled-retry-btn"
      >
        <RefreshCw className="w-3 h-3 mr-2" />
        Try Again
      </Button>
    </div>
  )
}
