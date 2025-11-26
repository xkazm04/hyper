'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Sparkles,
  Loader2,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Character } from '@/lib/types'
import {
  CHARACTER_PROMPT_COLUMNS,
  CharacterDimension,
  CharacterPromptOption,
  composeCharacterPrompt,
} from '../lib/characterPromptComposer'
import { CharacterOptionSelector } from './CharacterOptionSelector'
import { SKETCH_QUALITY_PRESETS, FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'

interface GeneratedImage {
  url: string
  width: number
  height: number
  prompt?: string
}

interface ImageGeneratorSectionProps {
  character: Character
  storyStackId: string
  isSaving: boolean
  onAddImage: (imageUrl: string, prompt: string) => Promise<void>
  onRemoveImage: (index: number) => Promise<void>
}

type SelectionState = Partial<Record<CharacterDimension, CharacterPromptOption>>

export function ImageGeneratorSection({
  character,
  storyStackId,
  isSaving,
  onAddImage,
  onRemoveImage,
}: ImageGeneratorSectionProps) {
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

  const handleSelect = (dimension: CharacterDimension, option: CharacterPromptOption) => {
    setSelections((prev) => {
      const isSelected = prev[dimension]?.id === option.id
      return isSelected
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: option }
    })
  }

  const handleClear = () => {
    setSelections({})
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)
    setError(null)
  }

  const toggleColumn = (columnId: CharacterDimension) => {
    setExpandedColumn((prev) => (prev === columnId ? null : columnId))
  }

  /**
   * Generate 4 sketch variations based on the prompt
   */
  const handleGenerateSketches = useCallback(async () => {
    if (!finalPrompt) return

    setIsGeneratingSketches(true)
    setError(null)
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)

    try {
      // Generate prompt variations
      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          count: 4,
        }),
      })

      if (!variationResponse.ok) {
        throw new Error('Failed to generate prompt variations')
      }

      const { variations } = await variationResponse.json()
      const sketchPreset = SKETCH_QUALITY_PRESETS.quick

      // Generate sketch for each variation
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

        if (image) {
          return {
            ...image,
            prompt: variation.variation,
          } as GeneratedImage
        }
        return null
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

  /**
   * Generate final high-quality image from selected sketch
   */
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
        setFinalImage({
          ...image,
          prompt: selectedSketch.prompt,
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
  }, [selectedSketchIndex, sketches])

  /**
   * Add the final image to the character
   */
  const handleAddToCharacter = useCallback(async () => {
    if (!finalImage || !finalImage.prompt) return

    await onAddImage(finalImage.url, finalImage.prompt)

    // Reset state
    setSketches([])
    setSelectedSketchIndex(null)
    setFinalImage(null)
    setSelections({})
  }, [finalImage, onAddImage])

  /**
   * Use a sketch directly
   */
  const handleUseSketch = useCallback(async () => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return

    const sketch = sketches[selectedSketchIndex]
    await onAddImage(sketch.url, sketch.prompt || finalPrompt)

    // Reset state
    setSketches([])
    setSelectedSketchIndex(null)
    setSelections({})
  }, [selectedSketchIndex, sketches, finalPrompt, onAddImage])

  return (
    <div className="space-y-4">
      {/* Current Images Gallery */}
      {currentImageCount > 0 && (
        <div className="bg-card rounded-lg border-2 border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">
              Character Images ({currentImageCount}/4)
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {character.imageUrls.map((url, index) => (
              <div key={index} className="relative group aspect-[3/4] rounded-lg overflow-hidden border-2 border-border">
                <img
                  src={url}
                  alt={`${character.name} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemoveImage(index)}
                  disabled={loading}
                  className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5">
                  <span className="text-[10px] text-white font-medium">#{index + 1}</span>
                </div>
              </div>
            ))}
            {/* Add more placeholder slots */}
            {Array.from({ length: 4 - currentImageCount }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className="aspect-[3/4] rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center"
              >
                <Plus className="w-6 h-6 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Can't add more message */}
      {!canAddMore && (
        <div className="bg-muted/50 rounded-lg border-2 border-border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Maximum of 4 character images reached. Remove an image to add a new one.
          </p>
        </div>
      )}

      {/* Prompt Builder */}
      {canAddMore && sketches.length === 0 && !finalImage && (
        <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Build Character Prompt</h3>
            {hasSelections && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                className="h-7 text-xs"
                disabled={loading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Option Selectors */}
          <div className="space-y-2">
            {CHARACTER_PROMPT_COLUMNS.map((column) => (
              <CharacterOptionSelector
                key={column.id}
                column={column}
                selectedOption={selections[column.id]}
                isExpanded={expandedColumn === column.id}
                loading={loading}
                onToggle={toggleColumn}
                onSelect={handleSelect}
              />
            ))}
          </div>

          {/* Prompt Preview */}
          {hasSelections && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Generated Prompt
              </span>
              <p className="text-xs text-foreground line-clamp-4">{finalPrompt}</p>
              <span className="text-xs text-muted-foreground">
                {finalPrompt.length}/1618 characters
              </span>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateSketches}
            disabled={!hasSelections || loading}
            className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          >
            {isGeneratingSketches ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating 4 Sketches...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate 4 Sketches
              </>
            )}
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Sketches Grid */}
      {sketches.length > 0 && !finalImage && canAddMore && (
        <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Select a Sketch</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="h-7 text-xs"
              disabled={loading}
            >
              Start Over
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {sketches.map((sketch, index) => (
              <button
                key={index}
                onClick={() => setSelectedSketchIndex(index)}
                disabled={loading}
                className={cn(
                  'relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all',
                  'hover:opacity-90 active:scale-[0.98]',
                  selectedSketchIndex === index
                    ? 'border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                    : 'border-border hover:border-border/80'
                )}
              >
                <img
                  src={sketch.url}
                  alt={`Sketch ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedSketchIndex === index && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                )}
                <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5">
                  <span className="text-[10px] text-white font-medium">Sketch {index + 1}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Actions */}
          {selectedSketchIndex !== null && (
            <div className="flex gap-2">
              <Button
                onClick={handleUseSketch}
                disabled={loading}
                variant="outline"
                className="flex-1 border-2"
              >
                <Check className="w-4 h-4 mr-2" />
                Use Sketch
              </Button>
              <Button
                onClick={handleGenerateFinal}
                disabled={loading}
                className="flex-1 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
              >
                {isGeneratingFinal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Final
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Final Image */}
      {finalImage && canAddMore && (
        <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Final Image</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setFinalImage(null)
                setSelectedSketchIndex(null)
              }}
              className="h-7 text-xs"
              disabled={loading}
            >
              Back to Sketches
            </Button>
          </div>

          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]">
            <img
              src={finalImage.url}
              alt="Final character image"
              className="w-full h-full object-cover"
            />
          </div>

          <Button
            onClick={handleAddToCharacter}
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
                <Plus className="w-4 h-4 mr-2" />
                Add to Character ({currentImageCount + 1}/4)
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty state for new characters */}
      {currentImageCount === 0 && !hasSelections && sketches.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-sm font-semibold mb-1">No Character Images</h3>
          <p className="text-xs text-muted-foreground">
            Select an archetype, pose, and expression above to generate up to 4 character images
          </p>
        </div>
      )}
    </div>
  )
}
