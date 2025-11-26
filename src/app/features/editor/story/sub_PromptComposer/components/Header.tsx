import { RotateCcw, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
    hasSelections: boolean
    loading: boolean
    onClear: () => void
}

export function Header({ hasSelections, loading, onClear }: HeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-primary/10 border-2 border-border flex items-center justify-center">
                    <Wand2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h4 className="text-sm font-bold">Image Prompt Builder</h4>
                    <p className="text-xs text-muted-foreground">Select options to compose a prompt</p>
                </div>
            </div>

            {hasSelections && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClear}
                    className="text-xs"
                    disabled={loading}
                >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Clear
                </Button>
            )}
        </div>
    )
}
