'use client'

import { useState, useMemo, useCallback } from 'react'
import { Character } from '@/lib/types'
import {
  CharacterDimension,
  CharacterPromptOption,
  composeCharacterPrompt,
} from '../../lib/characterPromptComposer'
import { SKETCH_QUALITY_PRESETS, FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { SelectionState, GeneratedImage } from './index'

interface UseImageGeneratorProps {
  character: Character
  isSaving: boolean
  onAddImage: (imageUrl: string, prompt: string) => Promise<void>
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
}


export function useImageGenerator({
  character,
  isSaving,
  onAddImage,
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

  // Compose the prompt from selections
  const finalPrompt = useMemo(
    () => composeCharacterPrompt(selections, character.name, character.appearance),
    [selections, character.name, character.appearance]
  )

  const hasSelections = Object.values(selections).some(Boolean)
  const loading = isGeneratingSketches || isGeneratingFinal || isSaving
  const currentImageCount = character.imageUrls?.length || 0
  const canAddMore = currentImageCount < 4

  const handleSelect = useCallback((dimension: CharacterDimension, option: CharacterPromptOption) => {
    setSelections((prev) => {
      const isSelected = prev[dimension]?.id === option.id
      return isSelected
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: option }
    })
  }, [])

  const handleClear = useCallback(() => {
    setSelections({})
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)
    setError(null)
  }, [])

  const toggleColumn = useCallback((columnId: CharacterDimension) => {
    setExpandedColumn((prev) => (prev === columnId ? null : columnId))
  }, [])


  const handleGenerateSketches = useCallback(async () => {
    if (!finalPrompt) return

    setIsGeneratingSketches(true)
    setError(null)
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)

    try {
      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt, count: 4 }),
      })

      if (!variationResponse.ok) {
        throw new Error('Failed to generate prompt variations')
      }

      const { variations } = await variationResponse.json()
      const sketchPreset = SKETCH_QUALITY_PRESETS.quick

      const sketchPromises = variations.map(async (variation: { variation: string }, index: number) => {
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
        })

        if (!response.ok) {
          console.error(`Failed to generate sketch ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]
        return image ? { ...image, prompt: variation.variation } as GeneratedImage : null
      })

      const results = await Promise.all(sketchPromises)
      const validSketches = results.filter((s): s is GeneratedImage => s !== null)

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any sketches')
      }

      setSketches(validSketches)
    } catch (err) {
      console.error('Error generating sketches:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate sketches')
    } finally {
      setIsGeneratingSketches(false)
    }
  }, [finalPrompt])


  const handleGenerateFinal = useCallback(async () => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return

    const selectedSketch = sketches[selectedSketchIndex]
    if (!selectedSketch.prompt) return

    setIsGeneratingFinal(true)
    setError(null)
    setFinalImage(null)

    try {
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
      })

      if (!response.ok) {
        throw new Error('Failed to generate final image')
      }

      const data = await response.json()
      const image = data.images?.[0]

      if (image) {
        setFinalImage({ ...image, prompt: selectedSketch.prompt })
      } else {
        throw new Error('No image generated')
      }
    } catch (err) {
      console.error('Error generating final image:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate final image')
    } finally {
      setIsGeneratingFinal(false)
    }
  }, [selectedSketchIndex, sketches])

  const handleAddToCharacter = useCallback(async () => {
    if (!finalImage || !finalImage.prompt) return

    await onAddImage(finalImage.url, finalImage.prompt)

    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)
    setSelections({})
  }, [finalImage, onAddImage])

  const handleUseSketch = useCallback(async () => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return

    const sketch = sketches[selectedSketchIndex]
    await onAddImage(sketch.url, sketch.prompt || finalPrompt)

    setSketches([])
    setSelectedSketchIndex(null)
    setSelections({})
  }, [selectedSketchIndex, sketches, finalPrompt, onAddImage])

  return {
    selections, expandedColumn, sketches, isGeneratingSketches, selectedSketchIndex,
    isGeneratingFinal, finalImage, error, finalPrompt, hasSelections, loading,
    currentImageCount, canAddMore, handleSelect, handleClear, toggleColumn,
    handleGenerateSketches, handleGenerateFinal, handleAddToCharacter, handleUseSketch,
    setSelectedSketchIndex, setFinalImage,
  }
}
