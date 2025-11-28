import { useState, useCallback, useRef } from 'react'
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
    const [focusedIndex, setFocusedIndex] = useState<number>(-1)
    const gridRef = useRef<HTMLDivElement>(null)

    // Keyboard navigation for image grid
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        const numColumns = 2 // Grid is always 2 columns
        const numImages = images.length
        let newIndex = focusedIndex

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault()
                newIndex = Math.min(focusedIndex + 1, numImages - 1)
                break
            case 'ArrowLeft':
                e.preventDefault()
                newIndex = Math.max(focusedIndex - 1, 0)
                break
            case 'ArrowDown':
                e.preventDefault()
                newIndex = Math.min(focusedIndex + numColumns, numImages - 1)
                break
            case 'ArrowUp':
                e.preventDefault()
                newIndex = Math.max(focusedIndex - numColumns, 0)
                break
            case 'Home':
                e.preventDefault()
                newIndex = 0
                break
            case 'End':
                e.preventDefault()
                newIndex = numImages - 1
                break
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (focusedIndex >= 0 && focusedIndex < numImages) {
                    onSelectImage(focusedIndex)
                }
                return
            default:
                return
        }

        setFocusedIndex(newIndex)
        // Focus the new image button
        const imageButtons = gridRef.current?.querySelectorAll('[role="option"]')
        if (imageButtons && imageButtons[newIndex]) {
            (imageButtons[newIndex] as HTMLElement).focus()
        }
    }, [focusedIndex, images.length, onSelectImage])

    if (images.length === 0) return null

    return (
        <section
            className="border-2 border-border rounded-lg bg-card p-3 space-y-3"
            aria-label="Generated images selection"
            data-testid="image-grid"
        >
            <div className="flex items-center justify-between">
                <span
                    id="image-grid-label"
                    className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                    Select an Image
                </span>
                <span className="text-xs text-muted-foreground" aria-live="polite">
                    {images.length} generated
                </span>
            </div>

            <div
                ref={gridRef}
                className="grid grid-cols-2 gap-2"
                role="listbox"
                aria-labelledby="image-grid-label"
                aria-activedescendant={focusedIndex >= 0 ? `image-option-${focusedIndex}` : undefined}
                onKeyDown={handleKeyDown}
                data-testid="image-grid-options"
            >
                {images.map((image, index) => {
                    const isSelected = selectedIndex === index
                    const isFocused = focusedIndex === index

                    return (
                        <button
                            key={index}
                            id={`image-option-${index}`}
                            role="option"
                            aria-selected={isSelected}
                            aria-label={`Generated image ${index + 1}${isSelected ? ', selected' : ''}`}
                            onClick={() => onSelectImage(index)}
                            onFocus={() => setFocusedIndex(index)}
                            tabIndex={isFocused || (focusedIndex === -1 && index === 0) ? 0 : -1}
                            className={cn(
                                'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                                'hover:opacity-90 active:scale-[0.98]',
                                isSelected
                                    ? 'border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                                    : 'border-border hover:border-border/80'
                            )}
                            data-testid={`image-grid-option-${index}`}
                        >
                            <img
                                src={image.url}
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
                        </button>
                    )
                })}
            </div>

            {/* Confirm Selection Button */}
            {selectedIndex !== null && (
                <Button
                    onClick={onConfirm}
                    className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
                    data-testid="image-grid-confirm-btn"
                >
                    <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                    Use Selected Image
                </Button>
            )}
        </section>
    )
}
