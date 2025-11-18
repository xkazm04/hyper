'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface ImageGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImageGenerated: (imageUrl: string, prompt: string) => void
  initialPrompt?: string
}

export default function ImageGenerator({
  open,
  onOpenChange,
  onImageGenerated,
  initialPrompt = '',
}: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) {
      setError('Please enter a description of at least 10 characters')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate image')
      }

      const data = await response.json()
      onImageGenerated(data.imageUrl, prompt.trim())
      onOpenChange(false)
      setPrompt('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false)
      setPrompt(initialPrompt)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Image with AI</DialogTitle>
          <DialogDescription>
            Describe the scene you want to visualize. Be specific about the setting, mood, and key elements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="image-prompt">Image Description</Label>
            <Textarea
              id="image-prompt"
              placeholder="A mysterious forest at twilight with ancient trees and glowing mushrooms..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters required
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || prompt.trim().length < 10}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
