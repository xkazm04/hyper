import { useRef, useEffect } from 'react'
import { PromptDimension, PromptOption, dimensionOptions } from '@/lib/promptComposer'
import { OptionItem } from './OptionItem'
import { useFocusedIndex } from './useFocusedIndex'

interface OptionListProps {
    columnId: PromptDimension
    columnLabel: string
    selectedOption?: PromptOption
    focusedOptionIndex: number
    loading: boolean
    isEnriching: boolean
    onSelect: (dimension: PromptDimension, option: PromptOption) => void
    onFocusChange: (index: number) => void
    onToggle: (id: PromptDimension) => void
}

const NUM_COLUMNS = 4

export function OptionList({
    columnId,
    columnLabel,
    selectedOption,
    focusedOptionIndex,
    loading,
    isEnriching,
    onSelect,
    onFocusChange,
    onToggle
}: OptionListProps) {
    const options = dimensionOptions[columnId]
    const optionsGridRef = useRef<HTMLDivElement>(null)

    const {
        focusedIndex: internalFocusedIndex,
        setFocusedIndex,
        handleKeyDown: handleOptionsKeyDown,
        typeAheadBuffer
    } = useFocusedIndex({
        items: options,
        numColumns: NUM_COLUMNS,
        getLabel: (option) => option.label,
        onSelect: (option) => onSelect(columnId, option),
        onEscape: () => onToggle(columnId),
        isEnabled: !(loading || isEnriching)
    })

    // Sync external focus index with internal state
    useEffect(() => {
        if (focusedOptionIndex !== internalFocusedIndex) {
            setFocusedIndex(focusedOptionIndex)
        }
    }, [focusedOptionIndex, internalFocusedIndex, setFocusedIndex])

    // Notify parent when internal focus changes
    useEffect(() => {
        if (internalFocusedIndex !== focusedOptionIndex && internalFocusedIndex >= 0) {
            onFocusChange(internalFocusedIndex)
            // Focus the actual button element
            const optionButtons = optionsGridRef.current?.querySelectorAll('[role="option"]')
            if (optionButtons && optionButtons[internalFocusedIndex]) {
                (optionButtons[internalFocusedIndex] as HTMLElement).focus()
            }
        }
    }, [internalFocusedIndex, focusedOptionIndex, onFocusChange])

    // Determine the effective focused index for rendering
    const effectiveFocusedIndex = internalFocusedIndex >= 0 ? internalFocusedIndex : focusedOptionIndex

    return (
        <div className="relative">
            {/* Type-ahead indicator */}
            {typeAheadBuffer && (
                <div
                    className="absolute -top-6 left-0 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-sm border border-primary/20 z-10"
                    role="status"
                    aria-live="polite"
                    data-testid={`option-list-${columnId}-typeahead`}
                >
                    Search: {typeAheadBuffer}
                </div>
            )}
            <div
                ref={optionsGridRef}
                className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
                role="listbox"
                aria-label={`${columnLabel} options. Type to search, use arrow keys to navigate.`}
                aria-activedescendant={effectiveFocusedIndex >= 0 ? `${columnId}-option-${effectiveFocusedIndex}` : undefined}
                onKeyDown={handleOptionsKeyDown}
                data-testid={`option-list-${columnId}`}
            >
                {options.map((option, index) => {
                    const isSelected = selectedOption?.id === option.id
                    const isFocused = effectiveFocusedIndex === index

                    return (
                        <OptionItem
                            key={option.id}
                            option={option}
                            columnId={columnId}
                            index={index}
                            isSelected={isSelected}
                            isFocused={isFocused}
                            focusedOptionIndex={effectiveFocusedIndex}
                            loading={loading}
                            isEnriching={isEnriching}
                            onSelect={() => onSelect(columnId, option)}
                            onFocus={() => onFocusChange(index)}
                        />
                    )
                })}
            </div>
        </div>
    )
}
