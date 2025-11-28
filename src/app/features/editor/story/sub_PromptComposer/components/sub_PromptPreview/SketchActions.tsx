import { Check, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { ModelSelector, FinalModel } from '../ModelSelector'

interface SketchActionsProps {
    finalModel: FinalModel
    finalModelExpanded: boolean
    finalQuality: 'high' | 'premium'
    loading: boolean
    isGeneratingFinal: boolean
    onFinalModelToggle: () => void
    onFinalModelSelect: (model: FinalModel) => void
    onQualityChange: (quality: 'high' | 'premium') => void
    onUseSketch: () => void
    onGenerateFinal: () => void
}

export function SketchActions({
    finalModel, finalModelExpanded, finalQuality, loading, isGeneratingFinal,
    onFinalModelToggle, onFinalModelSelect, onQualityChange, onUseSketch, onGenerateFinal
}: SketchActionsProps) {
    return (
        <div className="space-y-3" data-testid="prompt-preview-sketch-actions">
            <ModelSelector
                selectedModel={finalModel}
                isExpanded={finalModelExpanded}
                loading={loading}
                modelType="final"
                onToggle={onFinalModelToggle}
                onSelect={(model) => onFinalModelSelect(model as FinalModel)}
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
                                "px-2 py-1 text-xs font-medium rounded border-2 transition-all",
                                finalQuality === key
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background hover:border-primary/50"
                            )}
                            data-testid={`prompt-preview-quality-${key}`}
                        >
                            {FINAL_QUALITY_PRESETS[key].name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2" role="group" aria-label="Sketch actions">
                <Button onClick={onUseSketch} disabled={loading} variant="outline" className="flex-1 border-2" data-testid="prompt-preview-use-sketch-btn">
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
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />Generating...</>
                    ) : (
                        <><ImageIcon className="w-4 h-4 mr-2" aria-hidden="true" />Generate Final</>
                    )}
                </Button>
            </div>
        </div>
    )
}
