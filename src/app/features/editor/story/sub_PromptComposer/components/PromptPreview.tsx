import { PreviewHeader, PreviewContent, PreviewVariables, PreviewActions, usePromptPreview } from './sub_PromptPreview'

interface PromptPreviewProps {
    prompt: string
    copied: boolean
    loading: boolean
    onCopy: () => void
    onImageSelect?: (imageUrl: string, prompt: string) => void
}

export function PromptPreview({ prompt, copied, loading: externalLoading, onCopy, onImageSelect }: PromptPreviewProps) {
    const {
        isPromptExpanded, sketchModel, finalModel, sketchModelExpanded, finalModelExpanded,
        sketchCount, sketches, isGeneratingSketches, selectedSketchIndex, error,
        isGeneratingFinal, finalImage, finalQuality, loading, showSketchControls,
        setSketchModel, setFinalModel, setSketchCount, setSelectedSketchIndex, setFinalQuality,
        handleGenerateSketches, handleGenerateFinal, handleConfirmFinal, handleUseSketch,
        handleStartOver, handleBackToSketches, togglePromptExpanded, toggleSketchModelExpanded, toggleFinalModelExpanded,
    } = usePromptPreview({ prompt, externalLoading, onImageSelect })

    return (
        <section className="border-2 border-border rounded-lg bg-muted/50 p-3 space-y-3 halloween-fog-overlay" aria-label="Generated prompt preview" data-testid="prompt-preview">
            <PreviewHeader isExpanded={isPromptExpanded} copied={copied} loading={loading} onToggleExpand={togglePromptExpanded} onCopy={onCopy} />
            <PreviewContent prompt={prompt} isExpanded={isPromptExpanded} />

            {error && (
                <div className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-2" role="alert" data-testid="prompt-preview-error">
                    <p className="text-xs text-destructive">{error}</p>
                </div>
            )}

            {showSketchControls && (
                <PreviewVariables
                    prompt={prompt} sketchModel={sketchModel} sketchModelExpanded={sketchModelExpanded}
                    sketchCount={sketchCount} loading={loading} isGeneratingSketches={isGeneratingSketches}
                    onSketchModelToggle={toggleSketchModelExpanded} onSketchModelSelect={setSketchModel}
                    onSketchCountChange={setSketchCount} onGenerateSketches={handleGenerateSketches}
                />
            )}

            <PreviewActions
                sketches={sketches} selectedSketchIndex={selectedSketchIndex} finalImage={finalImage}
                finalModel={finalModel} finalModelExpanded={finalModelExpanded} finalQuality={finalQuality}
                loading={loading} isGeneratingFinal={isGeneratingFinal} onSketchSelect={setSelectedSketchIndex}
                onStartOver={handleStartOver} onFinalModelToggle={toggleFinalModelExpanded}
                onFinalModelSelect={setFinalModel} onQualityChange={setFinalQuality}
                onUseSketch={handleUseSketch} onGenerateFinal={handleGenerateFinal}
                onConfirmFinal={handleConfirmFinal} onBackToSketches={handleBackToSketches}
            />
        </section>
    )
}
