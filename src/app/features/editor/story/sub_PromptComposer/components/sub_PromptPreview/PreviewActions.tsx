import { FinalModel } from '../ModelSelector'
import { SketchesGrid } from './SketchesGrid'
import { FinalImageView } from './FinalImageView'

interface GeneratedImage {
    url: string
    width: number
    height: number
    prompt?: string
    variationIndex?: number
}

interface PreviewActionsProps {
    sketches: GeneratedImage[]
    selectedSketchIndex: number | null
    finalImage: GeneratedImage | null
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
    onConfirmFinal: () => void
    onBackToSketches: () => void
}

export function PreviewActions({
    sketches, selectedSketchIndex, finalImage, finalModel, finalModelExpanded,
    finalQuality, loading, isGeneratingFinal, onSketchSelect, onStartOver,
    onFinalModelToggle, onFinalModelSelect, onQualityChange, onUseSketch,
    onGenerateFinal, onConfirmFinal, onBackToSketches
}: PreviewActionsProps) {
    if (sketches.length > 0 && !finalImage) {
        return (
            <SketchesGrid
                sketches={sketches}
                selectedSketchIndex={selectedSketchIndex}
                finalModel={finalModel}
                finalModelExpanded={finalModelExpanded}
                finalQuality={finalQuality}
                loading={loading}
                isGeneratingFinal={isGeneratingFinal}
                onSketchSelect={onSketchSelect}
                onStartOver={onStartOver}
                onFinalModelToggle={onFinalModelToggle}
                onFinalModelSelect={onFinalModelSelect}
                onQualityChange={onQualityChange}
                onUseSketch={onUseSketch}
                onGenerateFinal={onGenerateFinal}
            />
        )
    }

    if (finalImage) {
        return (
            <FinalImageView
                finalImage={finalImage}
                loading={loading}
                onBackToSketches={onBackToSketches}
                onConfirmFinal={onConfirmFinal}
            />
        )
    }

    return null
}
