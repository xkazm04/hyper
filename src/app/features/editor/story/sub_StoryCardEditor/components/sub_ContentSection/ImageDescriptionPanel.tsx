'use client'

import { useState, useCallback } from 'react'
import { Sparkles, Loader2, Copy, Check, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ImageDescriptionPanelProps {
  /** Current image description */
  description: string
  /** Callback when description changes */
  onDescriptionChange: (description: string) => void
  /** Story content to generate description from */
  storyContent: string
  /** Art style prompt from story stack */
  artStylePrompt: string
  /** Whether generation is disabled */
  disabled?: boolean
  /** Whether content is being extracted from image */
  isExtracting?: boolean
}

/**
 * ImageDescriptionPanel - Manages image-specific description for scene generation
 *
 * This panel separates image generation prompts from story content:
 * - Image extraction populates this description
 * - User can edit the description manually
 * - "Generate from Story" creates description using LLM + art style
 * - Description is used for image generation, not story content
 */
export function ImageDescriptionPanel({
  description,
  onDescriptionChange,
  storyContent,
  artStylePrompt,
  disabled = false,
  isExtracting = false,
}: ImageDescriptionPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasStoryContent = (storyContent?.trim()?.length || 0) > 20

  /**
   * Generate image description from story content using LLM
   */
  const handleGenerateFromStory = useCallback(async () => {
    if (!hasStoryContent || isGenerating) return

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/image-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyContent,
          artStylePrompt: artStylePrompt || undefined,
          existingDescription: description || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate image description')
      }

      const data = await response.json()

      if (data.description) {
        onDescriptionChange(data.description)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate description')
    } finally {
      setIsGenerating(false)
    }
  }, [storyContent, artStylePrompt, description, hasStoryContent, isGenerating, onDescriptionChange])

  /**
   * Copy description to clipboard
   */
  const handleCopy = useCallback(async () => {
    if (!description) return

    try {
      await navigator.clipboard.writeText(description)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [description])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground">
          Image Description
        </Label>
        <div className="flex items-center gap-1">
          {description && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              disabled={disabled}
              className="h-6 px-2 text-[10px]"
              title="Copy to clipboard"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleGenerateFromStory}
            disabled={disabled || isGenerating || !hasStoryContent}
            className="h-6 px-2 text-[10px]"
            title={hasStoryContent ? "Generate from story content" : "Add story content first"}
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                From Story
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={isExtracting
            ? "Extracting description from image..."
            : "Describe the visual scene for image generation. Use 'From Story' button or extract from an image above."
          }
          disabled={disabled || isExtracting}
          className={cn(
            "min-h-[100px] text-xs resize-none",
            isExtracting && "opacity-50"
          )}
        />
        {isExtracting && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Extracting...
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] text-destructive">{error}</p>
      )}

      <p className="text-[10px] text-muted-foreground">
        This description is used for image generation only, separate from your story content.
      </p>
    </div>
  )
}
