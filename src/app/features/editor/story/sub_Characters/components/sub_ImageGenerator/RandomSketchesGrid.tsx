'use client'

import { useState, useCallback } from 'react'
import { Loader2, Plus, X, Check, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RandomSketch {
  url: string
  prompt: string
  generationId?: string
  selected?: boolean
}

interface RandomSketchesGridProps {
  sketches: RandomSketch[]
  loading: boolean
  isSaving: boolean
  currentImageCount: number
  maxImages?: number
  onAddSelected: (selected: Array<{ url: string; prompt: string }>) => Promise<void>
  onClear: () => void
  onRegenerate: () => void
}

/**
 * RandomSketchesGrid - Display and select random AI-generated character poses
 */
export function RandomSketchesGrid({
  sketches,
  loading,
  isSaving,
  currentImageCount,
  maxImages = 10,
  onAddSelected,
  onClear,
  onRegenerate,
}: RandomSketchesGridProps) {
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [isAdding, setIsAdding] = useState(false)

  const availableSlots = maxImages - currentImageCount
  const selectedCount = selectedIndices.size

  const handleToggleSelect = useCallback((index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIndices.size === sketches.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(sketches.map((_, i) => i)))
    }
  }, [selectedIndices.size, sketches.length])

  const handleAddSelected = useCallback(async () => {
    if (selectedCount === 0) return

    const selected = sketches
      .filter((_, i) => selectedIndices.has(i))
      .slice(0, availableSlots)
      .map(s => ({ url: s.url, prompt: s.prompt }))

    setIsAdding(true)
    try {
      await onAddSelected(selected)
      // Clear selection after adding
      setSelectedIndices(new Set())
    } finally {
      setIsAdding(false)
    }
  }, [selectedCount, sketches, selectedIndices, availableSlots, onAddSelected])

  const handleClearAll = useCallback(() => {
    setSelectedIndices(new Set())
    onClear()
  }, [onClear])

  const allSelected = selectedIndices.size === sketches.length

  return (
    <div className="space-y-3 rounded-xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-orange-500/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-sm">Random Poses</span>
          <span className="text-xs text-muted-foreground">
            ({selectedCount} selected)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="text-xs text-primary hover:underline"
            disabled={loading || isAdding}
          >
            {allSelected ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={handleClearAll}
            className="p-1 rounded-lg hover:bg-background/50 transition-colors"
            title="Clear random poses"
            disabled={loading || isAdding}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Grid - 2 columns x 4 rows for larger images with portrait aspect ratio */}
      <div className="grid grid-cols-2 gap-3">
        {sketches.map((sketch, index) => {
          const isSelected = selectedIndices.has(index)
          return (
            <button
              key={index}
              onClick={() => handleToggleSelect(index)}
              disabled={loading || isAdding || isSaving}
              className={cn(
                'relative rounded-lg overflow-hidden border-2 transition-all',
                'focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                isSelected
                  ? 'border-amber-500 shadow-md scale-[1.01]'
                  : 'border-border hover:border-amber-500/50'
              )}
              style={{ aspectRatio: '736 / 1120' }} // Same ratio as sketch generation (portrait 2:3)
            >
              <img
                src={sketch.url}
                alt={`Pose ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Selection Overlay */}
              {isSelected && (
                <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}

              {/* Pose Number */}
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/60 text-xs text-white font-medium">
                {index + 1}
              </div>
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {selectedCount > 0 && (
          <Button
            onClick={handleAddSelected}
            disabled={isAdding || isSaving}
            className={cn(
              'flex-1 border-2 border-amber-500/50',
              'bg-gradient-to-r from-amber-500 to-orange-500',
              'hover:from-amber-600 hover:to-orange-600',
              'text-white',
              'shadow-[2px_2px_0px_0px_hsl(var(--border))]'
            )}
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add {Math.min(selectedCount, availableSlots)} to Character
                {selectedCount > availableSlots && (
                  <span className="text-xs opacity-70 ml-1">
                    (max {availableSlots})
                  </span>
                )}
              </>
            )}
          </Button>
        )}

        <Button
          onClick={onRegenerate}
          disabled={loading || isAdding || isSaving}
          variant={selectedCount > 0 ? 'outline' : 'default'}
          className={cn(
            selectedCount > 0 ? 'border-2' : 'flex-1 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]'
          )}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Shuffle className="w-4 h-4 mr-2" />
              {selectedCount > 0 ? 'New Poses' : 'Generate New Poses'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default RandomSketchesGrid
