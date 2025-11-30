'use client'

import { useState } from 'react'
import { X, Check, RotateCcw, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageCompareModalProps {
  isOpen: boolean
  originalUrl: string
  processedUrl: string
  actionLabel: string
  onKeepOriginal: () => void
  onUseProcessed: () => void
  onClose: () => void
}

type CompareMode = 'side-by-side' | 'slider'

/**
 * ImageCompareModal - Full screen modal for comparing before/after images
 */
export function ImageCompareModal({
  isOpen,
  originalUrl,
  processedUrl,
  actionLabel,
  onKeepOriginal,
  onUseProcessed,
  onClose,
}: ImageCompareModalProps) {
  const [compareMode, setCompareMode] = useState<CompareMode>('side-by-side')
  const [sliderPosition, setSliderPosition] = useState(50)

  if (!isOpen) return null

  const handleSliderMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100
    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">
            Compare: {actionLabel}
          </h2>
          <div className="flex bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setCompareMode('side-by-side')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                compareMode === 'side-by-side'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white'
              )}
            >
              Side by Side
            </button>
            <button
              onClick={() => setCompareMode('slider')}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                compareMode === 'slider'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white'
              )}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 inline mr-1" />
              Slider
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        {compareMode === 'side-by-side' ? (
          <div className="h-full flex gap-4">
            {/* Original */}
            <div className="flex-1 flex flex-col">
              <div className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
                Original
              </div>
              <div className="flex-1 relative rounded-lg overflow-hidden border border-white/20">
                <img
                  src={originalUrl}
                  alt="Original"
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            </div>

            {/* Processed */}
            <div className="flex-1 flex flex-col">
              <div className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
                Processed ({actionLabel})
              </div>
              <div className="flex-1 relative rounded-lg overflow-hidden border border-primary/50 ring-2 ring-primary/20">
                <img
                  src={processedUrl}
                  alt="Processed"
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="text-xs font-medium text-white/60 uppercase tracking-wide mb-2">
              Drag to compare
            </div>
            <div
              className="flex-1 relative rounded-lg overflow-hidden border border-white/20 cursor-ew-resize"
              onMouseMove={handleSliderMove}
            >
              {/* Original (full width, clipped) */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={originalUrl}
                  alt="Original"
                  className="w-full h-full object-contain bg-black"
                  draggable={false}
                />
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
                  Original
                </div>
              </div>

              {/* Processed (full width, clipped) */}
              <div
                className="absolute inset-0"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <img
                  src={processedUrl}
                  alt="Processed"
                  className="w-full h-full object-contain bg-black"
                  draggable={false}
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-primary/80 rounded text-xs text-white">
                  {actionLabel}
                </div>
              </div>

              {/* Slider line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 flex items-center justify-center gap-4 px-6 py-4 border-t border-white/10">
        <Button
          variant="outline"
          onClick={onKeepOriginal}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Keep Original
        </Button>
        <Button
          onClick={onUseProcessed}
          className="bg-primary hover:bg-primary/90"
        >
          <Check className="w-4 h-4 mr-2" />
          Use Processed Image
        </Button>
      </div>
    </div>
  )
}
