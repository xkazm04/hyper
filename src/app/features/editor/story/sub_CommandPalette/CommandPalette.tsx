'use client'

/**
 * CommandPalette Component
 * 
 * A command palette for quick access to editor commands.
 * Supports keyboard navigation, search filtering, and grouped commands.
 * 
 * Halloween Effect: fog-overlay on backdrop
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Command, CommandCategory } from './types'
import { categoryOrder } from './useCommands'
import { useCommandPalette } from './CommandPaletteContext'
import { useCommandRipple } from './lib/CommandRippleContext'
import { CommandSearch, CommandList } from './components/sub_CommandPalette'

interface CommandPaletteProps {
  commands: Command[]
}

export default function CommandPalette({ commands }: CommandPaletteProps) {
  const { isOpen, close } = useCommandPalette()
  const { triggerRipple } = useCommandRipple()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands
    const query = searchQuery.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        cmd.description?.toLowerCase().includes(query) ||
        cmd.category.toLowerCase().includes(query)
    )
  }, [commands, searchQuery])

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups = new Map<CommandCategory, Command[]>()
    filteredCommands.forEach((cmd) => {
      const existing = groups.get(cmd.category) || []
      groups.set(cmd.category, [...existing, cmd])
    })
    const sorted: { category: CommandCategory; commands: Command[] }[] = []
    categoryOrder.forEach((cat) => {
      const cmds = groups.get(cat)
      if (cmds && cmds.length > 0) {
        sorted.push({ category: cat, commands: cmds })
      }
    })
    return sorted
  }, [filteredCommands])

  // Flatten for keyboard navigation
  const flatCommands = useMemo(
    () => groupedCommands.flatMap((g) => g.commands),
    [groupedCommands]
  )


  // Reset state when palette opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setSelectedIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex((prev) => (prev < flatCommands.length - 1 ? prev + 1 : 0))
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatCommands.length - 1))
          break
        case 'Enter':
          event.preventDefault()
          if (flatCommands[selectedIndex]) executeCommand(flatCommands[selectedIndex])
          break
        case 'Escape':
          event.preventDefault()
          close()
          break
      }
    },
    [flatCommands, selectedIndex, close]
  )

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  const executeCommand = useCallback(
    (command: Command, originElement?: HTMLElement | null) => {
      // Get the origin element for the ripple effect
      const element = originElement || listRef.current?.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null

      // Determine target ID based on command type (for highlighting)
      // Commands that navigate to cards will have their target highlighted
      let targetId: string | undefined
      if (command.id.includes('card') || command.id.includes('character')) {
        // Target will be set by the action itself if it navigates to a specific card
        targetId = undefined
      }

      // Trigger ripple animation and audio feedback
      triggerRipple(element, targetId, command.id)

      close()
      requestAnimationFrame(() => command.action())
    },
    [close, triggerRipple, selectedIndex]
  )

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget) close()
    },
    [close]
  )

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query)
    setSelectedIndex(0)
  }, [])

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-start justify-center pt-[15vh]',
        'bg-background/80 backdrop-blur-sm',
        'animate-in fade-in-0 duration-150',
        'halloween-fog'
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      data-testid="command-palette-overlay"
    >
      <div
        className={cn(
          'w-full max-w-lg mx-4',
          'bg-card border-4 border-border',
          'shadow-[8px_8px_0px_0px_hsl(var(--border))]',
          'animate-in slide-in-from-top-4 fade-in-0 duration-200'
        )}
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        data-testid="command-palette-dialog"
      >
        <CommandSearch
          ref={inputRef}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          flatCommands={flatCommands}
          selectedIndex={selectedIndex}
        />

        <CommandList
          ref={listRef}
          groupedCommands={groupedCommands}
          flatCommands={flatCommands}
          selectedIndex={selectedIndex}
          onExecute={executeCommand}
          onSelect={setSelectedIndex}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t-2 border-border bg-muted/50">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">&uarr;&darr;</kbd>
              <span>Navigate</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded font-mono">Enter</kbd>
              <span>Select</span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {flatCommands.length} command{flatCommands.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}
