import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GeneratedImage {
    url: string
    width: number
    height: number
}

interface ImageGridProps {
    images: GeneratedImage[]
    selectedIndex: number | null
    onSelectImage: (index: number) => void
    onConfirm: () => void
}

export function ImageGrid({ images, selectedIndex, onSelectImage, onConfirm }: ImageGridProps) {
    if (images.length === 0) return null

    return (
        <div className="border-2 border-border rounded-lg bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Select an Image
                </span>
                <span className="text-xs text-muted-foreground">
                    {images.length} generated
                </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {images.map((image, index) => (
                    <button
                        key={index}
                        onClick={() => onSelectImage(index)}
                        className={cn(
                            'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                            'hover:opacity-90 active:scale-[0.98]',
                            selectedIndex === index
                                ? 'border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                                : 'border-border hover:border-border/80'
                        )}
                    >
                        <img
                            src={image.url}
                            alt={`Generated image ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        {selectedIndex === index && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <div className="bg-primary text-primary-foreground rounded-full p-1">
                                    <Check className="w-4 h-4" />
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Confirm Selection Button */}
            {selectedIndex !== null && (
                <Button
                    onClick={onConfirm}
                    className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                >
                    <Check className="w-4 h-4 mr-2" />
                    Use Selected Image
                </Button>
            )}
        </div>
    )
}
