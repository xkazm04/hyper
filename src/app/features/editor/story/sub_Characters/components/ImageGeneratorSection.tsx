'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Character, BriaModelStatus } from '@/lib/types'
import { useEditor } from '@/contexts/EditorContext'
import { getEffectiveArtStylePrompt } from '../../sub_Story/lib/artStyleService'
import { composeCharacterPromptWithAI, TRAINING_POSE_OPTIONS } from '../lib/characterPromptComposer'
import { SKETCH_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { deleteGenerations } from '@/lib/services/sketchCleanup'
import {
  ImagePromptInput,
  MasonryGallery,
  SketchesGrid,
  FinalImagePreview,
  EmptyState,
  ImageGenerationControls,
  MaxImagesMessage,
  ErrorMessage,
  useImageGenerator,
  TrainingStatusPanel,
  RandomSketchesGrid,
} from './sub_ImageGenerator'

interface ImageGeneratorSectionProps {
  character: Character
  storyStackId: string
  isSaving: boolean
  onAddImage: (imageUrl: string, prompt: string) => Promise<void>
  onRemoveImage: (index: number) => Promise<void>
  onCharacterUpdate?: (updates: Partial<Character>) => void
}

export function ImageGeneratorSection({
  character,
  storyStackId,
  isSaving,
  onAddImage,
  onRemoveImage,
  onCharacterUpdate,
}: ImageGeneratorSectionProps) {
  // Get story art style from EditorContext (FR-3.1, FR-3.3)
  const { storyStack, updateCharacter } = useEditor()
  const storyArtStyle = storyStack ? getEffectiveArtStylePrompt(storyStack) : undefined

  // Check Bria API availability
  const [isBriaAvailable, setIsBriaAvailable] = useState(false)

  useEffect(() => {
    fetch('/api/ai/bria/status')
      .then(res => res.json())
      .then(data => setIsBriaAvailable(data.available))
      .catch(() => setIsBriaAvailable(false))
  }, [])

  // Handle training status changes
  const handleTrainingStatusChange = useCallback((status: BriaModelStatus) => {
    if (onCharacterUpdate) {
      onCharacterUpdate({ briaModelStatus: status })
    }
    // Also update via EditorContext
    updateCharacter(character.id, { briaModelStatus: status })
  }, [onCharacterUpdate, updateCharacter, character.id])

  // Random poses generation state (for building training dataset)
  const [isGeneratingRandom, setIsGeneratingRandom] = useState(false)
  const [randomSketches, setRandomSketches] = useState<Array<{ url: string; prompt: string; generationId?: string }>>([])
  // Track generation IDs for cleanup
  const randomGenerationIdsRef = useRef<string[]>([])

  // Check if character has a trained model
  const hasTrainedModel = character.briaModelStatus === 'completed' && character.briaModelId

  // Handle random pose generation using Leonardo (for training data)
  // Uses TRAINING_POSE_OPTIONS from promptTemplates for diverse poses
  // and LLM composition for consistent style with story art style
  const handleGenerateRandomPoses = useCallback(async () => {
    if (isGeneratingRandom || !character.name) return

    // Clean up previous random generations before starting new ones
    if (randomGenerationIdsRef.current.length > 0) {
      deleteGenerations(randomGenerationIdsRef.current)
      randomGenerationIdsRef.current = []
    }

    setIsGeneratingRandom(true)
    setRandomSketches([])

    try {
      // Use same quality preset as regular sketches (portrait ratio for full body)
      const sketchPreset = SKETCH_QUALITY_PRESETS.quick

      // Randomly select 8 poses from TRAINING_POSE_OPTIONS for variety
      const shuffledPoses = [...TRAINING_POSE_OPTIONS]
        .sort(() => Math.random() - 0.5)
        .slice(0, 8)

      // Generate sketches with different poses using LLM-composed prompts
      const sketchPromises = shuffledPoses.map(async (poseOption) => {
        // Use AI prompt composer with pose selection from TRAINING_POSE_OPTIONS
        // This ensures art style is properly integrated via LLM
        // The pose.prompt from templates is used as the pose fragment
        const composedPrompt = await composeCharacterPromptWithAI({
          characterName: character.name,
          characterAppearance: character.appearance,
          selections: {
            pose: poseOption, // Use full CharacterPromptOption from templates
          },
          storyArtStyle,
        })

        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: composedPrompt,
            numImages: 1,
            width: sketchPreset.width,
            height: sketchPreset.height,
            provider: 'leonardo',
            model: 'phoenix_1.0',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to generate pose sketch:', errorData.error || response.statusText)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]
        return image ? {
          url: image.url,
          prompt: composedPrompt,
          generationId: data.generationId,
        } : null
      })

      const results = await Promise.all(sketchPromises)
      const validSketches = results.filter((s): s is NonNullable<typeof s> => s !== null)

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any pose sketches')
      }

      // Store generation IDs for later cleanup
      randomGenerationIdsRef.current = validSketches
        .map(s => s.generationId)
        .filter((id): id is string => !!id)

      setRandomSketches(validSketches)
    } catch (err) {
      console.error('Error generating random poses:', err)
    } finally {
      setIsGeneratingRandom(false)
    }
  }, [isGeneratingRandom, character.name, character.appearance, storyArtStyle])

  // Handle adding random sketches to character
  const handleAddRandomSketches = useCallback(async (selected: Array<{ url: string; prompt: string }>) => {
    // Find generation IDs of sketches that were NOT selected (to delete them)
    const selectedUrls = new Set(selected.map(s => s.url))
    const unusedGenerationIds = randomSketches
      .filter(s => !selectedUrls.has(s.url) && s.generationId)
      .map(s => s.generationId!)

    // Add selected sketches to character
    for (const item of selected) {
      await onAddImage(item.url, item.prompt)
    }

    // Clean up unused generations (fire-and-forget)
    if (unusedGenerationIds.length > 0) {
      deleteGenerations(unusedGenerationIds)
    }

    // Clear state and tracked IDs
    randomGenerationIdsRef.current = []
    setRandomSketches([])
  }, [onAddImage, randomSketches])

  // Clear random sketches and clean up all generations
  const handleClearRandomSketches = useCallback(() => {
    // Clean up all random generations when clearing
    if (randomGenerationIdsRef.current.length > 0) {
      deleteGenerations(randomGenerationIdsRef.current)
      randomGenerationIdsRef.current = []
    }
    setRandomSketches([])
  }, [])

  const {
    selections, expandedColumn, sketches, isGeneratingSketches, selectedSketchIndex,
    isGeneratingFinal, finalImage, error, finalPrompt, hasSelections, loading,
    currentImageCount, canAddMore, canGenerate, handleSelect, handleClear, toggleColumn,
    handleGenerateSketches, handleGenerateFinal, handleAddToCharacter, handleUseSketch,
    setSelectedSketchIndex, setFinalImage,
    // AI composition state (FR-3.2, Task 10.1, 10.2)
    isComposingPrompt, composedPrompt, compositionError, usedFallbackPrompt,
  } = useImageGenerator({ character, isSaving, onAddImage, storyArtStyle })

  return (
    <div className="space-y-4">
      <MasonryGallery
        character={character}
        loading={loading}
        onRemoveImage={onRemoveImage}
      />

      {/* Bria AI Training Panel - show when API is available */}
      {isBriaAvailable && (
        <TrainingStatusPanel
          character={character}
          storyStackId={storyStackId}
          onTrainingStatusChange={handleTrainingStatusChange}
        />
      )}

      <MaxImagesMessage canAddMore={canAddMore} />

      {/* Random Sketches Grid - show when random poses were generated */}
      {randomSketches.length > 0 && canAddMore && (
        <RandomSketchesGrid
          sketches={randomSketches}
          loading={isGeneratingRandom}
          isSaving={isSaving}
          currentImageCount={currentImageCount}
          maxImages={10}
          onAddSelected={handleAddRandomSketches}
          onClear={handleClearRandomSketches}
          onRegenerate={handleGenerateRandomPoses}
        />
      )}

      {canAddMore && sketches.length === 0 && !finalImage && randomSketches.length === 0 && (
        <>
          <ImagePromptInput
            selections={selections}
            expandedColumn={expandedColumn}
            loading={loading}
            hasSelections={hasSelections}
            finalPrompt={finalPrompt}
            onSelect={handleSelect}
            onToggleColumn={toggleColumn}
            onClear={handleClear}
            // AI composition state (FR-3.2, Task 10.1, 10.2)
            isComposingPrompt={isComposingPrompt}
            composedPrompt={composedPrompt}
            compositionError={compositionError}
            usedFallbackPrompt={usedFallbackPrompt}
          />
          <ImageGenerationControls
            canGenerate={canGenerate}
            loading={loading || isGeneratingRandom}
            isGeneratingSketches={isGeneratingSketches}
            onGenerateSketches={handleGenerateSketches}
            showRandomPoses={isBriaAvailable && !hasTrainedModel}
            isGeneratingRandom={isGeneratingRandom}
            onGenerateRandomPoses={handleGenerateRandomPoses}
          />
        </>
      )}

      <ErrorMessage error={error} />

      {sketches.length > 0 && !finalImage && canAddMore && (
        <SketchesGrid
          sketches={sketches}
          selectedSketchIndex={selectedSketchIndex}
          loading={loading}
          isGeneratingFinal={isGeneratingFinal}
          onSelectSketch={setSelectedSketchIndex}
          onClear={handleClear}
          onUseSketch={handleUseSketch}
          onGenerateFinal={handleGenerateFinal}
        />
      )}

      {finalImage && canAddMore && (
        <FinalImagePreview
          finalImage={finalImage}
          loading={loading}
          isSaving={isSaving}
          currentImageCount={currentImageCount}
          onBack={() => {
            setFinalImage(null)
            setSelectedSketchIndex(null)
          }}
          onAddToCharacter={handleAddToCharacter}
        />
      )}

      {currentImageCount === 0 && (
        <EmptyState hasSelections={hasSelections} sketchesLength={sketches.length} />
      )}
    </div>
  )
}
