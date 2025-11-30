'use client'

import { Character } from '@/lib/types'
import { useEditor } from '@/contexts/EditorContext'
import { getEffectiveArtStylePrompt } from '../../sub_Story/lib/artStyleService'
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
} from './sub_ImageGenerator'

interface ImageGeneratorSectionProps {
  character: Character
  storyStackId: string
  isSaving: boolean
  onAddImage: (imageUrl: string, prompt: string) => Promise<void>
  onRemoveImage: (index: number) => Promise<void>
}

export function ImageGeneratorSection({
  character,
  storyStackId,
  isSaving,
  onAddImage,
  onRemoveImage,
}: ImageGeneratorSectionProps) {
  // Get story art style from EditorContext (FR-3.1, FR-3.3)
  const { storyStack } = useEditor()
  const storyArtStyle = storyStack ? getEffectiveArtStylePrompt(storyStack) : undefined

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

      <MaxImagesMessage canAddMore={canAddMore} />

      {canAddMore && sketches.length === 0 && !finalImage && (
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
            loading={loading}
            isGeneratingSketches={isGeneratingSketches}
            onGenerateSketches={handleGenerateSketches}
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
