import { useState, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronUp, Pencil, Sparkles, Loader2, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PromptDimension, PromptOption, dimensionOptions, createCustomOption } from '@/lib/promptComposer'
import { Button } from '@/components/ui/button'

interface OptionSelectorProps {
    column: { id: PromptDimension; label: string; icon: React.ReactNode }
    selectedOption?: PromptOption
    isExpanded: boolean
    loading: boolean
    prefillContent?: string  // Card content for prefilling custom input
    artStyleId?: string      // Current art style for LLM enrichment context
    onToggle: (id: PromptDimension) => void
    onSelect: (dimension: PromptDimension, option: PromptOption) => void
}

export function OptionSelector({
    column,
    selectedOption,
    isExpanded,
    loading,
    prefillContent,
    artStyleId,
    onToggle,
    onSelect,
}: OptionSelectorProps) {
    const options = dimensionOptions[column.id]
    const [showCustomInput, setShowCustomInput] = useState(false)
    const [customText, setCustomText] = useState('')
    const [isEnriching, setIsEnriching] = useState(false)

    // Reset custom text when closing custom input
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
                    dimension: column.id,
                    artStyleId, // Pass art style for context-aware enrichment
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to enrich prompt')
            }

            const data = await response.json()
            const customOption = createCustomOption(column.id, data.enrichedPrompt)
            onSelect(column.id, customOption)
            setShowCustomInput(false)
            setCustomText('')
        } catch (error) {
            console.error('Error enriching prompt:', error)
            // Fall back to using the raw text
            const customOption = createCustomOption(column.id, customText.trim())
            onSelect(column.id, customOption)
            setShowCustomInput(false)
            setCustomText('')
        } finally {
            setIsEnriching(false)
        }
    }, [customText, column.id, artStyleId, onSelect])

    const handleApplyRaw = useCallback(() => {
        if (!customText.trim()) return
        const customOption = createCustomOption(column.id, customText.trim())
        onSelect(column.id, customOption)
        setShowCustomInput(false)
        setCustomText('')
    }, [customText, column.id, onSelect])

    return (
        <div className="border-2 border-border rounded-lg bg-card overflow-hidden">
            {/* Column Header */}
            <button
                onClick={() => onToggle(column.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                disabled={loading}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">{column.icon}</span>
                    <div className="text-left">
                        <div className="text-sm font-semibold">{column.label}</div>
                        {selectedOption && (
                            <div className="text-xs text-primary flex items-center gap-1">
                                <span>{selectedOption.icon}</span>
                                <span>{selectedOption.label}</span>
                                {selectedOption.isCustom && (
                                    <span className="text-[10px] bg-primary/20 px-1 rounded">custom</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {/* Options Grid */}
            {isExpanded && (
                <div className="border-t border-border p-2 bg-muted/30 space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {options.map((option) => {
                            const isSelected = selectedOption?.id === option.id

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => onSelect(column.id, option)}
                                    disabled={loading || isEnriching}
                                    className={cn(
                                        'flex flex-col items-center gap-1 p-2 rounded border-2 transition-all text-center',
                                        'hover:bg-muted active:scale-[0.98]',
                                        isSelected
                                            ? 'bg-primary/10 border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                                            : 'border-border hover:border-border/80',
                                        (loading || isEnriching) && 'opacity-50 cursor-not-allowed'
                                    )}
                                >
                                    <span className="text-lg">{option.icon}</span>
                                    <span className="text-[10px] font-medium leading-tight">
                                        {option.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Custom Input Toggle */}
                    <button
                        onClick={handleCustomToggle}
                        disabled={loading || isEnriching}
                        className={cn(
                            'w-full flex items-center justify-center gap-2 p-2 rounded border-2 border-dashed transition-all text-xs',
                            showCustomInput
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50 hover:bg-muted',
                            (loading || isEnriching) && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        {showCustomInput ? (
                            <>
                                <X className="w-3 h-3" />
                                Cancel Custom
                            </>
                        ) : (
                            <>
                                <Pencil className="w-3 h-3" />
                                Use Custom {column.label}
                            </>
                        )}
                    </button>

                    {/* Custom Input Area */}
                    {showCustomInput && (
                        <div className="space-y-2">
                            {/* Prefill from card button */}
                            {prefillContent && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handlePrefillFromCard}
                                    disabled={isEnriching}
                                    className="w-full text-xs h-8 border-dashed"
                                >
                                    <FileText className="w-3 h-3 mr-1" />
                                    Use Card Content as Base
                                </Button>
                            )}
                            <textarea
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                placeholder={`Describe your custom ${column.label.toLowerCase()}... (e.g., "watercolor painting with soft edges" or "haunted Victorian mansion")`}
                                disabled={isEnriching}
                                className={cn(
                                    'w-full p-2 rounded border-2 border-border bg-background text-xs',
                                    'resize-none focus:outline-none focus:border-primary',
                                    'placeholder:text-muted-foreground',
                                    isEnriching && 'opacity-50'
                                )}
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleApplyRaw}
                                    disabled={!customText.trim() || isEnriching}
                                    className="flex-1 text-xs h-8"
                                >
                                    Use As-Is
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleEnrichAndApply}
                                    disabled={!customText.trim() || isEnriching}
                                    className="flex-1 text-xs h-8"
                                >
                                    {isEnriching ? (
                                        <>
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Enriching...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            Enrich with AI
                                        </>
                                    )}
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                "Enrich with AI" will expand your idea into a detailed prompt matching our presets quality.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
