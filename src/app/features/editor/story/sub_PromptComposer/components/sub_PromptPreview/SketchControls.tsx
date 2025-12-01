'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MAX_PROMPT_LENGTH } from '@/lib/promptComposer'
import { ModelSelector, type LeonardoModel } from '../ModelSelector'

interface SketchControlsProps {
  prompt: string
  sketchModel: LeonardoModel
  sketchModelExpanded: boolean
  sketchCount: number
  loading: boolean
  isGenerating: boolean
  onModelToggle: () => void
  onModelSelect: (model: LeonardoModel) => void
  onCountChange: (count: number) => void
  onGenerate: () => void
}

/**
 * Controls for generating sketch variations
 */
export function SketchControls({
  prompt,
  sketchModel,
  sketchModelExpanded,
  sketchCount,
  loading,
  isGenerating,
  onModelToggle,
  onModelSelect,
  onCountChange,
  onGenerate,
}: SketchControlsProps) {
  const isPromptTooLong = prompt.length > MAX_PROMPT_LENGTH

  return (
    <div className="space-y-3" data-testid="prompt-preview-sketch-controls">
      <ModelSelector
        selectedModel={sketchModel}
        isExpanded={sketchModelExpanded}
        loading={loading}
        modelType="sketch"
        onToggle={onModelToggle}
        onSelect={(model) => onModelSelect(model)}
      />

      <div className="flex items-center justify-between">
        <label id="sketch-count-label" className="text-xs font-medium text-muted-foreground">
          Number of Sketches
        </label>
        <div className="flex items-center gap-1" role="radiogroup" aria-labelledby="sketch-count-label">
          {[1, 2, 3, 4].map((count) => (
            <button
              key={count}
              role="radio"
              aria-checked={sketchCount === count}
              onClick={() => onCountChange(count)}
              disabled={loading}
              className={cn(
                'w-8 h-8 text-xs font-medium rounded border-2 transition-all',
                sketchCount === count
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:border-primary/50'
              )}
              data-testid={`prompt-preview-sketch-count-${count}`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>
      <p id="sketch-count-hint" className="text-xs text-muted-foreground">
        Quick low-res previews with AI-generated prompt variations
      </p>

      <Button
        onClick={onGenerate}
        disabled={loading || !prompt || isPromptTooLong}
        aria-busy={isGenerating}
        aria-describedby="sketch-count-hint"
        className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
        data-testid="prompt-preview-generate-sketches-btn"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            Generating {sketchCount} Sketches...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
            Generate {sketchCount} Sketch{sketchCount > 1 ? 'es' : ''}
          </>
        )}
      </Button>
    </div>
  )
}
