import { useState, useCallback, useRef } from 'react'
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

    const [focusedIndex, setFocusedIndex] = useState<number>(-1)
    const listRef = useRef<HTMLDivElement>(null)

    const headerId = `model-selector-${modelType}-header`
    const panelId = `model-selector-${modelType}-panel`

    // Handle keyboard navigation for header
    const handleHeaderKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
        }
    }, [onToggle])

    // Handle keyboard navigation for model list
    const handleListKeyDown = useCallback((e: React.KeyboardEvent) => {
        const numModels = models.length
        let newIndex = focusedIndex

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                newIndex = Math.min(focusedIndex + 1, numModels - 1)
                break
            case 'ArrowUp':
                e.preventDefault()
                newIndex = Math.max(focusedIndex - 1, 0)
                break
            case 'Home':
                e.preventDefault()
                newIndex = 0
                break
            case 'End':
                e.preventDefault()
                newIndex = numModels - 1
                break
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (focusedIndex >= 0 && focusedIndex < numModels) {
                    onSelect(models[focusedIndex].id)
                }
                return
            case 'Escape':
                e.preventDefault()
                onToggle()
                return
            default:
                return
        }

        setFocusedIndex(newIndex)
        const modelButtons = listRef.current?.querySelectorAll('[role="option"]')
        if (modelButtons && modelButtons[newIndex]) {
            (modelButtons[newIndex] as HTMLElement).focus()
        }
    }, [focusedIndex, models, onSelect, onToggle])

    return (
        <div
            className="border-2 border-border rounded-lg bg-card overflow-hidden"
            data-testid={`model-selector-${modelType}`}
        >
            {/* Header */}
            <button
                id={headerId}
                onClick={onToggle}
                onKeyDown={handleHeaderKeyDown}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                disabled={loading}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                data-testid={`model-selector-${modelType}-header`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true"><Icon className="w-5 h-5" /></span>
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
                    <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="sr-only">
                    {isExpanded ? `Collapse ${title} options` : `Expand ${title} options`}
                </span>
            </button>

            {/* Options */}
            {isExpanded && (
                <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    className="border-t border-border p-2 bg-muted/30"
                    data-testid={`model-selector-${modelType}-panel`}
                >
                    <div
                        ref={listRef}
                        className="grid grid-cols-1 gap-1.5"
                        role="listbox"
                        aria-label={`${title} options`}
                        aria-activedescendant={focusedIndex >= 0 ? `model-option-${modelType}-${focusedIndex}` : undefined}
                        onKeyDown={handleListKeyDown}
                    >
                        {models.map((model, index) => {
                            const isSelected = selectedModel === model.id
                            const isFocused = focusedIndex === index

                            return (
                                <button
                                    key={model.id}
                                    id={`model-option-${modelType}-${index}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => onSelect(model.id)}
                                    onFocus={() => setFocusedIndex(index)}
                                    disabled={loading}
                                    tabIndex={isFocused || (focusedIndex === -1 && index === 0) ? 0 : -1}
                                    className={cn(
                                        'flex items-center justify-between p-2 rounded border-2 transition-all text-left',
                                        'hover:bg-muted active:scale-[0.98]',
                                        isSelected
                                            ? 'bg-primary/10 border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                                            : 'border-border hover:border-border/80',
                                        loading && 'opacity-50 cursor-not-allowed'
                                    )}
                                    data-testid={`model-selector-${modelType}-option-${model.id}`}
                                >
                                    <div>
                                        <div className="text-xs font-bold">{model.label}</div>
                                        <div className="text-[10px] text-muted-foreground">{model.description}</div>
                                    </div>
                                    {isSelected && <div className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
