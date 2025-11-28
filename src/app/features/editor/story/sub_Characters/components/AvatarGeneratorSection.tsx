'use client'

import { useState, useMemo, useCallback } from 'react'
import { Character } from '@/lib/types'
import { composeAvatarPrompt } from '../lib/characterPromptComposer'
import {
  AvatarStyleSelector,
  AvatarStyle,
  ReferenceImageSelector,
  NoImagesWarning,
  PromptPreview,
  CurrentAvatar,
  GeneratedAvatarsGrid,
  GenerateButton,
  ErrorMessage,
  EmptyState,
  GeneratedAvatar,
} from './sub_AvatarGenerator'

interface AvatarGeneratorSectionProps {
  character: Character
  storyStackId: string
  isSaving: boolean
  onSetAvatar: (avatarUrl: string, prompt: string) => Promise<void>
  onRemoveAvatar: () => Promise<void>
}

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
  const [generatedAvatars, setGeneratedAvatars] = useState<GeneratedAvatar[]>([])
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
      const requestBody: Record<string, unknown> = {
        prompt: avatarPrompt,
        numImages: 1,
        width: 256,
        height: 256,
        provider: 'leonardo',
        model: 'phoenix_1.0',
      }

      if (selectedReferenceIndex !== null && hasImages) {
        requestBody.referenceImages = [character.imageUrls[selectedReferenceIndex]]
      }

      const avatarPromises = Array.from({ length: 4 }).map(async (_, index) => {
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
          } as GeneratedAvatar
        }
        return null
      })

      const results = await Promise.all(avatarPromises)
      const validAvatars = results.filter((a): a is GeneratedAvatar => a !== null)

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

    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)
  }, [selectedAvatarIndex, generatedAvatars, avatarPrompt, onSetAvatar])

  return (
    <div className="space-y-4">
      {/* Current Avatar */}
      <CurrentAvatar
        character={character}
        loading={loading}
        onRemoveAvatar={onRemoveAvatar}
      />

      {/* Avatar Style Selector */}
      {generatedAvatars.length === 0 && (
        <AvatarStyleSelector
          selectedStyle={selectedStyle}
          loading={loading}
          onSelectStyle={setSelectedStyle}
        />
      )}

      {/* Reference Image Selector */}
      {generatedAvatars.length === 0 && (
        <ReferenceImageSelector
          character={character}
          selectedReferenceIndex={selectedReferenceIndex}
          loading={loading}
          onSelectReference={setSelectedReferenceIndex}
        />
      )}

      {/* No images warning */}
      {generatedAvatars.length === 0 && (
        <NoImagesWarning hasImages={hasImages} />
      )}

      {/* Prompt Preview */}
      {generatedAvatars.length === 0 && (
        <PromptPreview avatarPrompt={avatarPrompt} />
      )}

      {/* Generate Button */}
      {generatedAvatars.length === 0 && (
        <GenerateButton
          loading={loading}
          isGenerating={isGenerating}
          onGenerate={handleGenerateAvatars}
        />
      )}

      {/* Error Message */}
      <ErrorMessage error={error} />

      {/* Generated Avatars Grid */}
      <GeneratedAvatarsGrid
        generatedAvatars={generatedAvatars}
        selectedAvatarIndex={selectedAvatarIndex}
        loading={loading}
        isSaving={isSaving}
        hasAvatar={hasAvatar}
        onSelectAvatar={setSelectedAvatarIndex}
        onClear={handleClear}
        onSetAvatar={handleSetAvatar}
      />

      {/* Empty state */}
      <EmptyState hasAvatar={hasAvatar} generatedAvatarsLength={generatedAvatars.length} />
    </div>
  )
}
