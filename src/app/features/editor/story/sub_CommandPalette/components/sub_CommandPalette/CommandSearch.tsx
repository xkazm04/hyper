'use client'

/**
 * CommandSearch Component
 * 
 * Search input for filtering commands in the command palette.
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Command as CommandIcon } from 'lucide-react'
import { Command } from '../../types'

interface CommandSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onKeyDown: (event: React.KeyboardEvent) => void
  flatCommands: Command[]
  selectedIndex: number
}

export const CommandSearch = forwardRef<HTMLInputElement, CommandSearchProps>(
  function CommandSearch(
    { searchQuery, onSearchChange, onKeyDown, flatCommands, selectedIndex },
    ref
  ) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-border">
        <CommandIcon className="w-5 h-5 text-muted-foreground shrink-0" />
        <input
          ref={ref}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command or search..."
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-foreground placeholder:text-muted-foreground',
            'text-base'
          )}
          aria-label="Search commands"
          aria-controls="command-list"
          aria-activedescendant={
            flatCommands[selectedIndex]
              ? `command-${flatCommands[selectedIndex].id}`
              : undefined
          }
          data-testid="command-palette-input"
        />
        <kbd
          className={cn(
            'hidden sm:inline-flex items-center gap-1',
            'px-2 py-1 text-xs font-mono',
            'bg-muted text-muted-foreground rounded'
          )}
        >
          Esc
        </kbd>
      </div>
    )
  }
)
