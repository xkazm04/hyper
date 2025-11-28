import { useState, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PromptDimension, PromptOption } from '@/lib/promptComposer'
import { OptionList, OptionSearch } from './sub_OptionSelector'

interface OptionSelectorProps {
    column: { id: PromptDimension; label: string; icon: React.ReactNode }
    selectedOption?: PromptOption
    isExpanded: boolean
    loading: boolean
    prefillContent?: string
    artStyleId?: string
    onToggle: (id: PromptDimension) => void
    onSelect: (dimension: PromptDimension, option: PromptOption) => void
    onKeyDown?: (e: React.KeyboardEvent) => void
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
    onKeyDown,
}: OptionSelectorProps) {
    const [focusedOptionIndex, setFocusedOptionIndex] = useState<number>(-1)
    const panelId = `${column.id}-panel`
    const headerId = `${column.id}-header`

    // Reset focused option when panel closes
    useEffect(() => {
        if (!isExpanded) {
            setFocusedOptionIndex(-1)
        }
    }, [isExpanded])

    // Handle keyboard navigation for header
    const handleHeaderKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault()
                onToggle(column.id)
                break
            case 'ArrowDown':
            case 'ArrowUp':
            case 'Home':
            case 'End':
                onKeyDown?.(e)
                break
        }
    }, [column.id, onToggle, onKeyDown])

    return (
        <div
            className="border-2 border-border rounded-lg bg-card overflow-hidden"
            data-testid={`option-selector-${column.id}`}
        >
            {/* Column Header - acts as accordion trigger */}
            <button
                id={headerId}
                onClick={() => onToggle(column.id)}
                onKeyDown={handleHeaderKeyDown}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                disabled={loading}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                data-column-id={column.id}
                data-testid={`option-selector-${column.id}-header`}
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{column.icon}</span>
                    <div className="text-left">
                        <div className="text-sm font-semibold">{column.label}</div>
                        {selectedOption && (
                            <div className="text-xs text-primary flex items-center gap-1">
                                <span aria-hidden="true">{selectedOption.icon}</span>
                                <span>{selectedOption.label}</span>
                                {selectedOption.isCustom && (
                                    <span className="text-[10px] bg-primary/20 px-1 rounded">custom</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                )}
                <span className="sr-only">
                    {isExpanded ? `Collapse ${column.label} options` : `Expand ${column.label} options`}
                </span>
            </button>

            {/* Options Panel */}
            {isExpanded && (
                <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    className="border-t border-border p-2 bg-muted/30 space-y-2"
                    data-testid={`option-selector-${column.id}-panel`}
                >
                    <OptionList
                        columnId={column.id}
                        columnLabel={column.label}
                        selectedOption={selectedOption}
                        focusedOptionIndex={focusedOptionIndex}
                        loading={loading}
                        isEnriching={false}
                        onSelect={onSelect}
                        onFocusChange={setFocusedOptionIndex}
                        onToggle={onToggle}
                    />

                    <OptionSearch
                        columnId={column.id}
                        columnLabel={column.label}
                        loading={loading}
                        prefillContent={prefillContent}
                        artStyleId={artStyleId}
                        onSelect={onSelect}
                    />
                </div>
            )}
        </div>
    )
}
