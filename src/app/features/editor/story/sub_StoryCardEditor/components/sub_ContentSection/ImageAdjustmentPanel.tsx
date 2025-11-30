'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, CircleDashed, Maximize, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImageCompareModal } from './ImageCompareModal'

type BriaAction = 'blur' | 'enhance' | 'expand'

interface ImageAdjustmentPanelProps {
  imageUrl: string
  onImageUpdate: (newImageUrl: string) => void
  disabled?: boolean
}

const ACTIONS: Array<{
  id: BriaAction
  label: string
  shortLabel: string
  icon: typeof CircleDashed
  description: string
}> = [
  {
    id: 'blur',
    label: 'Blur Background',
    shortLabel: 'Blur BG',
    icon: CircleDashed,
    description: 'Blur the background to focus on subjects',
  },
  {
    id: 'enhance',
    label: 'Enhance 2x',
    shortLabel: 'Enhance',
    icon: Maximize,
    description: 'Double resolution with detail enhancement',
  },
  {
    id: 'expand',
    label: 'Zoom Out',
    shortLabel: 'Expand',
    icon: ZoomOut,
    description: 'Expand image to show more of the scene',
  },
]

/**
 * ImageAdjustmentPanel - Bria AI image processing controls
 * Only shown when Bria API is available and image is saved
 */
export function ImageAdjustmentPanel({
  imageUrl,
  onImageUpdate,
  disabled = false,
}: ImageAdjustmentPanelProps) {
  const [isBriaAvailable, setIsBriaAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [processingAction, setProcessingAction] = useState<BriaAction | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Compare modal state
  const [compareModal, setCompareModal] = useState<{
    isOpen: boolean
    processedUrl: string
    actionLabel: string
  }>({
    isOpen: false,
    processedUrl: '',
    actionLabel: '',
  })

  // Check if Bria API is available
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/ai/bria/status')
        const data = await response.json()
        setIsBriaAvailable(data.available)
      } catch {
        setIsBriaAvailable(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAvailability()
  }, [])

  const handleProcess = useCallback(async (action: BriaAction) => {
    if (processingAction || disabled) return

    setProcessingAction(action)
    setError(null)

    try {
      const response = await fetch('/api/ai/bria/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, action }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process image')
      }

      const data = await response.json()

      // Open compare modal
      const actionConfig = ACTIONS.find(a => a.id === action)
      setCompareModal({
        isOpen: true,
        processedUrl: data.resultUrl,
        actionLabel: actionConfig?.label || action,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
    } finally {
      setProcessingAction(null)
    }
  }, [imageUrl, processingAction, disabled])

  const handleKeepOriginal = useCallback(() => {
    setCompareModal({ isOpen: false, processedUrl: '', actionLabel: '' })
  }, [])

  const handleUseProcessed = useCallback(() => {
    onImageUpdate(compareModal.processedUrl)
    setCompareModal({ isOpen: false, processedUrl: '', actionLabel: '' })
  }, [compareModal.processedUrl, onImageUpdate])

  const handleCloseModal = useCallback(() => {
    setCompareModal({ isOpen: false, processedUrl: '', actionLabel: '' })
  }, [])

  // Don't render if checking or not available
  if (isChecking || !isBriaAvailable) {
    return null
  }

  return (
    <>
      <div className="space-y-2">
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
          Adjust Image
        </div>

        <div className="flex gap-1.5">
          {ACTIONS.map(({ id, shortLabel, icon: Icon, description }) => {
            const isProcessing = processingAction === id
            const isDisabled = disabled || !!processingAction

            return (
              <Button
                key={id}
                size="sm"
                variant="outline"
                onClick={() => handleProcess(id)}
                disabled={isDisabled}
                title={description}
                className={cn(
                  'flex-1 h-8 text-[10px] px-2',
                  isProcessing && 'opacity-70'
                )}
              >
                {isProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <Icon className="w-3 h-3 mr-1" />
                    {shortLabel}
                  </>
                )}
              </Button>
            )
          })}
        </div>

        {error && (
          <p className="text-[10px] text-destructive">{error}</p>
        )}
      </div>

      {/* Compare Modal */}
      <ImageCompareModal
        isOpen={compareModal.isOpen}
        originalUrl={imageUrl}
        processedUrl={compareModal.processedUrl}
        actionLabel={compareModal.actionLabel}
        onKeepOriginal={handleKeepOriginal}
        onUseProcessed={handleUseProcessed}
        onClose={handleCloseModal}
      />
    </>
  )
}
