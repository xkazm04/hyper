import { ChevronDown, ChevronUp, Sparkles, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// Sketch models (fast, lower quality)
export type SketchModel = 'phoenix_1.0' | 'phoenix_0.9' | 'flux_speed' | 'flux_dev'

// Final models (production quality)
export type FinalModel = 'phoenix_1.0' | 'flux_2'

export type LeonardoModel = SketchModel | FinalModel

interface ModelOption {
    id: LeonardoModel
    label: string
    description: string
}

// Models for sketch generation (fast previews)
export const SKETCH_MODELS: ModelOption[] = [
    { id: 'phoenix_1.0', label: 'Phoenix 1.0', description: 'High quality general purpose' },
    { id: 'phoenix_0.9', label: 'Phoenix 0.9', description: 'Previous version' },
    { id: 'flux_speed', label: 'Flux Speed', description: 'Fast Flux model' },
    { id: 'flux_dev', label: 'Flux Dev', description: 'Development Flux model' },
]

// Models for final image generation (production quality)
export const FINAL_MODELS: ModelOption[] = [
    { id: 'phoenix_1.0', label: 'Phoenix 1.0', description: 'High quality general purpose' },
    { id: 'flux_2', label: 'Flux Pro 2.0', description: 'Premium production model (API v2)' },
]

interface ModelSelectorProps {
    selectedModel: LeonardoModel
    isExpanded: boolean
    loading: boolean
    modelType?: 'sketch' | 'final'
    onToggle: () => void
    onSelect: (model: LeonardoModel) => void
}

export function ModelSelector({
    selectedModel,
    isExpanded,
    loading,
    modelType = 'sketch',
    onToggle,
    onSelect,
}: ModelSelectorProps) {
    const models = modelType === 'final' ? FINAL_MODELS : SKETCH_MODELS
    const selected = models.find(m => m.id === selectedModel) || models[0]
    const Icon = modelType === 'final' ? ImageIcon : Sparkles
    const title = modelType === 'final' ? 'Final Model' : 'Sketch Model'

    return (
        <div className="border-2 border-border rounded-lg bg-card overflow-hidden">
            {/* Header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                disabled={loading}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg"><Icon className="w-5 h-5" /></span>
                    <div className="text-left">
                        <div className="text-sm font-semibold">{title}</div>
                        {selected && (
                            <div className="text-xs text-primary flex items-center gap-1">
                                <span>{selected.label}</span>
                            </div>
                        )}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {/* Options */}
            {isExpanded && (
                <div className="border-t border-border p-2 bg-muted/30">
                    <div className="grid grid-cols-1 gap-1.5">
                        {models.map((model) => {
                            const isSelected = selectedModel === model.id

                            return (
                                <button
                                    key={model.id}
                                    onClick={() => onSelect(model.id)}
                                    disabled={loading}
                                    className={cn(
                                        'flex items-center justify-between p-2 rounded border-2 transition-all text-left',
                                        'hover:bg-muted active:scale-[0.98]',
                                        isSelected
                                            ? 'bg-primary/10 border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                                            : 'border-border hover:border-border/80',
                                        loading && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    <div>
                                        <div className="text-xs font-bold">{model.label}</div>
                                        <div className="text-[10px] text-muted-foreground">{model.description}</div>
                                    </div>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
