'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
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
  CancelledPlaceholder,
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

// Custom error for aborted requests
class AbortError extends Error {
  constructor(message = 'Request was cancelled') {
    super(message)
    this.name = 'AbortError'
  }
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

  // Cancellation state - AbortController for concurrent request management
  const [isCancelled, setIsCancelled] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Track request generation to discard stale responses
  const requestGenerationRef = useRef(0)

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Cancel any ongoing generation request
  const cancelGeneration = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    requestGenerationRef.current++

    setIsCancelled(true)
    setIsGenerating(false)
    setIsComposingPrompt(false)
    setError(null)
  }, [])

  // Debounce effect: Cancel ongoing generation when key inputs change during generation
  // This ensures rapid style/reference changes don't result in stale images
  const debouncedInputsRef = useRef({ selectedStyle, selectedReferenceIndex })
  useEffect(() => {
    const prevInputs = debouncedInputsRef.current
    const inputsChanged =
      prevInputs.selectedStyle !== selectedStyle ||
      prevInputs.selectedReferenceIndex !== selectedReferenceIndex

    // If inputs changed during an active generation, cancel it
    if (inputsChanged && isGenerating) {
      cancelGeneration()
    }

    debouncedInputsRef.current = { selectedStyle, selectedReferenceIndex }
  }, [selectedStyle, selectedReferenceIndex, isGenerating, cancelGeneration])

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
    // Cancel any ongoing request first
    cancelGeneration()

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
    setIsCancelled(false)
  }, [generationIds, cancelGeneration])

  /**
   * Compose avatar prompt using AI (Groq) to extract face features
   */
  const composeAvatarPromptWithAI = useCallback(async (signal?: AbortSignal): Promise<string> => {
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
        signal,
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
      // Re-throw abort errors so they can be handled by the caller
      if (err instanceof Error && err.name === 'AbortError') {
        throw err
      }
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
    // Cancel any previous generation request
    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Capture the current request generation for stale response detection
    const currentGeneration = ++requestGenerationRef.current

    // Cleanup any existing generations before starting new ones
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedAvatars([])
    setSelectedAvatarIndex(null)
    setGenerationIds([])
    setIsCancelled(false)

    try {
      // Check if request was aborted before starting
      if (abortController.signal.aborted) {
        throw new AbortError()
      }

      // First, compose the prompt using AI to extract face features
      const aiComposedPrompt = await composeAvatarPromptWithAI(abortController.signal)

      // Check for abort and stale response after prompt composition
      if (abortController.signal.aborted || requestGenerationRef.current !== currentGeneration) {
        throw new AbortError()
      }

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
        // Check abort before each individual image request
        if (abortController.signal.aborted) {
          return null
        }

        const variation = index === 0 ? '' : ` Variation ${index + 1}.`

        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...requestBody,
            prompt: aiComposedPrompt + variation,
          }),
          signal: abortController.signal,
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

      // Final check for abort and stale response before updating state
      if (abortController.signal.aborted || requestGenerationRef.current !== currentGeneration) {
        throw new AbortError()
      }

      const validAvatars = results.filter((a): a is TrackedAvatar => a !== null)

      if (validAvatars.length === 0) {
        throw new Error('Failed to generate any avatars')
      }

      // Store generation IDs for later cleanup
      setGenerationIds(newGenerationIds)

      setGeneratedAvatars(validAvatars)
    } catch (err) {
      // Handle abort errors gracefully - don't show error to user
      if (err instanceof AbortError || (err instanceof Error && err.name === 'AbortError')) {
        console.log('Avatar generation was cancelled')
        setIsCancelled(true)
        return
      }
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

      {/* Cancelled Placeholder */}
      {isCancelled && generatedAvatars.length === 0 && (
        <CancelledPlaceholder
          onRetry={handleGenerateAvatars}
          loading={loading}
        />
      )}

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
