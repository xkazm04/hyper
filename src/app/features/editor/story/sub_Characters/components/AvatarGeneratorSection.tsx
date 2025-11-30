'use client'

import { useState, useMemo, useCallback } from 'react'
import { Character } from '@/lib/types'
import { useEditor } from '@/contexts/EditorContext'
import { getEffectiveArtStylePrompt } from '../../sub_Story/lib/artStyleService'
import { composeAvatarPrompt } from '../lib/characterPromptComposer'
import { deleteGenerations } from '@/lib/services/sketchCleanup'
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

// Extended GeneratedAvatar with generation tracking
interface TrackedAvatar extends GeneratedAvatar {
  generationId?: string
}

// Response from the compose-avatar-prompt API
interface ComposeAvatarPromptResponse {
  success: boolean
  prompt: string
  truncated: boolean
  error?: string
}

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
  // Get story art style from EditorContext
  const { storyStack } = useEditor()
  const storyArtStyle = storyStack ? getEffectiveArtStylePrompt(storyStack) : undefined

  // Avatar style selection
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>('rpg')

  // Reference image selection (from existing character images)
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState<number | null>(null)

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [isComposingPrompt, setIsComposingPrompt] = useState(false)
  const [generatedAvatars, setGeneratedAvatars] = useState<TrackedAvatar[]>([])
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // AI-composed prompt state
  const [composedPrompt, setComposedPrompt] = useState<string | null>(null)
  const [usedFallback, setUsedFallback] = useState(false)

  // Track generation IDs for cleanup
  const [generationIds, setGenerationIds] = useState<string[]>([])

  const hasImages = character.imageUrls && character.imageUrls.length > 0
  const hasAvatar = !!character.avatarUrl
  const loading = isGenerating || isSaving || isComposingPrompt

  // Compose the fallback avatar prompt (for preview before AI composition)
  const fallbackPrompt = useMemo(
    () => composeAvatarPrompt(character.name, character.appearance, selectedStyle, storyArtStyle),
    [character.name, character.appearance, selectedStyle, storyArtStyle]
  )
  
  // Display prompt: show AI-composed if available, otherwise fallback
  const displayPrompt = composedPrompt || fallbackPrompt

  const handleClear = useCallback(() => {
    // Cleanup existing avatars before clearing state
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }
    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)
    setError(null)
    setGenerationIds([])
    setComposedPrompt(null)
    setUsedFallback(false)
  }, [generationIds])

  /**
   * Compose avatar prompt using AI (Groq) to extract face features
   */
  const composeAvatarPromptWithAI = useCallback(async (): Promise<string> => {
    setIsComposingPrompt(true)
    
    try {
      const response = await fetch('/api/ai/compose-avatar-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterName: character.name,
          characterAppearance: character.appearance,
          avatarStyle: selectedStyle,
          storyArtStyle,
          maxLength: 1600,
        }),
      })

      if (!response.ok) {
        console.error('AI avatar prompt composition failed:', response.status)
        setUsedFallback(true)
        return fallbackPrompt
      }

      const data: ComposeAvatarPromptResponse = await response.json()

      if (!data.success || !data.prompt) {
        console.error('AI avatar prompt composition unsuccessful:', data.error)
        setUsedFallback(true)
        return fallbackPrompt
      }

      setUsedFallback(false)
      setComposedPrompt(data.prompt)
      return data.prompt
    } catch (err) {
      console.error('Error composing avatar prompt with AI:', err)
      setUsedFallback(true)
      return fallbackPrompt
    } finally {
      setIsComposingPrompt(false)
    }
  }, [character.name, character.appearance, selectedStyle, storyArtStyle, fallbackPrompt])

  /**
   * Generate avatar variations using AI-composed prompt
   */
  const handleGenerateAvatars = useCallback(async () => {
    // Cleanup any existing generations before starting new ones
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }
    
    setIsGenerating(true)
    setError(null)
    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)
    setGenerationIds([])

    try {
      // First, compose the prompt using AI to extract face features
      const aiComposedPrompt = await composeAvatarPromptWithAI()
      
      const requestBody: Record<string, unknown> = {
        prompt: aiComposedPrompt,
        numImages: 1,
        width: 512,  // Square 1:1 ratio for avatars
        height: 512,
        provider: 'leonardo',
        model: 'phoenix_1.0',
      }

      if (selectedReferenceIndex !== null && hasImages) {
        requestBody.referenceImages = [character.imageUrls[selectedReferenceIndex]]
      }

      const newGenerationIds: string[] = []
      
      const avatarPromises = Array.from({ length: 4 }).map(async (_, index) => {
        const variation = index === 0 ? '' : ` Variation ${index + 1}.`

        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...requestBody,
            prompt: aiComposedPrompt + variation,
          }),
        })

        if (!response.ok) {
          console.error(`Failed to generate avatar ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]

        if (image) {
          // Track generation ID for cleanup
          if (data.generationId) {
            newGenerationIds.push(data.generationId)
          }
          return {
            ...image,
            prompt: aiComposedPrompt + variation,
            generationId: data.generationId,
          } as TrackedAvatar
        }
        return null
      })

      const results = await Promise.all(avatarPromises)
      const validAvatars = results.filter((a): a is TrackedAvatar => a !== null)

      if (validAvatars.length === 0) {
        throw new Error('Failed to generate any avatars')
      }
      
      // Store generation IDs for later cleanup
      setGenerationIds(newGenerationIds)

      setGeneratedAvatars(validAvatars)
    } catch (err) {
      console.error('Error generating avatars:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate avatars')
    } finally {
      setIsGenerating(false)
    }
  }, [composeAvatarPromptWithAI, selectedReferenceIndex, hasImages, character.imageUrls, generationIds])

  /**
   * Set the selected avatar as the character's avatar
   * Deletes unused avatar generations from Leonardo
   */
  const handleSetAvatar = useCallback(async () => {
    if (selectedAvatarIndex === null || !generatedAvatars[selectedAvatarIndex]) return

    const selectedAvatar = generatedAvatars[selectedAvatarIndex]
    
    // Delete unused avatar generations (all except the selected one)
    const unusedGenerationIds = generationIds.filter(
      id => id !== selectedAvatar.generationId
    )
    if (unusedGenerationIds.length > 0) {
      deleteGenerations(unusedGenerationIds)
    }

    await onSetAvatar(selectedAvatar.url, selectedAvatar.prompt || displayPrompt)

    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)
    setGenerationIds([])
  }, [selectedAvatarIndex, generatedAvatars, displayPrompt, onSetAvatar, generationIds])

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
          hasStoryArtStyle={!!storyArtStyle}
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
        <PromptPreview 
          avatarPrompt={displayPrompt}
          isAIComposed={!!composedPrompt}
          isComposing={isComposingPrompt}
          usedFallback={usedFallback}
        />
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
