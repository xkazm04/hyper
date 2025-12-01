/**
 * Types for PromptPreview components
 */

export interface GeneratedImage {
  url: string
  width: number
  height: number
  prompt?: string
  variationIndex?: number
  generationId?: string
  imageId?: string
}

export interface PromptVariation {
  variation: string
  focusArea: string
}

export interface PromptPreviewProps {
  prompt: string
  copied: boolean
  loading: boolean
  onCopy: () => void
  onImageSelect?: (imageUrl: string, prompt: string) => void
}

import type { SketchModel, FinalModel, LeonardoModel } from '../ModelSelector'

export interface PromptPreviewState {
  isPromptExpanded: boolean
  sketchModel: SketchModel
  finalModel: FinalModel
  sketchModelExpanded: boolean
  finalModelExpanded: boolean
  sketchCount: number
  sketches: GeneratedImage[]
  isGeneratingSketches: boolean
  selectedSketchIndex: number | null
  error: string | null
  isGeneratingFinal: boolean
  finalImage: GeneratedImage | null
  finalQuality: 'high' | 'premium'
  loading: boolean
  showSketchControls: boolean
  setSketchModel: (model: LeonardoModel) => void
  setFinalModel: (model: LeonardoModel) => void
  setSketchCount: (count: number) => void
  setSelectedSketchIndex: (index: number | null) => void
  setFinalQuality: (quality: 'high' | 'premium') => void
  handleGenerateSketches: () => Promise<void>
  handleGenerateFinal: () => Promise<void>
  handleConfirmFinal: () => void
  handleUseSketch: () => void
  handleStartOver: () => void
  handleBackToSketches: () => void
  togglePromptExpanded: () => void
  toggleSketchModelExpanded: () => void
  toggleFinalModelExpanded: () => void
}
