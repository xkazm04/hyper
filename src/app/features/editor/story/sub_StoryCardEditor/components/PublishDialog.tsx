'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, AlertCircle, Globe, Lock, Sparkles } from 'lucide-react'
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

export function PublishDialog({
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
  const canPublish = cardCount > 0

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-4 border-border bg-card
                                shadow-[6px_6px_0px_0px_hsl(var(--border))]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {isPublished ? (
              <>
                <Globe className="w-5 h-5 text-green-600" />
                Story Published
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-primary" />
                Publish Story
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isPublished
              ? 'Your story is live and can be shared with anyone.'
              : 'Make your story available for the world to play.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Validation Warning */}
          {!canPublish && !isPublished && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30
                            border-2 border-amber-300 dark:border-amber-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                  Cannot publish yet
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Your story needs at least one card before it can be published.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30
                            border-2 border-red-300 dark:border-red-700 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800 dark:text-red-200 text-sm">Error</p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Story Info Card */}
          <div className="bg-muted/50 rounded-lg p-4 border-2 border-border space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Story</span>
              <span className="font-semibold text-foreground">{storyName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cards</span>
              <span className="font-semibold text-foreground">{cardCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-semibold flex items-center gap-1.5 ${
                isPublished ? 'text-green-600' : 'text-muted-foreground'
              }`}>
                {isPublished ? (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    Private
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Shareable URL (if published) */}
          {isPublished && shareableUrl && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Shareable URL
              </label>
              <div className="flex gap-2">
                <Input
                  value={shareableUrl}
                  readOnly
                  className="flex-1 border-2 border-border font-mono text-xs
                             bg-muted/50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                             hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                             hover:-translate-x-px hover:-translate-y-px transition-all"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenPreview}
                  className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                             hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                             hover:-translate-x-px hover:-translate-y-px transition-all"
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
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={handleUnpublish}
                disabled={isLoading}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                {isLoading ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                disabled={!canPublish || isLoading}
                className="border-2 border-border bg-primary text-primary-foreground
                           shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
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
