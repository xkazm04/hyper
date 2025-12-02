'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, ExternalLink, Share2 } from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

interface ShareUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string
  shareCode: string
  storyName: string
}

export function ShareUrlDialog({
  open,
  onOpenChange,
  shareUrl,
  shareCode,
  storyName,
}: ShareUrlDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [shareUrl])

  const handleOpen = useCallback(() => {
    window.open(shareUrl, '_blank', 'noopener,noreferrer')
  }, [shareUrl])

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: storyName,
          text: `Check out this interactive story: ${storyName}`,
          url: shareUrl,
        })
      } catch (err) {
        // User cancelled or share failed - fall back to copy
        if ((err as Error).name !== 'AbortError') {
          handleCopy()
        }
      }
    } else {
      handleCopy()
    }
  }, [storyName, shareUrl, handleCopy])

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <ModalHeader>
        <ModalTitle className="text-xl font-bold flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          Story Shared Successfully!
        </ModalTitle>
        <ModalDescription className="text-sm">
          Anyone with this link can view your interactive story in their
          browser.
        </ModalDescription>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          {/* Story info */}
          <div
            className="p-3 bg-muted/50 rounded-lg border-2 border-border"
            data-testid="share-url-story-info"
          >
            <h4 className="font-medium text-foreground truncate">
              {storyName}
            </h4>
            <div className="text-xs text-muted-foreground mt-1">
              Share code: <code className="font-mono">{shareCode}</code>
            </div>
          </div>

          {/* URL input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Shareable URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-sm bg-muted border-2 border-border rounded-lg
                         font-mono text-foreground overflow-hidden text-ellipsis"
                onClick={(e) => (e.target as HTMLInputElement).select()}
                data-testid="share-url-input"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                data-testid="share-url-copy-btn"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Copied confirmation */}
          {copied && (
            <div
              className="text-sm text-green-600 font-medium flex items-center gap-2"
              data-testid="share-url-copied-message"
            >
              <Check className="w-4 h-4" />
              Link copied to clipboard!
            </div>
          )}

          {/* Info box */}
          <div
            className="p-3 bg-muted/50 rounded-lg border-2 border-border"
            data-testid="share-url-info"
          >
            <p className="text-xs text-muted-foreground">
              <strong>How it works:</strong> Your story bundle is stored on our
              servers. When someone opens this link, they can play your story
              entirely in their browser - no download required!
            </p>
          </div>
        </div>
      </ModalBody>

      {/* Actions */}
      <ModalFooter className="flex-col sm:flex-row gap-2">
        <Button
          onClick={handleOpen}
          variant="outline"
          className="flex-1"
          data-testid="share-url-open-btn"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Tab
        </Button>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <Button
            onClick={handleShare}
            className="flex-1"
            data-testid="share-url-share-btn"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
        <Button
          onClick={() => onOpenChange(false)}
          variant="ghost"
          className="sm:w-auto"
          data-testid="share-url-close-btn"
        >
          Done
        </Button>
      </ModalFooter>
    </Modal>
  )
}
