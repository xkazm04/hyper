'use client'

import { Sparkles, Loader2, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageGenerationControlsProps {
  canGenerate: boolean // True if we have character data or art style to generate from
  loading: boolean
  isGeneratingSketches: boolean
  onGenerateSketches: () => void
  // Optional: Show random poses button for generating training data
  showRandomPoses?: boolean
  isGeneratingRandom?: boolean
  onGenerateRandomPoses?: () => void
}

export function ImageGenerationControls({
  canGenerate,
  loading,
  isGeneratingSketches,
  onGenerateSketches,
  showRandomPoses = false,
  isGeneratingRandom = false,
  onGenerateRandomPoses,
}: ImageGenerationControlsProps) {
  // If random poses generation is available, show two buttons side by side
  if (showRandomPoses && onGenerateRandomPoses) {
    return (
      <div className="flex gap-2">
        {/* Random Poses Button - Left (for building training dataset) */}
        <Button
          onClick={onGenerateRandomPoses}
          disabled={!canGenerate || loading}
          className={cn(
            'flex-1 border-2',
            'bg-gradient-to-r from-amber-500 to-orange-500',
            'hover:from-amber-600 hover:to-orange-600',
            'text-white border-amber-600/50',
            'shadow-[2px_2px_0px_0px_hsl(var(--border))]'
          )}
        >
          {isGeneratingRandom ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Shuffle className="w-4 h-4 mr-2" />
              Random Poses
            </>
          )}
        </Button>

        {/* Regular Sketches Button - Right */}
        <Button
          onClick={onGenerateSketches}
          disabled={!canGenerate || loading}
          className="flex-1 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
        >
          {isGeneratingSketches ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Custom Prompt
            </>
          )}
        </Button>
      </div>
    )
  }

  // Default: single button
  return (
    <Button
      onClick={onGenerateSketches}
      disabled={!canGenerate || loading}
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
  )
}

interface MaxImagesMessageProps {
  canAddMore: boolean
}

export function MaxImagesMessage({ canAddMore }: MaxImagesMessageProps) {
  if (canAddMore) return null

  return (
    <div className="bg-muted/50 rounded-lg border-2 border-border p-4 text-center">
      <p className="text-sm text-muted-foreground">
        Maximum of 10 character images reached. Remove an image to add a new one.
      </p>
    </div>
  )
}

interface ErrorMessageProps {
  error: string | null
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null

  return (
    <div className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-3">
      <p className="text-xs text-destructive">{error}</p>
    </div>
  )
}
