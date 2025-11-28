'use client'

/**
 * CommandList Component
 * 
 * Renders the grouped list of commands in the command palette.
 */

import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import { Command, CommandCategory } from '../../types'
import { categoryLabels } from '../../useCommands'
import { CommandItem } from './CommandItem'

interface GroupedCommands {
  category: CommandCategory
  commands: Command[]
}

interface CommandListProps {
  groupedCommands: GroupedCommands[]
  flatCommands: Command[]
  selectedIndex: number
  onExecute: (command: Command) => void
  onSelect: (index: number) => void
}

export const CommandList = forwardRef<HTMLDivElement, CommandListProps>(
  function CommandList(
    { groupedCommands, selectedIndex, onExecute, onSelect },
    ref
  ) {
    let commandIndex = 0

    return (
      <div
        ref={ref}
        id="command-list"
        role="listbox"
        className="max-h-[50vh] overflow-y-auto py-2"
        data-testid="command-palette-list"
      >
        {groupedCommands.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No commands found</p>
          </div>
        ) : (
          groupedCommands.map(({ category, commands: cmds }) => (
            <div key={category} className="mb-2 last:mb-0">
              {/* Category Header */}
              <div className="px-4 py-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category]}
                </span>
              </div>

              {/* Commands in Category */}
              {cmds.map((cmd) => {
                const currentIndex = commandIndex++
                const isSelected = currentIndex === selectedIndex

                return (
                  <CommandItem
                    key={cmd.id}
                    command={cmd}
                    index={currentIndex}
                    isSelected={isSelected}
                    onExecute={onExecute}
                    onSelect={onSelect}
                  />
                )
              })}
            </div>
          ))
        )}
      </div>
    )
  }
)
