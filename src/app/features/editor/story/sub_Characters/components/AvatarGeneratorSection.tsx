'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Sparkles,
  Loader2,
  Check,
  User,
  Image as ImageIcon,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Character } from '@/lib/types'
import { AVATAR_STYLES, composeAvatarPrompt } from '../lib/characterPromptComposer'

interface GeneratedImage {
  url: string
  width: number
  height: number
  prompt?: string
}

interface AvatarGeneratorSectionProps {
  character: Character
  storyStackId: string
  isSaving: boolean
  onSetAvatar: (avatarUrl: string, prompt: string) => Promise<void>
  onRemoveAvatar: () => Promise<void>
}

type AvatarStyle = 'pixel' | 'chibi' | 'portrait' | 'icon'

export function AvatarGeneratorSection({
  character,
  storyStackId,
  isSaving,
  onSetAvatar,
  onRemoveAvatar,
}: AvatarGeneratorSectionProps) {
  // Avatar style selection
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('pixel')

  // Reference image selection (from existing character images)
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState<number | null>(null)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAvatars, setGeneratedAvatars] = useState<GeneratedImage[]>([])
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasImages = character.imageUrls && character.imageUrls.length > 0
  const hasAvatar = !!character.avatarUrl
  const loading = isGenerating || isSaving

  // Compose the avatar prompt
  const avatarPrompt = useMemo(
    () => composeAvatarPrompt(character.name, character.appearance, selectedStyle),
    [character.name, character.appearance, selectedStyle]
  )

  const handleClear = () => {
    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)
    setError(null)
  }

  /**
   * Generate avatar variations
   */
  const handleGenerateAvatars = useCallback(async () => {
    setIsGenerating(true)
    setError(null)
    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)

    try {
      // Build the request with optional image reference
      const requestBody: Record<string, unknown> = {
        prompt: avatarPrompt,
        numImages: 1,
        width: 256,
        height: 256,
        provider: 'leonardo',
        model: 'phoenix_1.0',
      }

      // If user selected a reference image, include it
      // Note: This requires image service to support image references
      if (selectedReferenceIndex !== null && hasImages) {
        requestBody.referenceImages = [character.imageUrls[selectedReferenceIndex]]
      }

      // Generate 4 avatar variations
      const avatarPromises = Array.from({ length: 4 }).map(async (_, index) => {
        // Add slight variation to each prompt
        const variation = index === 0 ? '' : ` Variation ${index + 1}.`

        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...requestBody,
            prompt: avatarPrompt + variation,
          }),
        })

        if (!response.ok) {
          console.error(`Failed to generate avatar ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]

        if (image) {
          return {
            ...image,
            prompt: avatarPrompt + variation,
          } as GeneratedImage
        }
        return null
      })

      const results = await Promise.all(avatarPromises)
      const validAvatars = results.filter((a): a is GeneratedImage => a !== null)

      if (validAvatars.length === 0) {
        throw new Error('Failed to generate any avatars')
      }

      setGeneratedAvatars(validAvatars)
    } catch (err) {
      console.error('Error generating avatars:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate avatars')
    } finally {
      setIsGenerating(false)
    }
  }, [avatarPrompt, selectedReferenceIndex, hasImages, character.imageUrls])

  /**
   * Set the selected avatar as the character's avatar
   */
  const handleSetAvatar = useCallback(async () => {
    if (selectedAvatarIndex === null || !generatedAvatars[selectedAvatarIndex]) return

    const avatar = generatedAvatars[selectedAvatarIndex]
    await onSetAvatar(avatar.url, avatar.prompt || avatarPrompt)

    // Reset state
    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)
  }, [selectedAvatarIndex, generatedAvatars, avatarPrompt, onSetAvatar])

  return (
    <div className="space-y-4">
      {/* Current Avatar */}
      {hasAvatar && (
        <div className="bg-card rounded-lg border-2 border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Current Avatar</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemoveAvatar}
              disabled={loading}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-border">
              <img
                src={character.avatarUrl!}
                alt={`${character.name} avatar`}
                className="w-full h-full object-cover"
              />
            </div>
            {character.avatarPrompt && (
              <p className="text-xs text-muted-foreground italic flex-1 line-clamp-3">
                {character.avatarPrompt}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Avatar Style Selector */}
      {generatedAvatars.length === 0 && (
        <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
          <h3 className="text-sm font-semibold">Avatar Style</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AVATAR_STYLES.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id as AvatarStyle)}
                disabled={loading}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                  'hover:bg-muted active:scale-[0.98]',
                  selectedStyle === style.id
                    ? 'border-primary bg-primary/10 shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                    : 'border-border hover:border-border/80'
                )}
              >
                <span className="text-2xl">{style.icon}</span>
                <span className="text-xs font-medium">{style.label}</span>
                <span className="text-[10px] text-muted-foreground text-center">
                  {style.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reference Image Selector */}
      {generatedAvatars.length === 0 && hasImages && (
        <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Reference Image (Optional)</h3>
            {selectedReferenceIndex !== null && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedReferenceIndex(null)}
                className="h-7 text-xs"
                disabled={loading}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Select one of your character images to use as a reference for visual consistency.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {character.imageUrls.map((url, index) => (
              <button
                key={index}
                onClick={() => setSelectedReferenceIndex(index)}
                disabled={loading}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                  'hover:opacity-90 active:scale-[0.98]',
                  selectedReferenceIndex === index
                    ? 'border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                    : 'border-border hover:border-border/80'
                )}
              >
                <img
                  src={url}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedReferenceIndex === index && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No images warning */}
      {generatedAvatars.length === 0 && !hasImages && (
        <div className="bg-muted/50 rounded-lg border-2 border-border p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">No Character Images</p>
            <p className="text-xs text-muted-foreground mt-1">
              Generate character images first to use them as references for better avatar consistency.
              You can still generate avatars based on the character description.
            </p>
          </div>
        </div>
      )}

      {/* Prompt Preview */}
      {generatedAvatars.length === 0 && (
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Avatar Prompt
          </span>
          <p className="text-xs text-foreground line-clamp-3">{avatarPrompt}</p>
        </div>
      )}

      {/* Generate Button */}
      {generatedAvatars.length === 0 && (
        <Button
          onClick={handleGenerateAvatars}
          disabled={loading}
          className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
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
      )}

      {/* Error Message */}
      {error && (
        <div className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Generated Avatars Grid */}
      {generatedAvatars.length > 0 && (
        <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Select an Avatar</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="h-7 text-xs"
              disabled={loading}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Generate New
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {generatedAvatars.map((avatar, index) => (
              <button
                key={index}
                onClick={() => setSelectedAvatarIndex(index)}
                disabled={loading}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                  'hover:opacity-90 active:scale-[0.98]',
                  selectedAvatarIndex === index
                    ? 'border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                    : 'border-border hover:border-border/80'
                )}
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
              onClick={handleSetAvatar}
              disabled={loading}
              className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
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
      )}

      {/* Empty state */}
      {!hasAvatar && generatedAvatars.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">No Avatar Yet</h3>
          <p className="text-xs text-muted-foreground">
            Choose a style above and generate avatar variations for your character
          </p>
        </div>
      )}
    </div>
  )
}
