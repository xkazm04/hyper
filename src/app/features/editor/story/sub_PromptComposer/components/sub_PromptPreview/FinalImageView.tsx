'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GeneratedImage } from './types'

interface FinalImageViewProps {
  image: GeneratedImage
  loading: boolean
  onBackToSketches: () => void
  onConfirm: () => void
}

/**
 * Final image view with confirm and back actions
 */
export function FinalImageView({
  image,
  loading,
  onBackToSketches,
  onConfirm,
}: FinalImageViewProps) {
  return (
    <div className="space-y-3" data-testid="prompt-preview-final-image">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Final Image
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onBackToSketches}
          className="h-6 text-xs"
          disabled={loading}
          data-testid="prompt-preview-back-to-sketches-btn"
        >
          Back to Sketches
        </Button>
      </div>

      <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]">
        <img
          src={image.url}
          alt="Final generated image ready for use"
          className="w-full h-full object-cover"
        />
      </div>

      <Button
        onClick={onConfirm}
        className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
        data-testid="prompt-preview-use-final-btn"
      >
        <Check className="w-4 h-4 mr-2" aria-hidden="true" />
        Use This Image
      </Button>
    </div>
  )
}
