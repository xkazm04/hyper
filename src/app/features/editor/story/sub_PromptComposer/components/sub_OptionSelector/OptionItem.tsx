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
    const isDisabled = loading || isEnriching

    return (
        <button
            id={`${columnId}-option-${index}`}
            role="option"
            aria-selected={isSelected}
            onClick={onSelect}
            onFocus={onFocus}
            disabled={isDisabled}
            tabIndex={isFocused || (focusedOptionIndex === -1 && index === 0) ? 0 : -1}
            className={cn(
                // Base styles with smooth transitions
                'flex flex-col items-center gap-1 p-2 rounded border-2 text-center',
                'transition-all duration-150 ease-out',
                // Background transition on hover
                'hover:bg-muted/80 active:scale-[0.97]',
                // Focus ring - high contrast visible ring
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                // Focused state (via keyboard navigation) - subtle background highlight
                isFocused && !isSelected && 'bg-muted/60 border-primary/50',
                // Selected state
                isSelected
                    ? 'bg-primary/10 border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))] halloween-candle-flicker'
                    : 'border-border hover:border-primary/40',
                // Disabled state
                isDisabled && 'opacity-50 cursor-not-allowed pointer-events-none'
            )}
            data-testid={`option-item-${columnId}-${option.id}`}
            data-focused={isFocused}
            data-selected={isSelected}
        >
            <span
                className={cn(
                    'text-lg transition-transform duration-150',
                    isFocused && 'scale-110'
                )}
                aria-hidden="true"
            >
                {option.icon}
            </span>
            <span className="text-[10px] font-medium leading-tight">
                {option.label}
            </span>
        </button>
    )
}
