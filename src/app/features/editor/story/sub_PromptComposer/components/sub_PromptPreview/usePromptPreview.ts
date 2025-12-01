'use client'

import { useState, useCallback } from 'react'
import { SKETCH_QUALITY_PRESETS, FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { deleteGenerations } from '@/lib/services/sketchCleanup'
import type { SketchModel, FinalModel, LeonardoModel } from '../ModelSelector'
import type { GeneratedImage, PromptVariation, PromptPreviewState } from './types'

/**
 * Hook for managing PromptPreview state and actions
 */
export function usePromptPreview(
  prompt: string,
  externalLoading: boolean,
  onImageSelect?: (imageUrl: string, prompt: string) => void
): PromptPreviewState {
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [sketchModel, setSketchModel] = useState<SketchModel>('phoenix_1.0')
  const [finalModel, setFinalModel] = useState<FinalModel>('flux_2')
  const [sketchModelExpanded, setSketchModelExpanded] = useState(false)
  const [finalModelExpanded, setFinalModelExpanded] = useState(false)
  const [sketchCount, setSketchCount] = useState(4)
  const [sketches, setSketches] = useState<GeneratedImage[]>([])
  const [isGeneratingSketches, setIsGeneratingSketches] = useState(false)
  const [selectedSketchIndex, setSelectedSketchIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
  const [finalImage, setFinalImage] = useState<GeneratedImage | null>(null)
  const [finalQuality, setFinalQuality] = useState<'high' | 'premium'>('high')
  const [generationIds, setGenerationIds] = useState<string[]>([])

  const loading = externalLoading || isGeneratingSketches || isGeneratingFinal
  const showSketchControls = sketches.length === 0 && !finalImage

  const handleGenerateSketches = useCallback(async () => {
    if (!prompt) return
    setIsGeneratingSketches(true)
    setError(null)
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)

    try {
      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count: sketchCount }),
      })

      if (!variationResponse.ok) {
        const errorData = await variationResponse.json()
        throw new Error(errorData.error || 'Failed to generate prompt variations')
      }

      const variationData = await variationResponse.json()
      const variations: PromptVariation[] = variationData.variations
      const sketchPreset = SKETCH_QUALITY_PRESETS.quick

      const sketchPromises = variations.map(async (variation, index) => {
        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: variation.variation,
            numImages: 1,
            width: sketchPreset.width,
            height: sketchPreset.height,
            provider: 'leonardo',
            model: sketchModel,
          }),
        })

        if (!response.ok) {
          console.error(`Failed to generate sketch ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]

        return image
          ? ({
              ...image,
              prompt: variation.variation,
              variationIndex: index,
              generationId: data.generationId,
              imageId: image.id,
            } as GeneratedImage)
          : null
      })

      const results = await Promise.all(sketchPromises)
      const validSketches = results.filter((s): s is GeneratedImage => s !== null)

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any sketches')
      }

      setSketches(validSketches)
      const ids = validSketches.map((s) => s.generationId).filter((id): id is string => !!id)
      setGenerationIds(ids)
    } catch (err) {
      console.error('Error generating sketches:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate sketches')
    } finally {
      setIsGeneratingSketches(false)
    }
  }, [prompt, sketchCount, sketchModel])

  const handleGenerateFinal = useCallback(async () => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return
    const selectedSketch = sketches[selectedSketchIndex]
    if (!selectedSketch.prompt) return

    setIsGeneratingFinal(true)
    setError(null)
    setFinalImage(null)

    try {
      const qualityPreset = FINAL_QUALITY_PRESETS[finalQuality]
      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedSketch.prompt,
          numImages: 1,
          width: qualityPreset.width,
          height: qualityPreset.height,
          provider: 'leonardo',
          model: finalModel,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate final image')
      }

      const data = await response.json()
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
      console.error('Error generating final image:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate final image')
    } finally {
      setIsGeneratingFinal(false)
    }
  }, [selectedSketchIndex, sketches, finalQuality, finalModel])

  const handleConfirmFinal = useCallback(() => {
    if (finalImage && finalImage.prompt) {
      onImageSelect?.(finalImage.url, finalImage.prompt)
      if (generationIds.length > 0) {
        deleteGenerations(generationIds)
      }
      setSketches([])
      setSelectedSketchIndex(null)
      setFinalImage(null)
      setGenerationIds([])
    }
  }, [finalImage, onImageSelect, generationIds])

  const handleUseSketch = useCallback(() => {
    if (selectedSketchIndex !== null && sketches[selectedSketchIndex]) {
      const sketch = sketches[selectedSketchIndex]
      onImageSelect?.(sketch.url, sketch.prompt || prompt)
      const selectedGenerationId = sketch.generationId
      const unusedGenerationIds = generationIds.filter((id) => id !== selectedGenerationId)
      if (unusedGenerationIds.length > 0) {
        deleteGenerations(unusedGenerationIds)
      }
      setSketches([])
      setSelectedSketchIndex(null)
      setFinalImage(null)
      setGenerationIds([])
    }
  }, [selectedSketchIndex, sketches, prompt, onImageSelect, generationIds])

  const handleStartOver = useCallback(() => {
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }
    setSketches([])
    setSelectedSketchIndex(null)
    setGenerationIds([])
  }, [generationIds])

  const handleBackToSketches = useCallback(() => {
    setFinalImage(null)
    setSelectedSketchIndex(null)
  }, [])

  const togglePromptExpanded = useCallback(() => setIsPromptExpanded((p) => !p), [])
  const toggleSketchModelExpanded = useCallback(() => setSketchModelExpanded((p) => !p), [])
  const toggleFinalModelExpanded = useCallback(() => setFinalModelExpanded((p) => !p), [])

  return {
    isPromptExpanded,
    sketchModel,
    finalModel,
    sketchModelExpanded,
    finalModelExpanded,
    sketchCount,
    sketches,
    isGeneratingSketches,
    selectedSketchIndex,
    error,
    isGeneratingFinal,
    finalImage,
    finalQuality,
    loading,
    showSketchControls,
    setSketchModel: setSketchModel as (model: LeonardoModel) => void,
    setFinalModel: setFinalModel as (model: LeonardoModel) => void,
    setSketchCount,
    setSelectedSketchIndex,
    setFinalQuality,
    handleGenerateSketches,
    handleGenerateFinal,
    handleConfirmFinal,
    handleUseSketch,
    handleStartOver,
    handleBackToSketches,
    togglePromptExpanded,
    toggleSketchModelExpanded,
    toggleFinalModelExpanded,
  }
}
