'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, AlertCircle, Copy, CheckCircle } from 'lucide-react'
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
    <div
      className="bg-card rounded-lg border-2 border-border p-4 space-y-4 halloween-bat-silhouette"
      data-testid="reference-image-selector"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Reference Image (Optional)</h3>
        {selectedReferenceIndex !== null && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onSelectReference(null)}
            className="h-7 text-xs"
            disabled={loading}
            data-testid="clear-reference-btn"
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
              'relative aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all',
              'hover:opacity-90 active:scale-[0.98]',
              selectedReferenceIndex === index
                ? 'border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                : 'border-border hover:border-border/80'
            )}
            data-testid={`reference-image-${index}`}
          >
            <Image
              src={url}
              alt={`Reference ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 25vw, 100px"
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
    <div
      className="bg-muted/50 rounded-lg border-2 border-border p-4 flex items-start gap-3"
      data-testid="no-images-warning"
    >
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
  isAIComposed?: boolean
  isComposing?: boolean
  usedFallback?: boolean
}

export function PromptPreview({ 
  avatarPrompt, 
  isAIComposed = false,
  isComposing = false,
  usedFallback = false,
}: PromptPreviewProps) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(avatarPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const getStatusBadge = () => {
    if (isComposing) {
      return (
        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded-full animate-pulse">
          AI Composing...
        </span>
      )
    }
    if (isAIComposed && !usedFallback) {
      return (
        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-600 rounded-full">
          AI Composed
        </span>
      )
    }
    if (usedFallback) {
      return (
        <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-600 rounded-full">
          Fallback
        </span>
      )
    }
    return (
      <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full">
        Preview
      </span>
    )
  }
  
  return (
    <div
      className="bg-muted/50 rounded-lg border-2 border-border p-4 space-y-3"
      data-testid="prompt-preview"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Avatar Prompt ({avatarPrompt.length} chars)
          </span>
          {getStatusBadge()}
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 text-xs gap-1"
          data-testid="copy-prompt-btn"
        >
          {copied ? (
            <>
              <CheckCircle className="w-3 h-3 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <p className="text-xs text-foreground whitespace-pre-wrap break-words">{avatarPrompt}</p>
      </div>
      {isAIComposed && !usedFallback && (
        <p className="text-xs text-muted-foreground italic">
          AI extracted face features from character description
        </p>
      )}
    </div>
  )
}
