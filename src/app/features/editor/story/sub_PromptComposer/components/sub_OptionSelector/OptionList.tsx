import { useRef, useCallback } from 'react'
import { PromptDimension, PromptOption, dimensionOptions } from '@/lib/promptComposer'
import { OptionItem } from './OptionItem'

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

    const handleOptionsKeyDown = useCallback((e: React.KeyboardEvent) => {
        const numColumns = 4
        const numOptions = options.length
        let newIndex = focusedOptionIndex

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault()
                newIndex = Math.min(focusedOptionIndex + 1, numOptions - 1)
                break
            case 'ArrowLeft':
                e.preventDefault()
                newIndex = Math.max(focusedOptionIndex - 1, 0)
                break
            case 'ArrowDown':
                e.preventDefault()
                newIndex = Math.min(focusedOptionIndex + numColumns, numOptions - 1)
                break
            case 'ArrowUp':
                e.preventDefault()
                newIndex = Math.max(focusedOptionIndex - numColumns, 0)
                break
            case 'Home':
                e.preventDefault()
                newIndex = 0
                break
            case 'End':
                e.preventDefault()
                newIndex = numOptions - 1
                break
            case 'Enter':
            case ' ':
                e.preventDefault()
                if (focusedOptionIndex >= 0 && focusedOptionIndex < numOptions) {
                    onSelect(columnId, options[focusedOptionIndex])
                }
                return
            case 'Escape':
                e.preventDefault()
                onToggle(columnId)
                return
            default:
                return
        }

        onFocusChange(newIndex)
        const optionButtons = optionsGridRef.current?.querySelectorAll('[role="option"]')
        if (optionButtons && optionButtons[newIndex]) {
            (optionButtons[newIndex] as HTMLElement).focus()
        }
    }, [focusedOptionIndex, options, columnId, onSelect, onToggle, onFocusChange])

    return (
        <div
            ref={optionsGridRef}
            className="grid grid-cols-2 sm:grid-cols-4 gap-1.5"
            role="listbox"
            aria-label={`${columnLabel} options`}
            aria-activedescendant={focusedOptionIndex >= 0 ? `${columnId}-option-${focusedOptionIndex}` : undefined}
            onKeyDown={handleOptionsKeyDown}
        >
            {options.map((option, index) => {
                const isSelected = selectedOption?.id === option.id
                const isFocused = focusedOptionIndex === index

                return (
                    <OptionItem
                        key={option.id}
                        option={option}
                        columnId={columnId}
                        index={index}
                        isSelected={isSelected}
                        isFocused={isFocused}
                        focusedOptionIndex={focusedOptionIndex}
                        loading={loading}
                        isEnriching={isEnriching}
                        onSelect={() => onSelect(columnId, option)}
                        onFocus={() => onFocusChange(index)}
                    />
                )
            })}
        </div>
    )
}
