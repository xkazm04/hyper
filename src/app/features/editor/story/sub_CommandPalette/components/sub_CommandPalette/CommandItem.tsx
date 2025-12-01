'use client'

/**
 * CommandItem Component
 * 
 * Renders a single command item in the command palette list.
 */

import { cn } from '@/lib/utils'
import { Command } from '../../types'

interface CommandItemProps {
  command: Command
  index: number
  isSelected: boolean
  onExecute: (command: Command, element?: HTMLElement | null) => void
  onSelect: (index: number) => void
}

export function CommandItem({
  command,
  index,
  isSelected,
  onExecute,
  onSelect,
}: CommandItemProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onExecute(command, e.currentTarget)
  }

  return (
    <button
      id={`command-${command.id}`}
      role="option"
      aria-selected={isSelected}
      data-index={index}
      onClick={handleClick}
      onMouseEnter={() => onSelect(index)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2',
        'text-left transition-colors duration-100',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-muted'
      )}
      data-testid={`command-palette-item-${command.id}`}
    >
      {/* Icon */}
      {command.icon && (
        <command.icon
          className={cn(
            'w-4 h-4 shrink-0',
            isSelected ? 'text-primary-foreground' : 'text-muted-foreground'
          )}
        />
      )}

      {/* Label & Description */}
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{command.label}</div>
        {command.description && (
          <div
            className={cn(
              'text-xs truncate',
              isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {command.description}
          </div>
        )}
      </div>

      {/* Shortcut */}
      {command.shortcut && (
        <kbd
          className={cn(
            'hidden sm:inline-flex items-center gap-1',
            'px-2 py-0.5 text-xs font-mono rounded',
            isSelected
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {command.shortcut}
        </kbd>
      )}
    </button>
  )
}
