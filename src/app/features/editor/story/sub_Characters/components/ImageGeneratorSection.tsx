'use client'

import { Character } from '@/lib/types'
import {
  ImagePromptInput,
  CurrentImagesGallery,
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
  const {
    selections, expandedColumn, sketches, isGeneratingSketches, selectedSketchIndex,
    isGeneratingFinal, finalImage, error, finalPrompt, hasSelections, loading,
    currentImageCount, canAddMore, handleSelect, handleClear, toggleColumn,
    handleGenerateSketches, handleGenerateFinal, handleAddToCharacter, handleUseSketch,
    setSelectedSketchIndex, setFinalImage,
  } = useImageGenerator({ character, isSaving, onAddImage })

  return (
    <div className="space-y-4">
      <CurrentImagesGallery
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
            onGenerateSketches={handleGenerateSketches}
            isGeneratingSketches={isGeneratingSketches}
          />
          <ImageGenerationControls
            hasSelections={hasSelections}
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
