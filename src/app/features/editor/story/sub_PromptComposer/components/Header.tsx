import { RotateCcw, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
    hasSelections: boolean
    loading: boolean
    onClear: () => void
}

export function Header({ hasSelections, loading, onClear }: HeaderProps) {
    return (
        <header
            className="flex items-center justify-between"
            data-testid="prompt-composer-header"
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded bg-primary/10 border-2 border-border flex items-center justify-center"
                    aria-hidden="true"
                >
                    <Wand2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h4 className="text-sm font-bold" id="prompt-composer-title">
                        Image Prompt Builder
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Select options to compose a prompt
                    </p>
                </div>
            </div>

            {hasSelections && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClear}
                    className="text-xs"
                    disabled={loading}
                    aria-label="Clear all selections"
                    data-testid="prompt-composer-clear-btn"
                >
                    <RotateCcw className="w-3 h-3 mr-1" aria-hidden="true" />
                    Clear
                </Button>
            )}
        </header>
    )
}
