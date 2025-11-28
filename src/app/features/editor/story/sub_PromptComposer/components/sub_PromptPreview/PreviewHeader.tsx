import { Check, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PreviewHeaderProps {
    isExpanded: boolean
    copied: boolean
    loading: boolean
    onToggleExpand: () => void
    onCopy: () => void
}

export function PreviewHeader({
    isExpanded,
    copied,
    loading,
    onToggleExpand,
    onCopy
}: PreviewHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <span
                id="prompt-preview-label"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
                Generated Prompt
            </span>
            <div className="flex items-center gap-1" role="group" aria-label="Prompt actions">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onToggleExpand}
                    className="h-6 text-xs"
                    disabled={loading}
                    aria-expanded={isExpanded}
                    aria-controls="prompt-text-container"
                    data-testid="prompt-preview-expand-btn"
                >
                    {isExpanded ? (
                        <>
                            <ChevronUp className="w-3 h-3 mr-1" aria-hidden="true" />
                            Collapse
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-3 h-3 mr-1" aria-hidden="true" />
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
                    aria-label={copied ? 'Prompt copied to clipboard' : 'Copy prompt to clipboard'}
                    data-testid="prompt-preview-copy-btn"
                >
                    {copied ? (
                        <>
                            <Check className="w-3 h-3 mr-1" aria-hidden="true" />
                            Copied
                        </>
                    ) : (
                        <>
                            <Copy className="w-3 h-3 mr-1" aria-hidden="true" />
                            Copy
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
