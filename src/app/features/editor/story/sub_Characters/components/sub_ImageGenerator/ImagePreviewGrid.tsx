'use client'

import { Plus, Trash2, Check, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Character } from '@/lib/types'

export interface GeneratedImage {
  url: string
  width: number
  height: number
  prompt?: string
  generationId?: string
  imageId?: string
}

interface CurrentImagesGalleryProps {
  character: Character
  loading: boolean
  onRemoveImage: (index: number) => Promise<void>
}

export function CurrentImagesGallery({
  character,
  loading,
  onRemoveImage,
}: CurrentImagesGalleryProps) {
  const currentImageCount = character.imageUrls?.length || 0

  if (currentImageCount === 0) return null

  return (
    <div className="bg-card rounded-lg border-2 border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">
          Character Images ({currentImageCount}/4)
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {character.imageUrls.map((url, index) => (
          <div
            key={index}
            className="relative group aspect-[3/4] rounded-lg overflow-hidden border-2 border-border halloween-pumpkin-glow"
          >
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
  )
}

interface SketchesGridProps {
  sketches: GeneratedImage[]
  selectedSketchIndex: number | null
  loading: boolean
  isGeneratingFinal: boolean
  onSelectSketch: (index: number) => void
  onClear: () => void
  onUseSketch: () => void
  onGenerateFinal: () => void
}

export function SketchesGrid({
  sketches,
  selectedSketchIndex,
  loading,
  isGeneratingFinal,
  onSelectSketch,
  onClear,
  onUseSketch,
  onGenerateFinal,
}: SketchesGridProps) {
  return (
    <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Select a Sketch</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
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
            onClick={() => onSelectSketch(index)}
            disabled={loading}
            className={cn(
              'relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all halloween-pumpkin-glow',
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
            onClick={onUseSketch}
            disabled={loading}
            variant="outline"
            className="flex-1 border-2"
          >
            <Check className="w-4 h-4 mr-2" />
            Use Sketch
          </Button>
          <Button
            onClick={onGenerateFinal}
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
  )
}

interface FinalImagePreviewProps {
  finalImage: GeneratedImage
  loading: boolean
  isSaving: boolean
  currentImageCount: number
  onBack: () => void
  onAddToCharacter: () => void
}

export function FinalImagePreview({
  finalImage,
  loading,
  isSaving,
  currentImageCount,
  onBack,
  onAddToCharacter,
}: FinalImagePreviewProps) {
  return (
    <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Final Image</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={onBack}
          className="h-7 text-xs"
          disabled={loading}
        >
          Back to Sketches
        </Button>
      </div>

      <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))] halloween-pumpkin-glow">
        <img
          src={finalImage.url}
          alt="Final character image"
          className="w-full h-full object-cover"
        />
      </div>

      <Button
        onClick={onAddToCharacter}
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
  )
}

interface EmptyStateProps {
  hasSelections: boolean
  sketchesLength: number
}

export function EmptyState({ hasSelections, sketchesLength }: EmptyStateProps) {
  if (hasSelections || sketchesLength > 0) return null

  return (
    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
      <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
      <h3 className="text-sm font-semibold mb-1">No Character Images</h3>
      <p className="text-xs text-muted-foreground">
        Select an archetype, pose, and expression above to generate up to 4 character images
      </p>
    </div>
  )
}
