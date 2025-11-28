'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageGenerationControlsProps {
  hasSelections: boolean
  loading: boolean
  isGeneratingSketches: boolean
  onGenerateSketches: () => void
}

export function ImageGenerationControls({
  hasSelections,
  loading,
  isGeneratingSketches,
  onGenerateSketches,
}: ImageGenerationControlsProps) {
  return (
    <Button
      onClick={onGenerateSketches}
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
        Maximum of 4 character images reached. Remove an image to add a new one.
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
