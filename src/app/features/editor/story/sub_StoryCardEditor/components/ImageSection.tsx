'use client'

import { useState, useCallback } from 'react'
import { ImageIcon, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateCard } from '../lib/cardApi'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import PromptComposer from '../../sub_PromptComposer/PromptComposer'

interface ImageSectionProps {
  cardId: string
  storyStackId: string
  imageUrl: string | null
  imagePrompt: string | null
  cardContent?: string  // Card content for prefilling custom setting
}

export function ImageSection({
  cardId,
  storyStackId,
  imageUrl,
  imagePrompt,
  cardContent,
}: ImageSectionProps) {
  const { updateCard: updateCardContext } = useEditor()
  const { success, error: showError } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const handleImageSelect = useCallback(async (newImageUrl: string, prompt: string) => {
    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, {
        imageUrl: newImageUrl,
        imagePrompt: prompt,
      })
      updateCardContext(cardId, updated)
      success('Image saved')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save image')
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId, updateCardContext, success, showError])

  const handleRemoveImage = useCallback(async () => {
    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, {
        imageUrl: null,
        imagePrompt: null,
      })
      updateCardContext(cardId, updated)
      success('Image removed')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove image')
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId, updateCardContext, success, showError])

  return (
    <div className="space-y-6">
      {/* Current Image Preview */}
      {imageUrl ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Current Image</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemoveImage}
              disabled={isSaving}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Remove
            </Button>
          </div>

          {/* Image Display with vintage frame */}
          <div className="relative rounded-lg overflow-hidden border-4 border-border bg-muted
                          shadow-[4px_4px_0px_0px_hsl(var(--border))]">
            <div className="aspect-video">
              <img
                src={imageUrl}
                alt="Card image"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Vintage frame overlay */}
            <div className="absolute inset-0 pointer-events-none
                            shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]" />
          </div>

          {/* Image prompt display */}
          {imagePrompt && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <Label className="text-xs text-muted-foreground">Prompt used:</Label>
              <p className="text-xs text-foreground mt-1 italic leading-relaxed">
                {imagePrompt}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center gap-4 p-8 bg-muted/30 rounded-lg border-2 border-dashed border-border">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground mb-1">No image yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Use the prompt builder below to generate an AI image for this card
            </p>
          </div>
        </div>
      )}

      {/* Prompt Composer */}
      <div className="border-t border-border pt-6">
        <Label className="text-sm font-semibold mb-4 block">Generate New Image</Label>
        <PromptComposer onImageSelect={handleImageSelect} cardContent={cardContent} />
      </div>
    </div>
  )
}
