import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FinalModel } from '../ModelSelector'
import { SketchActions } from './SketchActions'

interface GeneratedImage {
    url: string
    width: number
    height: number
    prompt?: string
    variationIndex?: number
}

interface SketchesGridProps {
    sketches: GeneratedImage[]
    selectedSketchIndex: number | null
    finalModel: FinalModel
    finalModelExpanded: boolean
    finalQuality: 'high' | 'premium'
    loading: boolean
    isGeneratingFinal: boolean
    onSketchSelect: (index: number) => void
    onStartOver: () => void
    onFinalModelToggle: () => void
    onFinalModelSelect: (model: FinalModel) => void
    onQualityChange: (quality: 'high' | 'premium') => void
    onUseSketch: () => void
    onGenerateFinal: () => void
}

export function SketchesGrid({
    sketches, selectedSketchIndex, finalModel, finalModelExpanded, finalQuality,
    loading, isGeneratingFinal, onSketchSelect, onStartOver, onFinalModelToggle,
    onFinalModelSelect, onQualityChange, onUseSketch, onGenerateFinal
}: SketchesGridProps) {
    return (
        <div className="space-y-3" data-testid="prompt-preview-sketches">
            <div className="flex items-center justify-between">
                <span id="sketches-label" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Select a Sketch
                </span>
                <Button size="sm" variant="ghost" onClick={onStartOver} className="h-6 text-xs" disabled={loading} data-testid="prompt-preview-start-over-btn">
                    Start Over
                </Button>
            </div>

            <div
                className={cn("grid gap-2", sketches.length === 1 ? "grid-cols-1" : sketches.length === 2 ? "grid-cols-2" : sketches.length === 3 ? "grid-cols-3" : "grid-cols-2")}
                role="listbox"
                aria-labelledby="sketches-label"
                data-testid="prompt-preview-sketches-grid"
            >
                {sketches.map((sketch, index) => {
                    const isSelected = selectedSketchIndex === index
                    return (
                        <button
                            key={index}
                            role="option"
                            aria-selected={isSelected}
                            aria-label={`Sketch ${index + 1}${isSelected ? ', selected' : ''}`}
                            onClick={() => onSketchSelect(index)}
                            disabled={loading}
                            className={cn(
                                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                "hover:opacity-90 active:scale-[0.98]",
                                isSelected ? "border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]" : "border-border hover:border-border/80"
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

            {selectedSketchIndex !== null && (
                <SketchActions
                    finalModel={finalModel}
                    finalModelExpanded={finalModelExpanded}
                    finalQuality={finalQuality}
                    loading={loading}
                    isGeneratingFinal={isGeneratingFinal}
                    onFinalModelToggle={onFinalModelToggle}
                    onFinalModelSelect={onFinalModelSelect}
                    onQualityChange={onQualityChange}
                    onUseSketch={onUseSketch}
                    onGenerateFinal={onGenerateFinal}
                />
            )}
        </div>
    )
}
