'use client'

/**
 * PromptPreview Component
 *
 * Displays generated prompt with preview, copy functionality, and image generation workflow.
 * Refactored into modular subcomponents for maintainability.
 */

import {
  PromptPreviewHeader,
  PromptContent,
  SketchControls,
  SketchesGrid,
  FinalImageView,
  usePromptPreview,
} from './sub_PromptPreview'

interface PromptPreviewProps {
  prompt: string
  copied: boolean
  loading: boolean
  onCopy: () => void
  onImageSelect?: (imageUrl: string, prompt: string) => void
}

export function PromptPreview({
  prompt,
  copied,
  loading: externalLoading,
  onCopy,
  onImageSelect,
}: PromptPreviewProps) {
  const state = usePromptPreview(prompt, externalLoading, onImageSelect)

  return (
    <section
      className="border-2 border-border rounded-lg bg-muted/50 p-3 space-y-3 halloween-fog-overlay"
      aria-label="Generated prompt preview"
      data-testid="prompt-preview"
    >
      {/* Header Section */}
      <PromptPreviewHeader
        copied={copied}
        isExpanded={state.isPromptExpanded}
        loading={state.loading}
        onCopy={onCopy}
        onToggleExpanded={state.togglePromptExpanded}
      />

      {/* Content Section */}
      <PromptContent prompt={prompt} isExpanded={state.isPromptExpanded} />

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
        <SketchControls
          prompt={prompt}
          sketchModel={state.sketchModel}
          sketchModelExpanded={state.sketchModelExpanded}
          sketchCount={state.sketchCount}
          loading={state.loading}
          isGenerating={state.isGeneratingSketches}
          onModelToggle={state.toggleSketchModelExpanded}
          onModelSelect={state.setSketchModel}
          onCountChange={state.setSketchCount}
          onGenerate={state.handleGenerateSketches}
        />
      )}

      {/* Sketches Grid */}
      {state.sketches.length > 0 && !state.finalImage && (
        <SketchesGrid
          sketches={state.sketches}
          selectedIndex={state.selectedSketchIndex}
          finalModel={state.finalModel}
          finalModelExpanded={state.finalModelExpanded}
          finalQuality={state.finalQuality}
          loading={state.loading}
          isGeneratingFinal={state.isGeneratingFinal}
          onSelect={state.setSelectedSketchIndex}
          onStartOver={state.handleStartOver}
          onModelToggle={state.toggleFinalModelExpanded}
          onModelSelect={state.setFinalModel}
          onQualityChange={state.setFinalQuality}
          onUseSketch={state.handleUseSketch}
          onGenerateFinal={state.handleGenerateFinal}
        />
      )}

      {/* Final Image View */}
      {state.finalImage && (
        <FinalImageView
          image={state.finalImage}
          loading={state.loading}
          onBackToSketches={state.handleBackToSketches}
          onConfirm={state.handleConfirmFinal}
        />
      )}
    </section>
  )
}
