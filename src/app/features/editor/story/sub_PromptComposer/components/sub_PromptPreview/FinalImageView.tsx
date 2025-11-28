import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GeneratedImage {
    url: string
    width: number
    height: number
    prompt?: string
    variationIndex?: number
}

interface FinalImageViewProps {
    finalImage: GeneratedImage
    loading: boolean
    onBackToSketches: () => void
    onConfirmFinal: () => void
}

export function FinalImageView({ finalImage, loading, onBackToSketches, onConfirmFinal }: FinalImageViewProps) {
    return (
        <div className="space-y-3" data-testid="prompt-preview-final-image">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Final Image
                </span>
                <Button size="sm" variant="ghost" onClick={onBackToSketches} className="h-6 text-xs" disabled={loading} data-testid="prompt-preview-back-to-sketches-btn">
                    Back to Sketches
                </Button>
            </div>

            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]">
                <img src={finalImage.url} alt="Final generated image ready for use" className="w-full h-full object-cover" />
            </div>

            <Button
                onClick={onConfirmFinal}
                className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                data-testid="prompt-preview-use-final-btn"
            >
                <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                Use This Image
            </Button>
        </div>
    )
}
