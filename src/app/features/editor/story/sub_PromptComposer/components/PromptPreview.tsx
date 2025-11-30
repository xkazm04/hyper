'use client'

import { useState, useCallback } from 'react'
import { Check, Copy, ChevronDown, ChevronUp, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MAX_PROMPT_LENGTH } from '@/lib/promptComposer'
import { SKETCH_QUALITY_PRESETS, FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { deleteGenerations } from '@/lib/services/sketchCleanup'
import { ModelSelector, SketchModel, FinalModel } from './ModelSelector'

// ============================================================================
// Types
// ============================================================================

interface GeneratedImage {
    url: string
    width: number
    height: number
    prompt?: string
    variationIndex?: number
    generationId?: string
    imageId?: string
}

interface PromptVariation {
    variation: string
    focusArea: string
}

interface PromptPreviewProps {
    prompt: string
    copied: boolean
    loading: boolean
    onCopy: () => void
    onImageSelect?: (imageUrl: string, prompt: string) => void
}

// ============================================================================
// Internal Hook: usePromptPreview
// ============================================================================

function usePromptPreviewState(prompt: string, externalLoading: boolean, onImageSelect?: (imageUrl: string, prompt: string) => void) {
    const [isPromptExpanded, setIsPromptExpanded] = useState(false)
    const [sketchModel, setSketchModel] = useState<SketchModel>('phoenix_1.0')
    const [finalModel, setFinalModel] = useState<FinalModel>('flux_2')
    const [sketchModelExpanded, setSketchModelExpanded] = useState(false)
    const [finalModelExpanded, setFinalModelExpanded] = useState(false)
    const [sketchCount, setSketchCount] = useState(4)
    const [sketches, setSketches] = useState<GeneratedImage[]>([])
    const [isGeneratingSketches, setIsGeneratingSketches] = useState(false)
    const [selectedSketchIndex, setSelectedSketchIndex] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
    const [finalImage, setFinalImage] = useState<GeneratedImage | null>(null)
    const [finalQuality, setFinalQuality] = useState<'high' | 'premium'>('high')
    const [generationIds, setGenerationIds] = useState<string[]>([])

    const loading = externalLoading || isGeneratingSketches || isGeneratingFinal
    const showSketchControls = sketches.length === 0 && !finalImage

    const handleGenerateSketches = useCallback(async () => {
        if (!prompt) return
        setIsGeneratingSketches(true)
        setError(null)
        setSketches([])
        setSelectedSketchIndex(null)
        setFinalImage(null)
        try {
            const variationResponse = await fetch('/api/ai/prompt-variations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, count: sketchCount })
            })
            if (!variationResponse.ok) {
                const errorData = await variationResponse.json()
                throw new Error(errorData.error || 'Failed to generate prompt variations')
            }
            const variationData = await variationResponse.json()
            const variations: PromptVariation[] = variationData.variations
            const sketchPreset = SKETCH_QUALITY_PRESETS.quick
            const sketchPromises = variations.map(async (variation, index) => {
                const response = await fetch('/api/ai/generate-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        prompt: variation.variation,
                        numImages: 1,
                        width: sketchPreset.width,
                        height: sketchPreset.height,
                        provider: 'leonardo',
                        model: sketchModel
                    })
                })
                if (!response.ok) {
                    console.error(`Failed to generate sketch ${index + 1}`)
                    return null
                }
                const data = await response.json()
                const image = data.images?.[0]
                return image ? {
                    ...image,
                    prompt: variation.variation,
                    variationIndex: index,
                    generationId: data.generationId,
                    imageId: image.id
                } as GeneratedImage : null
            })
            const results = await Promise.all(sketchPromises)
            const validSketches = results.filter((s): s is GeneratedImage => s !== null)
            if (validSketches.length === 0) throw new Error('Failed to generate any sketches')
            setSketches(validSketches)
            const ids = validSketches.map(s => s.generationId).filter((id): id is string => !!id)
            setGenerationIds(ids)
        } catch (err) {
            console.error('Error generating sketches:', err)
            setError(err instanceof Error ? err.message : 'Failed to generate sketches')
        } finally {
            setIsGeneratingSketches(false)
        }
    }, [prompt, sketchCount, sketchModel])

    const handleGenerateFinal = useCallback(async () => {
        if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return
        const selectedSketch = sketches[selectedSketchIndex]
        if (!selectedSketch.prompt) return
        setIsGeneratingFinal(true)
        setError(null)
        setFinalImage(null)
        try {
            const qualityPreset = FINAL_QUALITY_PRESETS[finalQuality]
            const response = await fetch('/api/ai/generate-images', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: selectedSketch.prompt,
                    numImages: 1,
                    width: qualityPreset.width,
                    height: qualityPreset.height,
                    provider: 'leonardo',
                    model: finalModel
                })
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to generate final image')
            }
            const data = await response.json()
            const image = data.images?.[0]
            if (image) {
                setFinalImage({
                    ...image,
                    prompt: selectedSketch.prompt,
                    generationId: data.generationId,
                    imageId: image.id
                })
            } else {
                throw new Error('No image generated')
            }
        } catch (err) {
            console.error('Error generating final image:', err)
            setError(err instanceof Error ? err.message : 'Failed to generate final image')
        } finally {
            setIsGeneratingFinal(false)
        }
    }, [selectedSketchIndex, sketches, finalQuality, finalModel])

    const handleConfirmFinal = useCallback(() => {
        if (finalImage && finalImage.prompt) {
            onImageSelect?.(finalImage.url, finalImage.prompt)
            if (generationIds.length > 0) {
                deleteGenerations(generationIds)
            }
            setSketches([])
            setSelectedSketchIndex(null)
            setFinalImage(null)
            setGenerationIds([])
        }
    }, [finalImage, onImageSelect, generationIds])

    const handleUseSketch = useCallback(() => {
        if (selectedSketchIndex !== null && sketches[selectedSketchIndex]) {
            const sketch = sketches[selectedSketchIndex]
            onImageSelect?.(sketch.url, sketch.prompt || prompt)
            const selectedGenerationId = sketch.generationId
            const unusedGenerationIds = generationIds.filter(id => id !== selectedGenerationId)
            if (unusedGenerationIds.length > 0) {
                deleteGenerations(unusedGenerationIds)
            }
            setSketches([])
            setSelectedSketchIndex(null)
            setFinalImage(null)
            setGenerationIds([])
        }
    }, [selectedSketchIndex, sketches, prompt, onImageSelect, generationIds])

    const handleStartOver = useCallback(() => {
        if (generationIds.length > 0) {
            deleteGenerations(generationIds)
        }
        setSketches([])
        setSelectedSketchIndex(null)
        setGenerationIds([])
    }, [generationIds])

    const handleBackToSketches = useCallback(() => {
        setFinalImage(null)
        setSelectedSketchIndex(null)
    }, [])

    const togglePromptExpanded = useCallback(() => setIsPromptExpanded(p => !p), [])
    const toggleSketchModelExpanded = useCallback(() => setSketchModelExpanded(p => !p), [])
    const toggleFinalModelExpanded = useCallback(() => setFinalModelExpanded(p => !p), [])

    return {
        isPromptExpanded,
        sketchModel,
        finalModel,
        sketchModelExpanded,
        finalModelExpanded,
        sketchCount,
        sketches,
        isGeneratingSketches,
        selectedSketchIndex,
        error,
        isGeneratingFinal,
        finalImage,
        finalQuality,
        loading,
        showSketchControls,
        setSketchModel,
        setFinalModel,
        setSketchCount,
        setSelectedSketchIndex,
        setFinalQuality,
        handleGenerateSketches,
        handleGenerateFinal,
        handleConfirmFinal,
        handleUseSketch,
        handleStartOver,
        handleBackToSketches,
        togglePromptExpanded,
        toggleSketchModelExpanded,
        toggleFinalModelExpanded,
    }
}

// ============================================================================
// Main Component
// ============================================================================

export function PromptPreview({ prompt, copied, loading: externalLoading, onCopy, onImageSelect }: PromptPreviewProps) {
    const state = usePromptPreviewState(prompt, externalLoading, onImageSelect)
    const isPromptTooLong = prompt.length > MAX_PROMPT_LENGTH

    return (
        <section
            className="border-2 border-border rounded-lg bg-muted/50 p-3 space-y-3 halloween-fog-overlay"
            aria-label="Generated prompt preview"
            data-testid="prompt-preview"
        >
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <span
                    id="prompt-preview-label"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                    Generated Prompt
                </span>
                <div className="flex items-center gap-1" role="group" aria-label="Prompt actions">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={state.togglePromptExpanded}
                        className="h-6 text-xs"
                        disabled={state.loading}
                        aria-expanded={state.isPromptExpanded}
                        aria-controls="prompt-text-container"
                        data-testid="prompt-preview-expand-btn"
                    >
                        {state.isPromptExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3 mr-1" aria-hidden="true" />
                                Collapse
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3 mr-1" aria-hidden="true" />
                                Expand
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onCopy}
                        className="h-6 text-xs"
                        disabled={state.loading}
                        aria-label={copied ? 'Prompt copied to clipboard' : 'Copy prompt to clipboard'}
                        data-testid="prompt-preview-copy-btn"
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 mr-1" aria-hidden="true" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3 mr-1" aria-hidden="true" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Content Section */}
            <div
                id="prompt-text-container"
                className={cn(
                    "text-xs text-foreground leading-relaxed overflow-hidden transition-all duration-300",
                    state.isPromptExpanded ? "max-h-[500px] overflow-y-auto" : "max-h-20"
                )}
                aria-labelledby="prompt-preview-label"
            >
                <p className={cn(!state.isPromptExpanded && "line-clamp-4")}>
                    {prompt}
                </p>
            </div>

            {/* Prompt Stats */}
            <div
                className="flex items-center gap-2 text-xs text-muted-foreground"
                aria-live="polite"
                data-testid="prompt-preview-stats"
            >
                <span className={cn(isPromptTooLong && "text-destructive font-medium")}>
                    {prompt.length}/{MAX_PROMPT_LENGTH} characters
                </span>
                <span aria-hidden="true">•</span>
                <span>{prompt.split(/\s+/).length} words</span>
                {isPromptTooLong && (
                    <span className="text-destructive" role="alert">
                        <span aria-hidden="true">⚠️</span> Too long
                    </span>
                )}
            </div>

            {/* Error Display */}
            {state.error && (
                <div
                    className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-2"
                    role="alert"
                    data-testid="prompt-preview-error"
                >
                    <p className="text-xs text-destructive">{state.error}</p>
                </div>
            )}

            {/* Sketch Controls */}
            {state.showSketchControls && (
                <div className="space-y-3" data-testid="prompt-preview-sketch-controls">
                    <ModelSelector
                        selectedModel={state.sketchModel}
                        isExpanded={state.sketchModelExpanded}
                        loading={state.loading}
                        modelType="sketch"
                        onToggle={state.toggleSketchModelExpanded}
                        onSelect={(model) => state.setSketchModel(model as SketchModel)}
                    />

                    <div className="flex items-center justify-between">
                        <label
                            id="sketch-count-label"
                            className="text-xs font-medium text-muted-foreground"
                        >
                            Number of Sketches
                        </label>
                        <div
                            className="flex items-center gap-1"
                            role="radiogroup"
                            aria-labelledby="sketch-count-label"
                        >
                            {[1, 2, 3, 4].map((count) => (
                                <button
                                    key={count}
                                    role="radio"
                                    aria-checked={state.sketchCount === count}
                                    onClick={() => state.setSketchCount(count)}
                                    disabled={state.loading}
                                    className={cn(
                                        "w-8 h-8 text-xs font-medium rounded border-2 transition-all",
                                        state.sketchCount === count
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background hover:border-primary/50"
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
                        onClick={state.handleGenerateSketches}
                        disabled={state.loading || !prompt || isPromptTooLong}
                        aria-busy={state.isGeneratingSketches}
                        aria-describedby="sketch-count-hint"
                        className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                        data-testid="prompt-preview-generate-sketches-btn"
                    >
                        {state.isGeneratingSketches ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                                Generating {state.sketchCount} Sketches...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                                Generate {state.sketchCount} Sketch{state.sketchCount > 1 ? 'es' : ''}
                            </>
                        )}
                    </Button>
                </div>
            )}

            {/* Sketches Grid */}
            {state.sketches.length > 0 && !state.finalImage && (
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
                            onClick={state.handleStartOver}
                            className="h-6 text-xs"
                            disabled={state.loading}
                            data-testid="prompt-preview-start-over-btn"
                        >
                            Start Over
                        </Button>
                    </div>

                    <div
                        className={cn(
                            "grid gap-2",
                            state.sketches.length === 1 ? "grid-cols-1" :
                            state.sketches.length === 2 ? "grid-cols-2" :
                            state.sketches.length === 3 ? "grid-cols-3" : "grid-cols-2"
                        )}
                        role="listbox"
                        aria-labelledby="sketches-label"
                        data-testid="prompt-preview-sketches-grid"
                    >
                        {state.sketches.map((sketch, index) => {
                            const isSelected = state.selectedSketchIndex === index
                            return (
                                <button
                                    key={index}
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-label={`Sketch ${index + 1}${isSelected ? ', selected' : ''}`}
                                    onClick={() => state.setSelectedSketchIndex(index)}
                                    disabled={state.loading}
                                    className={cn(
                                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                        "hover:opacity-90 active:scale-[0.98]",
                                        isSelected
                                            ? "border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]"
                                            : "border-border hover:border-border/80"
                                    )}
                                    data-testid={`prompt-preview-sketch-${index}`}
                                >
                                    <img
                                        src={sketch.url}
                                        alt=""
                                        aria-hidden="true"
                                        className="w-full h-full object-cover"
                                    />
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                                                <Check className="w-4 h-4" aria-hidden="true" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
                                        <span className="text-[10px] text-white font-medium">
                                            Sketch {index + 1}
                                        </span>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Sketch Actions (shown when a sketch is selected) */}
                    {state.selectedSketchIndex !== null && (
                        <div className="space-y-3" data-testid="prompt-preview-sketch-actions">
                            <ModelSelector
                                selectedModel={state.finalModel}
                                isExpanded={state.finalModelExpanded}
                                loading={state.loading}
                                modelType="final"
                                onToggle={state.toggleFinalModelExpanded}
                                onSelect={(model) => state.setFinalModel(model as FinalModel)}
                            />

                            <div className="flex items-center gap-2">
                                <label
                                    id="final-quality-label"
                                    className="text-xs font-medium text-muted-foreground"
                                >
                                    Final Quality:
                                </label>
                                <div
                                    className="flex gap-1"
                                    role="radiogroup"
                                    aria-labelledby="final-quality-label"
                                >
                                    {(Object.keys(FINAL_QUALITY_PRESETS) as Array<'high' | 'premium'>).map((key) => (
                                        <button
                                            key={key}
                                            role="radio"
                                            aria-checked={state.finalQuality === key}
                                            onClick={() => state.setFinalQuality(key)}
                                            disabled={state.loading}
                                            className={cn(
                                                "px-2 py-1 text-xs font-medium rounded border-2 transition-all",
                                                state.finalQuality === key
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
                                <Button
                                    onClick={state.handleUseSketch}
                                    disabled={state.loading}
                                    variant="outline"
                                    className="flex-1 border-2"
                                    data-testid="prompt-preview-use-sketch-btn"
                                >
                                    <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                                    Use Sketch
                                </Button>
                                <Button
                                    onClick={state.handleGenerateFinal}
                                    disabled={state.loading}
                                    aria-busy={state.isGeneratingFinal}
                                    className="flex-1 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                                    data-testid="prompt-preview-generate-final-btn"
                                >
                                    {state.isGeneratingFinal ? (
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
            )}

            {/* Final Image View */}
            {state.finalImage && (
                <div className="space-y-3" data-testid="prompt-preview-final-image">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Final Image
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={state.handleBackToSketches}
                            className="h-6 text-xs"
                            disabled={state.loading}
                            data-testid="prompt-preview-back-to-sketches-btn"
                        >
                            Back to Sketches
                        </Button>
                    </div>

                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]">
                        <img
                            src={state.finalImage.url}
                            alt="Final generated image ready for use"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <Button
                        onClick={state.handleConfirmFinal}
                        className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                        data-testid="prompt-preview-use-final-btn"
                    >
                        <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                        Use This Image
                    </Button>
                </div>
            )}
        </section>
    )
}
