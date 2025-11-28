export interface Command {
  id: string
  label: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  shortcut?: string
  category: CommandCategory
  action: () => void | Promise<void>
  disabled?: boolean
}

export type CommandCategory =
  | 'navigation'
  | 'cards'
  | 'characters'
  | 'story'
  | 'view'
  | 'export'

export interface CommandPaletteContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}
