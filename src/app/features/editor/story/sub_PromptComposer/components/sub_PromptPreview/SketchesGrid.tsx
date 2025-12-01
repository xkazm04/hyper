'use client'

import { Check, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { ModelSelector, type LeonardoModel } from '../ModelSelector'
import type { GeneratedImage } from './types'

interface SketchesGridProps {
  sketches: GeneratedImage[]
  selectedIndex: number | null
  finalModel: LeonardoModel
  finalModelExpanded: boolean
  finalQuality: 'high' | 'premium'
  loading: boolean
  isGeneratingFinal: boolean
  onSelect: (index: number) => void
  onStartOver: () => void
  onModelToggle: () => void
  onModelSelect: (model: LeonardoModel) => void
  onQualityChange: (quality: 'high' | 'premium') => void
  onUseSketch: () => void
  onGenerateFinal: () => void
}

/**
 * Grid of generated sketches with selection and actions
 */
export function SketchesGrid({
  sketches,
  selectedIndex,
  finalModel,
  finalModelExpanded,
  finalQuality,
  loading,
  isGeneratingFinal,
  onSelect,
  onStartOver,
  onModelToggle,
  onModelSelect,
  onQualityChange,
  onUseSketch,
  onGenerateFinal,
}: SketchesGridProps) {
  return (
    <div className="space-y-3" data-testid="prompt-preview-sketches">
      <div className="flex items-center justify-between">
        <span
          id="sketches-label"
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
        >
          Select a Sketch
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onStartOver}
          className="h-6 text-xs"
          disabled={loading}
          data-testid="prompt-preview-start-over-btn"
        >
          Start Over
        </Button>
      </div>

      <div
        className={cn(
          'grid gap-2',
          sketches.length === 1
            ? 'grid-cols-1'
            : sketches.length === 2
              ? 'grid-cols-2'
              : sketches.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2'
        )}
        role="listbox"
        aria-labelledby="sketches-label"
        data-testid="prompt-preview-sketches-grid"
      >
        {sketches.map((sketch, index) => {
          const isSelected = selectedIndex === index
          return (
            <button
              key={index}
              role="option"
              aria-selected={isSelected}
              aria-label={`Sketch ${index + 1}${isSelected ? ', selected' : ''}`}
              onClick={() => onSelect(index)}
              disabled={loading}
              className={cn(
                'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                'hover:opacity-90 active:scale-[0.98]',
                isSelected
                  ? 'border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                  : 'border-border hover:border-border/80'
              )}
              data-testid={`prompt-preview-sketch-${index}`}
            >
              <img src={sketch.url} alt="" aria-hidden="true" className="w-full h-full object-cover" />
              {isSelected && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-4 h-4" aria-hidden="true" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
                <span className="text-[10px] text-white font-medium">Sketch {index + 1}</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Sketch Actions (shown when a sketch is selected) */}
      {selectedIndex !== null && (
        <div className="space-y-3" data-testid="prompt-preview-sketch-actions">
          <ModelSelector
            selectedModel={finalModel}
            isExpanded={finalModelExpanded}
            loading={loading}
            modelType="final"
            onToggle={onModelToggle}
            onSelect={(model) => onModelSelect(model)}
          />

          <div className="flex items-center gap-2">
            <label id="final-quality-label" className="text-xs font-medium text-muted-foreground">
              Final Quality:
            </label>
            <div className="flex gap-1" role="radiogroup" aria-labelledby="final-quality-label">
              {(Object.keys(FINAL_QUALITY_PRESETS) as Array<'high' | 'premium'>).map((key) => (
                <button
                  key={key}
                  role="radio"
                  aria-checked={finalQuality === key}
                  onClick={() => onQualityChange(key)}
                  disabled={loading}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded border-2 transition-all',
                    finalQuality === key
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background hover:border-primary/50'
                  )}
                  data-testid={`prompt-preview-quality-${key}`}
                >
                  {FINAL_QUALITY_PRESETS[key].name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2" role="group" aria-label="Sketch actions">
            <Button
              onClick={onUseSketch}
              disabled={loading}
              variant="outline"
              className="flex-1 border-2"
              data-testid="prompt-preview-use-sketch-btn"
            >
              <Check className="w-4 h-4 mr-2" aria-hidden="true" />
              Use Sketch
            </Button>
            <Button
              onClick={onGenerateFinal}
              disabled={loading}
              aria-busy={isGeneratingFinal}
              className="flex-1 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
              data-testid="prompt-preview-generate-final-btn"
            >
              {isGeneratingFinal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                  Generating...
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 mr-2" aria-hidden="true" />
                  Generate Final
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
