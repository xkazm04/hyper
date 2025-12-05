'use client'

import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import { GeneratedSketch } from './lib/types'

// ============================================================================
// Sketch Picker - Grid for selecting generated image sketches
// ============================================================================

interface SketchPickerProps {
  sketches: GeneratedSketch[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  onApply: () => void
  onCancel: () => void
  isHalloween?: boolean
}

export function SketchPicker({
  sketches,
  selectedIndex,
  onSelect,
  onApply,
  onCancel,
  isHalloween,
}: SketchPickerProps) {
  return (
    <div
      className={cn(
        'space-y-3 p-3 rounded-lg border',
        isHalloween
          ? 'bg-purple-900/30 border-purple-500/30'
          : 'bg-muted/30 border-border'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Select a sketch
        </span>
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>

      {/* Larger sketch grid for better evaluation */}
      <div className="grid grid-cols-3 gap-3">
        {sketches.map((sketch, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={cn(
              'relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all',
              'min-h-[120px]',
              selectedIndex === index
                ? isHalloween
                  ? 'border-orange-500 ring-2 ring-orange-500/30 scale-[1.02]'
                  : 'border-primary ring-2 ring-primary/30 scale-[1.02]'
                : 'border-border hover:border-primary/50 hover:scale-[1.01]'
            )}
          >
            <img
              src={sketch.url}
              alt={`Sketch ${index + 1}`}
              className="w-full h-full object-cover"
            />
            {selectedIndex === index && (
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  isHalloween ? 'bg-orange-500/30' : 'bg-primary/20'
                )}
              >
                <Check className="w-8 h-8 text-white drop-shadow-lg" />
              </div>
            )}
            {/* Sketch number badge */}
            <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{index + 1}</span>
            </div>
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <button
          onClick={onApply}
          className={cn(
            'w-full py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
            isHalloween
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <Check className="w-4 h-4" />
          Use Selected
        </button>
      )}
    </div>
  )
}
