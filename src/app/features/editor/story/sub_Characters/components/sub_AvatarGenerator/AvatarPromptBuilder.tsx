'use client'

import { Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Character } from '@/lib/types'

interface ReferenceImageSelectorProps {
  character: Character
  selectedReferenceIndex: number | null
  loading: boolean
  onSelectReference: (index: number | null) => void
}

export function ReferenceImageSelector({
  character,
  selectedReferenceIndex,
  loading,
  onSelectReference,
}: ReferenceImageSelectorProps) {
  const hasImages = character.imageUrls && character.imageUrls.length > 0

  if (!hasImages) return null

  return (
    <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4 halloween-bat-silhouette">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Reference Image (Optional)</h3>
        {selectedReferenceIndex !== null && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelectReference(null)}
            className="h-7 text-xs"
            disabled={loading}
          >
            Clear
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Select one of your character images to use as a reference for visual consistency.
      </p>

      <div className="grid grid-cols-4 gap-2">
        {character.imageUrls.map((url, index) => (
          <button
            key={index}
            onClick={() => onSelectReference(index)}
            disabled={loading}
            className={cn(
              'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
              'hover:opacity-90 active:scale-[0.98]',
              selectedReferenceIndex === index
                ? 'border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                : 'border-border hover:border-border/80'
            )}
          >
            <img
              src={url}
              alt={`Reference ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {selectedReferenceIndex === index && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="w-3 h-3" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

interface NoImagesWarningProps {
  hasImages: boolean
}

export function NoImagesWarning({ hasImages }: NoImagesWarningProps) {
  if (hasImages) return null

  return (
    <div className="bg-muted/50 rounded-lg border-2 border-border p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium">No Character Images</p>
        <p className="text-xs text-muted-foreground mt-1">
          Generate character images first to use them as references for better avatar consistency.
          You can still generate avatars based on the character description.
        </p>
      </div>
    </div>
  )
}

interface PromptPreviewProps {
  avatarPrompt: string
}

export function PromptPreview({ avatarPrompt }: PromptPreviewProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Avatar Prompt
      </span>
      <p className="text-xs text-foreground line-clamp-3">{avatarPrompt}</p>
    </div>
  )
}
