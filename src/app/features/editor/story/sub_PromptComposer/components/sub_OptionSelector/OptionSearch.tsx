import { useState, useCallback, useEffect } from 'react'
import { Pencil, Sparkles, Loader2, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptDimension, PromptOption, createCustomOption } from '@/lib/promptComposer'
import { Button } from '@/components/ui/button'

interface OptionSearchProps {
    columnId: PromptDimension
    columnLabel: string
    loading: boolean
    prefillContent?: string
    artStyleId?: string
    onSelect: (dimension: PromptDimension, option: PromptOption) => void
}

export function OptionSearch({
    columnId,
    columnLabel,
    loading,
    prefillContent,
    artStyleId,
    onSelect
}: OptionSearchProps) {
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [customText, setCustomText] = useState('')
    const [isEnriching, setIsEnriching] = useState(false)

    useEffect(() => {
        if (!showCustomInput) {
            setCustomText('')
        }
    }, [showCustomInput])

    const handleCustomToggle = useCallback(() => {
        setShowCustomInput(!showCustomInput)
        if (showCustomInput) {
            setCustomText('')
        }
    }, [showCustomInput])

    const handlePrefillFromCard = useCallback(() => {
        if (prefillContent) {
            setCustomText(prefillContent)
        }
    }, [prefillContent])

    const handleEnrichAndApply = useCallback(async () => {
        if (!customText.trim()) return

        setIsEnriching(true)
        try {
            const response = await fetch('/api/ai/enrich-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIdea: customText.trim(),
                    dimension: columnId,
                    artStyleId,
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to enrich prompt')
            }

            const data = await response.json()
            const customOption = createCustomOption(columnId, data.enrichedPrompt)
            onSelect(columnId, customOption)
            setShowCustomInput(false)
            setCustomText('')
        } catch (error) {
            console.error('Error enriching prompt:', error)
            const customOption = createCustomOption(columnId, customText.trim())
            onSelect(columnId, customOption)
            setShowCustomInput(false)
            setCustomText('')
        } finally {
            setIsEnriching(false)
        }
    }, [customText, columnId, artStyleId, onSelect])

    const handleApplyRaw = useCallback(() => {
        if (!customText.trim()) return
        const customOption = createCustomOption(columnId, customText.trim())
        onSelect(columnId, customOption)
        setShowCustomInput(false)
        setCustomText('')
    }, [customText, columnId, onSelect])

    return (
        <>
            {/* Custom Input Toggle */}
            <button
                onClick={handleCustomToggle}
                disabled={loading || isEnriching}
                aria-expanded={showCustomInput}
                aria-controls={`${columnId}-custom-input`}
                className={cn(
                    'w-full flex items-center justify-center gap-2 p-2 rounded border-2 border-dashed transition-all text-xs',
                    showCustomInput
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted',
                    (loading || isEnriching) && 'opacity-50 cursor-not-allowed'
                )}
                data-testid={`option-selector-${columnId}-custom-toggle`}
            >
                {showCustomInput ? (
                    <>
                        <X className="w-3 h-3" aria-hidden="true" />
                        Cancel Custom
                    </>
                ) : (
                    <>
                        <Pencil className="w-3 h-3" aria-hidden="true" />
                        Use Custom {columnLabel}
                    </>
                )}
            </button>

            {/* Custom Input Area */}
            {showCustomInput && (
                <div
                    id={`${columnId}-custom-input`}
                    className="space-y-2"
                    role="region"
                    aria-label={`Custom ${columnLabel} input`}
                    data-testid={`option-selector-${columnId}-custom-area`}
                >
                    {prefillContent && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handlePrefillFromCard}
                            disabled={isEnriching}
                            className="w-full text-xs h-8 border-dashed"
                            data-testid={`option-selector-${columnId}-prefill-btn`}
                        >
                            <FileText className="w-3 h-3 mr-1" aria-hidden="true" />
                            Use Card Content as Base
                        </Button>
                    )}
                    <label htmlFor={`${columnId}-custom-textarea`} className="sr-only">
                        Custom {columnLabel} description
                    </label>
                    <textarea
                        id={`${columnId}-custom-textarea`}
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder={`Describe your custom ${columnLabel.toLowerCase()}... (e.g., "watercolor painting with soft edges" or "haunted Victorian mansion")`}
                        disabled={isEnriching}
                        aria-describedby={`${columnId}-custom-hint`}
                        className={cn(
                            'w-full p-2 rounded border-2 border-border bg-background text-xs',
                            'resize-none focus:outline-none focus:border-primary',
                            'placeholder:text-muted-foreground',
                            'halloween-candle-flicker-focus',
                            isEnriching && 'opacity-50'
                        )}
                        rows={3}
                        data-testid={`option-selector-${columnId}-custom-textarea`}
                    />
                    <div className="flex gap-2" role="group" aria-label="Custom input actions">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleApplyRaw}
                            disabled={!customText.trim() || isEnriching}
                            className="flex-1 text-xs h-8"
                            data-testid={`option-selector-${columnId}-apply-raw-btn`}
                        >
                            Use As-Is
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleEnrichAndApply}
                            disabled={!customText.trim() || isEnriching}
                            className="flex-1 text-xs h-8"
                            aria-busy={isEnriching}
                            data-testid={`option-selector-${columnId}-enrich-btn`}
                        >
                            {isEnriching ? (
                                <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" aria-hidden="true" />
                                    Enriching...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
                                    Enrich with AI
                                </>
                            )}
                        </Button>
                    </div>
                    <p id={`${columnId}-custom-hint`} className="text-[10px] text-muted-foreground">
                        &ldquo;Enrich with AI&rdquo; will expand your idea into a detailed prompt matching our presets quality.
                    </p>
                </div>
            )}
        </>
    )
}
