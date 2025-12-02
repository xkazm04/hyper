'use client'

import { useState } from 'react'
import { Globe, Sparkles } from 'lucide-react'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { PublishStatus } from './PublishStatus'
import { PublishPreview } from './PublishPreview'
import { PublishForm } from './PublishForm'

export interface PublishDialogProps {
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

  const shareableUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/play/${slug}` : null
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
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <ModalHeader>
        <ModalTitle className="text-xl font-bold flex items-center gap-2">
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
        </ModalTitle>
        <ModalDescription className="text-sm">
          {isPublished
            ? 'Your story is live and can be shared with anyone.'
            : 'Make your story available for the world to play.'}
        </ModalDescription>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          {/* Status Messages */}
          <PublishStatus
            canPublish={canPublish}
            isPublished={isPublished}
            error={error}
          />

          {/* Story Preview */}
          <PublishPreview
            storyName={storyName}
            cardCount={cardCount}
            isPublished={isPublished}
          />

          {/* Shareable URL Form */}
          {isPublished && shareableUrl && (
            <PublishForm
              shareableUrl={shareableUrl}
              copied={copied}
              onCopyUrl={handleCopyUrl}
              onOpenPreview={handleOpenPreview}
            />
          )}
        </div>
      </ModalBody>

      <ModalFooter className="flex-row justify-end gap-2">
        {isPublished ? (
          <>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="publish-close-btn"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnpublish}
              disabled={isLoading}
              data-testid="publish-unpublish-btn"
            >
              {isLoading ? 'Unpublishing...' : 'Unpublish'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="publish-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={!canPublish || isLoading}
              data-testid="publish-submit-btn"
              className="halloween-candle-flicker"
            >
              {isLoading ? 'Publishing...' : 'Publish Story'}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
