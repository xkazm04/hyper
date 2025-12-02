'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { Character } from '@/lib/types'
import {
  CharacterDimension,
  CharacterPromptOption,
  composeCharacterPrompt,
  composeCharacterPromptWithAIResult,
} from '../../lib/characterPromptComposer'
import { SKETCH_QUALITY_PRESETS, FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { SelectionState, GeneratedImage } from './index'
import { deleteGenerations } from '@/lib/services/sketchCleanup'

interface UseImageGeneratorProps {
  character: Character
  isSaving: boolean
  onAddImage: (imageUrl: string, prompt: string) => Promise<void>
  storyArtStyle?: string // Story art style prompt from stack configuration (FR-3.1, FR-3.3)
}

// Custom error for aborted requests
class AbortError extends Error {
  constructor(message = 'Request was cancelled') {
    super(message)
    this.name = 'AbortError'
  }
}

export interface ImageGeneratorState {
  selections: SelectionState
  expandedColumn: CharacterDimension | null
  sketches: GeneratedImage[]
  isGeneratingSketches: boolean
  selectedSketchIndex: number | null
  isGeneratingFinal: boolean
  finalImage: GeneratedImage | null
  error: string | null
  finalPrompt: string
  hasSelections: boolean
  loading: boolean
  currentImageCount: number
  canAddMore: boolean
  canGenerate: boolean // True if we have enough data to generate (character data or art style)
  // AI composition state (FR-3.2, Task 10.1, 10.2)
  isComposingPrompt: boolean
  composedPrompt: string | null
  compositionError: string | null
  usedFallbackPrompt: boolean
  // Cancellation state
  isCancelled: boolean
}

export interface ImageGeneratorActions {
  handleSelect: (dimension: CharacterDimension, option: CharacterPromptOption) => void
  handleClear: () => void
  toggleColumn: (columnId: CharacterDimension) => void
  handleGenerateSketches: () => Promise<void>
  handleGenerateFinal: () => Promise<void>
  handleAddToCharacter: () => Promise<void>
  handleUseSketch: () => Promise<void>
  setSelectedSketchIndex: (index: number | null) => void
  setFinalImage: (image: GeneratedImage | null) => void
  cancelGeneration: () => void
}


export function useImageGenerator({
  character,
  isSaving,
  onAddImage,
  storyArtStyle,
}: UseImageGeneratorProps): ImageGeneratorState & ImageGeneratorActions {
  // Prompt building state
  const [selections, setSelections] = useState<SelectionState>({})
  const [expandedColumn, setExpandedColumn] = useState<CharacterDimension | null>('archetype')

  // Sketch generation state
  const [sketches, setSketches] = useState<GeneratedImage[]>([])
  const [isGeneratingSketches, setIsGeneratingSketches] = useState(false)
  const [selectedSketchIndex, setSelectedSketchIndex] = useState<number | null>(null)

  // Final generation state
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
  const [finalImage, setFinalImage] = useState<GeneratedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Generation tracking for cleanup (FR-2.1)
  const [generationIds, setGenerationIds] = useState<string[]>([])

  // AI composition state (FR-3.2, Task 10.1, 10.2)
  const [isComposingPrompt, setIsComposingPrompt] = useState(false)
  const [composedPrompt, setComposedPrompt] = useState<string | null>(null)
  const [compositionError, setCompositionError] = useState<string | null>(null)
  const [usedFallbackPrompt, setUsedFallbackPrompt] = useState(false)

  // Cancellation state - AbortController for concurrent request management
  const [isCancelled, setIsCancelled] = useState(false)
  const sketchAbortControllerRef = useRef<AbortController | null>(null)
  const finalAbortControllerRef = useRef<AbortController | null>(null)
  // Track request generation to discard stale responses
  const requestGenerationRef = useRef(0)

  // Cleanup AbortControllers on unmount
  useEffect(() => {
    return () => {
      sketchAbortControllerRef.current?.abort()
      finalAbortControllerRef.current?.abort()
    }
  }, [])

  // Debounce effect: Cancel ongoing sketch generation when prompt-affecting inputs change
  // This ensures rapid selection changes don't result in stale images
  const selectionsJsonRef = useRef(JSON.stringify(selections))
  useEffect(() => {
    const currentSelectionsJson = JSON.stringify(selections)
    const selectionsChanged = selectionsJsonRef.current !== currentSelectionsJson

    // If selections changed during an active sketch generation, cancel it
    if (selectionsChanged && isGeneratingSketches) {
      sketchAbortControllerRef.current?.abort()
      sketchAbortControllerRef.current = null
      requestGenerationRef.current++
      setIsCancelled(true)
      setIsGeneratingSketches(false)
      setIsComposingPrompt(false)
    }

    selectionsJsonRef.current = currentSelectionsJson
  }, [selections, isGeneratingSketches])

  // Compose the prompt from selections (includes art style for preview display)
  const finalPrompt = useMemo(
    () => composeCharacterPrompt(selections, character.name, character.appearance, storyArtStyle),
    [selections, character.name, character.appearance, storyArtStyle]
  )

  const hasSelections = Object.values(selections).some(Boolean)
  // Character can generate images if we have character data (name/appearance) or story art style
  // Selections are optional enhancements, not requirements
  const hasCharacterData = !!(character.name || character.appearance || storyArtStyle)
  const canGenerate = hasCharacterData // Enable generation with just character data, no selections required
  const loading = isGeneratingSketches || isGeneratingFinal || isSaving
  const currentImageCount = character.imageUrls?.length || 0
  // Support up to 10 images for Bria AI training (was 4)
  const canAddMore = currentImageCount < 10

  const handleSelect = useCallback((dimension: CharacterDimension, option: CharacterPromptOption) => {
    setSelections((prev) => {
      const isSelected = prev[dimension]?.id === option.id
      return isSelected
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: option }
    })
  }, [])

  // Cancel all ongoing generation requests
  const cancelGeneration = useCallback(() => {
    // Abort any ongoing requests
    sketchAbortControllerRef.current?.abort()
    finalAbortControllerRef.current?.abort()
    sketchAbortControllerRef.current = null
    finalAbortControllerRef.current = null

    // Increment request generation to invalidate any pending responses
    requestGenerationRef.current++

    setIsCancelled(true)
    setIsGeneratingSketches(false)
    setIsGeneratingFinal(false)
    setIsComposingPrompt(false)
    setError(null)
  }, [])

  const handleClear = useCallback(() => {
    // Cancel any ongoing requests first
    cancelGeneration()

    // Cleanup existing sketches before clearing state (FR-2.2)
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }

    setSelections({})
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)
    setError(null)
    setGenerationIds([])
    setIsCancelled(false)
    // Clear composition state (Task 10.1, 10.2)
    setComposedPrompt(null)
    setCompositionError(null)
    setUsedFallbackPrompt(false)
  }, [generationIds, cancelGeneration])

  const toggleColumn = useCallback((columnId: CharacterDimension) => {
    setExpandedColumn((prev) => (prev === columnId ? null : columnId))
  }, [])


  const handleGenerateSketches = useCallback(async () => {
    if (!finalPrompt) return

    // Cancel any previous sketch generation request
    sketchAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    sketchAbortControllerRef.current = abortController

    // Capture the current request generation for stale response detection
    const currentGeneration = ++requestGenerationRef.current

    setIsGeneratingSketches(true)
    setError(null)
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)
    setCompositionError(null)
    setUsedFallbackPrompt(false)
    setIsCancelled(false)

    try {
      // Check if request was aborted before starting
      if (abortController.signal.aborted) {
        throw new AbortError()
      }

      // Use AI-composed prompt if story art style is available (FR-3.2, FR-3.3, NFR-3)
      // Falls back to simple composition if art style unavailable or API fails
      setIsComposingPrompt(true)

      // Use the result-based function to get detailed composition info (Task 10.2)
      const compositionResult = await composeCharacterPromptWithAIResult({
        characterName: character.name,
        characterAppearance: character.appearance,
        selections,
        storyArtStyle,
      })

      // Check for abort and stale response after async operation
      if (abortController.signal.aborted || requestGenerationRef.current !== currentGeneration) {
        throw new AbortError()
      }

      const aiComposedPrompt = compositionResult.prompt
      setComposedPrompt(aiComposedPrompt)
      setUsedFallbackPrompt(compositionResult.usedFallback)

      // Show user-friendly error message if fallback was used (Task 10.2, NFR-2)
      if (compositionResult.error) {
        setCompositionError(compositionResult.error)
      }

      setIsComposingPrompt(false)

      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiComposedPrompt, count: 4 }),
        signal: abortController.signal,
      })

      if (!variationResponse.ok) {
        throw new Error('Failed to generate prompt variations')
      }

      const { variations } = await variationResponse.json()

      // Check for abort and stale response after fetching variations
      if (abortController.signal.aborted || requestGenerationRef.current !== currentGeneration) {
        throw new AbortError()
      }

      const sketchPreset = SKETCH_QUALITY_PRESETS.quick

      const sketchPromises = variations.map(async (variation: { variation: string }, index: number) => {
        // Check abort before each individual image request
        if (abortController.signal.aborted) {
          return null
        }

        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: variation.variation,
            numImages: 1,
            width: sketchPreset.width,
            height: sketchPreset.height,
            provider: 'leonardo',
            model: 'phoenix_1.0',
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          console.error(`Failed to generate sketch ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]
        return image ? {
          ...image,
          prompt: variation.variation,
          generationId: data.generationId,
          imageId: image.id,
        } as GeneratedImage : null
      })

      const results = await Promise.all(sketchPromises)

      // Final check for abort and stale response before updating state
      if (abortController.signal.aborted || requestGenerationRef.current !== currentGeneration) {
        throw new AbortError()
      }

      const validSketches = results.filter((s): s is GeneratedImage => s !== null)

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any sketches')
      }

      // Extract and store generationIds for later cleanup (FR-2.1)
      const ids = validSketches
        .map(s => s.generationId)
        .filter((id): id is string => !!id)
      setGenerationIds(ids)

      setSketches(validSketches)
    } catch (err) {
      // Handle abort errors gracefully - don't show error to user
      if (err instanceof AbortError || (err instanceof Error && err.name === 'AbortError')) {
        console.log('Sketch generation was cancelled')
        setIsCancelled(true)
        return
      }
      console.error('Error generating sketches:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate sketches')
    } finally {
      setIsGeneratingSketches(false)
      setIsComposingPrompt(false)
    }
  }, [finalPrompt, character.name, character.appearance, selections, storyArtStyle])


  const handleGenerateFinal = useCallback(async () => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return

    const selectedSketch = sketches[selectedSketchIndex]
    if (!selectedSketch.prompt) return

    // Cancel any previous final generation request
    finalAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    finalAbortControllerRef.current = abortController

    // Capture the current request generation for stale response detection
    const currentGeneration = ++requestGenerationRef.current

    setIsGeneratingFinal(true)
    setError(null)
    setFinalImage(null)
    setIsCancelled(false)

    try {
      // Check if request was aborted before starting
      if (abortController.signal.aborted) {
        throw new AbortError()
      }

      const qualityPreset = FINAL_QUALITY_PRESETS.high

      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedSketch.prompt,
          numImages: 1,
          width: qualityPreset.width,
          height: qualityPreset.height,
          provider: 'leonardo',
          model: 'flux_2',
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to generate final image')
      }

      const data = await response.json()

      // Check for abort and stale response before updating state
      if (abortController.signal.aborted || requestGenerationRef.current !== currentGeneration) {
        throw new AbortError()
      }

      const image = data.images?.[0]

      if (image) {
        setFinalImage({
          ...image,
          prompt: selectedSketch.prompt,
          generationId: data.generationId,
          imageId: image.id,
        })
      } else {
        throw new Error('No image generated')
      }
    } catch (err) {
      // Handle abort errors gracefully - don't show error to user
      if (err instanceof AbortError || (err instanceof Error && err.name === 'AbortError')) {
        console.log('Final image generation was cancelled')
        setIsCancelled(true)
        return
      }
      console.error('Error generating final image:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate final image')
    } finally {
      setIsGeneratingFinal(false)
    }
  }, [selectedSketchIndex, sketches])

  const handleAddToCharacter = useCallback(async () => {
    if (!finalImage || !finalImage.prompt) return

    await onAddImage(finalImage.url, finalImage.prompt)

    // Cleanup all sketches after successful save (FR-2.1)
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }

    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)
    setSelections({})
    setGenerationIds([])
  }, [finalImage, onAddImage, generationIds])

  const handleUseSketch = useCallback(async () => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return

    const sketch = sketches[selectedSketchIndex]
    await onAddImage(sketch.url, sketch.prompt || finalPrompt)

    // Delete unused sketches - filter out the selected sketch's generationId (FR-2.3)
    const selectedGenerationId = sketch.generationId
    const unusedGenerationIds = generationIds.filter(id => id !== selectedGenerationId)
    if (unusedGenerationIds.length > 0) {
      deleteGenerations(unusedGenerationIds)
    }

    setSketches([])
    setSelectedSketchIndex(null)
    setSelections({})
    setGenerationIds([])
  }, [selectedSketchIndex, sketches, finalPrompt, onAddImage, generationIds])

  return {
    selections, expandedColumn, sketches, isGeneratingSketches, selectedSketchIndex,
    isGeneratingFinal, finalImage, error, finalPrompt, hasSelections, loading,
    currentImageCount, canAddMore, canGenerate, handleSelect, handleClear, toggleColumn,
    handleGenerateSketches, handleGenerateFinal, handleAddToCharacter, handleUseSketch,
    setSelectedSketchIndex, setFinalImage, cancelGeneration,
    // AI composition state (FR-3.2, Task 10.1, 10.2)
    isComposingPrompt, composedPrompt, compositionError, usedFallbackPrompt,
    // Cancellation state
    isCancelled,
  }
}
