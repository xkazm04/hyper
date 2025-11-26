'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, ExternalLink, AlertCircle } from 'lucide-react'

interface PublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storyName: string
  slug: string | null
  isPublished: boolean
  cardCount: number
  onPublish: () => Promise<void>
  onUnpublish: () => Promise<void>
}

export default function PublishDialog({
  open,
  onOpenChange,
  storyName,
  slug,
  isPublished,
  cardCount,
  onPublish,
  onUnpublish,
}: PublishDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const shareableUrl = slug ? `${window.location.origin}/play/${slug}` : null

  const handlePublish = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await onPublish()
    } catch (err) {
      console.error('Failed to publish:', err)
      setError(err instanceof Error ? err.message : 'Failed to publish story')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnpublish = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await onUnpublish()
      onOpenChange(false)
    } catch (err) {
      console.error('Failed to unpublish:', err)
      setError(err instanceof Error ? err.message : 'Failed to unpublish story')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyUrl = async () => {
    if (shareableUrl) {
      await navigator.clipboard.writeText(shareableUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleOpenPreview = () => {
    if (shareableUrl) {
      window.open(shareableUrl, '_blank')
    }
  }

  // Validation check
  const canPublish = cardCount > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isPublished ? 'Story Published' : 'Publish Story'}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? 'Your story is live and can be shared with others.'
              : 'Make your story available for others to play.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation Warning */}
          {!canPublish && !isPublished && (
            <div className="flex items-start gap-2 p-3 bg-[hsl(var(--yellow-100))] border-2 border-[hsl(var(--yellow-500))] rounded">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--yellow-500))] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Cannot publish yet</p>
                <p className="text-muted-foreground">
                  Your story needs at least one card before it can be published.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-[hsl(var(--red-50))] border-2 border-[hsl(var(--red-400))] rounded">
              <AlertCircle className="w-5 h-5 text-[hsl(var(--red-500))] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-foreground">Error</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {/* Story Info */}
          <div className="space-y-2">
            <div className="text-sm">
              <span className="font-semibold">Story:</span> {storyName}
            </div>
            <div className="text-sm">
              <span className="font-semibold">Cards:</span> {cardCount}
            </div>
          </div>

          {/* Shareable URL (if published) */}
          {isPublished && shareableUrl && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Shareable URL</label>
              <div className="flex gap-2">
                <Input
                  value={shareableUrl}
                  readOnly
                  className="flex-1 border-2 border-border font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenPreview}
                  className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          {isPublished ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnpublish}
                disabled={isLoading}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                {isLoading ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!canPublish || isLoading}
                className="border-2 border-border bg-[hsl(var(--blue-500))] text-white hover:bg-[hsl(var(--blue-600))] shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Publishing...' : 'Publish Story'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
