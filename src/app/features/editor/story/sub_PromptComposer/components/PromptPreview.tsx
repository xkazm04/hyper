import { useState, useCallback } from 'react'
import { Check, Copy, Loader2, ChevronDown, ChevronUp, Sparkles, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SKETCH_QUALITY_PRESETS, FINAL_QUALITY_PRESETS } from '@/lib/services/promptVariation'
import { ModelSelector, SketchModel, FinalModel, SKETCH_MODELS, FINAL_MODELS } from './ModelSelector'
import { MAX_PROMPT_LENGTH } from '@/lib/promptComposer'

interface GeneratedImage {
    url: string
    width: number
    height: number
    prompt?: string // Store the prompt used for this image
    variationIndex?: number
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

export function PromptPreview({ prompt, copied, loading: externalLoading, onCopy, onImageSelect }: PromptPreviewProps) {
    // State for expanded prompt view
    const [isPromptExpanded, setIsPromptExpanded] = useState(false)

    // Model selection state
    const [sketchModel, setSketchModel] = useState<SketchModel>('phoenix_1.0')
    const [finalModel, setFinalModel] = useState<FinalModel>('flux_2')
    const [sketchModelExpanded, setSketchModelExpanded] = useState(false)
    const [finalModelExpanded, setFinalModelExpanded] = useState(false)

    // Sketch generation state
    const [sketchCount, setSketchCount] = useState(4)
    const [sketches, setSketches] = useState<GeneratedImage[]>([])
    const [isGeneratingSketches, setIsGeneratingSketches] = useState(false)
    const [selectedSketchIndex, setSelectedSketchIndex] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Final generation state
    const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
    const [finalImage, setFinalImage] = useState<GeneratedImage | null>(null)
    const [finalQuality, setFinalQuality] = useState<'high' | 'premium'>('high')

    const loading = externalLoading || isGeneratingSketches || isGeneratingFinal
    const isPromptTooLong = prompt.length > MAX_PROMPT_LENGTH

    /**
     * Generate prompt variations and then generate sketch images
     */
    const handleGenerateSketches = useCallback(async () => {
        if (!prompt) return

        setIsGeneratingSketches(true)
        setError(null)
        setSketches([])
        setSelectedSketchIndex(null)
        setFinalImage(null)

        try {
            // Step 1: Generate prompt variations
            const variationResponse = await fetch('/api/ai/prompt-variations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    count: sketchCount,
                }),
            })

            if (!variationResponse.ok) {
                const errorData = await variationResponse.json()
                throw new Error(errorData.error || 'Failed to generate prompt variations')
            }

            const variationData = await variationResponse.json()
            const variations: PromptVariation[] = variationData.variations

            // Step 2: Generate sketch images for each variation
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
                        model: sketchModel,
                    }),
                })

                if (!response.ok) {
                    console.error(`Failed to generate sketch ${index + 1}`)
                    return null
                }

                const data = await response.json()
                const image = data.images?.[0]

                if (image) {
                    return {
                        ...image,
                        prompt: variation.variation,
                        variationIndex: index,
                    } as GeneratedImage
                }
                return null
            })

            const results = await Promise.all(sketchPromises)
            const validSketches = results.filter((s): s is GeneratedImage => s !== null)

            if (validSketches.length === 0) {
                throw new Error('Failed to generate any sketches')
            }

            setSketches(validSketches)

        } catch (err) {
            console.error('Error generating sketches:', err)
            setError(err instanceof Error ? err.message : 'Failed to generate sketches')
        } finally {
            setIsGeneratingSketches(false)
        }
    }, [prompt, sketchCount, sketchModel])

    /**
     * Generate final high-quality image from selected sketch
     */
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
                    model: finalModel,
                }),
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

    /**
     * Confirm final image selection
     */
    const handleConfirmFinal = useCallback(() => {
        if (finalImage && finalImage.prompt) {
            onImageSelect?.(finalImage.url, finalImage.prompt)
            // Reset state
            setSketches([])
            setSelectedSketchIndex(null)
            setFinalImage(null)
        }
    }, [finalImage, onImageSelect])

    /**
     * Use a sketch directly without generating final
     */
    const handleUseSketch = useCallback(() => {
        if (selectedSketchIndex !== null && sketches[selectedSketchIndex]) {
            const sketch = sketches[selectedSketchIndex]
            onImageSelect?.(sketch.url, sketch.prompt || prompt)
            // Reset state
            setSketches([])
            setSelectedSketchIndex(null)
            setFinalImage(null)
        }
    }, [selectedSketchIndex, sketches, prompt, onImageSelect])

    return (
        <div className="border-2 border-border rounded-lg bg-muted/50 p-3 space-y-3">
            {/* Prompt Preview Header */}
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Generated Prompt
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        className="h-6 text-xs"
                        disabled={loading}
                    >
                        {isPromptExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3 mr-1" />
                                Collapse
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3 mr-1" />
                                Expand
                            </>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onCopy}
                        className="h-6 text-xs"
                        disabled={loading}
                    >
                        {copied ? (
                            <>
                                <Check className="w-3 h-3 mr-1" />
                                Copied
                            </>
                        ) : (
                            <>
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Full Prompt Text */}
            <div className={cn(
                "text-xs text-foreground leading-relaxed overflow-hidden transition-all duration-300",
                isPromptExpanded ? "max-h-[500px] overflow-y-auto" : "max-h-20"
            )}>
                <p className={cn(!isPromptExpanded && "line-clamp-4")}>
                    {prompt}
                </p>
            </div>

            {/* Prompt Stats */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={cn(isPromptTooLong && "text-destructive font-medium")}>
                    {prompt.length}/{MAX_PROMPT_LENGTH} characters
                </span>
                <span>•</span>
                <span>{prompt.split(/\s+/).length} words</span>
                {isPromptTooLong && (
                    <span className="text-destructive">⚠️ Too long</span>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-2">
                    <p className="text-xs text-destructive">{error}</p>
                </div>
            )}

            {/* Sketch Generation Controls (only show before generating) */}
            {sketches.length === 0 && !finalImage && (
                <div className="space-y-3">
                    {/* Sketch Model Selector */}
                    <ModelSelector
                        selectedModel={sketchModel}
                        isExpanded={sketchModelExpanded}
                        loading={loading}
                        modelType="sketch"
                        onToggle={() => setSketchModelExpanded(!sketchModelExpanded)}
                        onSelect={(model) => setSketchModel(model as SketchModel)}
                    />

                    {/* Sketch Count Selector */}
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">
                            Number of Sketches
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => setSketchCount(count)}
                                    disabled={loading}
                                    className={cn(
                                        "w-8 h-8 text-xs font-medium rounded border-2 transition-all",
                                        sketchCount === count
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background hover:border-primary/50"
                                    )}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Quick low-res previews with AI-generated prompt variations
                    </p>
                </div>
            )}

            {/* Generate Sketches Button */}
            {sketches.length === 0 && !finalImage && (
                <Button
                    onClick={handleGenerateSketches}
                    disabled={loading || !prompt || isPromptTooLong}
                    className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                >
                    {isGeneratingSketches ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Generating {sketchCount} Sketches...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate {sketchCount} Sketch{sketchCount > 1 ? 'es' : ''}
                        </>
                    )}
                </Button>
            )}

            {/* Sketches Grid */}
            {sketches.length > 0 && !finalImage && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Select a Sketch
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setSketches([])
                                setSelectedSketchIndex(null)
                            }}
                            className="h-6 text-xs"
                            disabled={loading}
                        >
                            Start Over
                        </Button>
                    </div>

                    <div className={cn(
                        "grid gap-2",
                        sketches.length === 1 ? "grid-cols-1" :
                            sketches.length === 2 ? "grid-cols-2" :
                                sketches.length === 3 ? "grid-cols-3" : "grid-cols-2"
                    )}>
                        {sketches.map((sketch, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedSketchIndex(index)}
                                disabled={loading}
                                className={cn(
                                    "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                    "hover:opacity-90 active:scale-[0.98]",
                                    selectedSketchIndex === index
                                        ? "border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]"
                                        : "border-border hover:border-border/80"
                                )}
                            >
                                <img
                                    src={sketch.url}
                                    alt={`Sketch ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                {selectedSketchIndex === index && (
                                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                                            <Check className="w-4 h-4" />
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-1 left-1 right-1 bg-black/60 rounded px-1.5 py-0.5">
                                    <span className="text-[10px] text-white font-medium">
                                        Sketch {index + 1}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Actions for selected sketch */}
                    {selectedSketchIndex !== null && (
                        <div className="space-y-3">
                            {/* Final Model Selector */}
                            <ModelSelector
                                selectedModel={finalModel}
                                isExpanded={finalModelExpanded}
                                loading={loading}
                                modelType="final"
                                onToggle={() => setFinalModelExpanded(!finalModelExpanded)}
                                onSelect={(model) => setFinalModel(model as FinalModel)}
                            />

                            {/* Quality selector */}
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-muted-foreground">
                                    Final Quality:
                                </label>
                                <div className="flex gap-1">
                                    {(Object.keys(FINAL_QUALITY_PRESETS) as Array<'high' | 'premium'>).map((key) => (
                                        <button
                                            key={key}
                                            onClick={() => setFinalQuality(key)}
                                            disabled={loading}
                                            className={cn(
                                                "px-2 py-1 text-xs font-medium rounded border-2 transition-all",
                                                finalQuality === key
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background hover:border-primary/50"
                                            )}
                                        >
                                            {FINAL_QUALITY_PRESETS[key].name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={handleUseSketch}
                                    disabled={loading}
                                    variant="outline"
                                    className="flex-1 border-2"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Use Sketch
                                </Button>
                                <Button
                                    onClick={handleGenerateFinal}
                                    disabled={loading}
                                    className="flex-1 border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                                >
                                    {isGeneratingFinal ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <ImageIcon className="w-4 h-4 mr-2" />
                                            Generate Final
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Final Image Display */}
            {finalImage && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Final Image
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setFinalImage(null)
                                setSelectedSketchIndex(null)
                            }}
                            className="h-6 text-xs"
                            disabled={loading}
                        >
                            Back to Sketches
                        </Button>
                    </div>

                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]">
                        <img
                            src={finalImage.url}
                            alt="Final generated image"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <Button
                        onClick={handleConfirmFinal}
                        className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Use This Image
                    </Button>
                </div>
            )}
        </div>
    )
}
