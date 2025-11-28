import { cn } from '@/lib/utils'
import { PromptOption } from '@/lib/promptComposer'

interface OptionItemProps {
    option: PromptOption
    columnId: string
    index: number
    isSelected: boolean
    isFocused: boolean
    focusedOptionIndex: number
    loading: boolean
    isEnriching: boolean
    onSelect: () => void
    onFocus: () => void
}

export function OptionItem({
    option,
    columnId,
    index,
    isSelected,
    isFocused,
    focusedOptionIndex,
    loading,
    isEnriching,
    onSelect,
    onFocus
}: OptionItemProps) {
    return (
        <button
            id={`${columnId}-option-${index}`}
            role="option"
            aria-selected={isSelected}
            onClick={onSelect}
            onFocus={onFocus}
            disabled={loading || isEnriching}
            tabIndex={isFocused || (focusedOptionIndex === -1 && index === 0) ? 0 : -1}
            className={cn(
                'flex flex-col items-center gap-1 p-2 rounded border-2 transition-all text-center',
                'hover:bg-muted active:scale-[0.98]',
                isSelected
                    ? 'bg-primary/10 border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))] halloween-candle-flicker'
                    : 'border-border hover:border-border/80',
                (loading || isEnriching) && 'opacity-50 cursor-not-allowed'
            )}
            data-testid={`option-selector-${columnId}-option-${option.id}`}
        >
            <span className="text-lg" aria-hidden="true">{option.icon}</span>
            <span className="text-[10px] font-medium leading-tight">
                {option.label}
            </span>
        </button>
    )
}
