/**
 * Command Scripting Engine Types
 *
 * Defines the DSL types for user-authored command scripts.
 * Commands can be declaratively defined and compiled into executable command objects.
 */

import type { CommandCategory } from '../../types'

/**
 * A command script definition in the DSL format.
 * Users write these to define custom commands.
 */
export interface CommandScript {
  /** Unique identifier for the command */
  id: string
  /** Display label in the command palette */
  label: string
  /** Optional description */
  description?: string
  /** Category for grouping in the palette */
  category: CommandCategory | 'custom' | 'ai' | 'automation'
  /** Optional keyboard shortcut */
  shortcut?: string
  /** Optional icon name from lucide-react */
  icon?: string
  /** The actions to execute when the command is run */
  actions: ScriptAction[]
  /** Conditions that must be met for the command to be enabled */
  when?: ScriptCondition[]
  /** Script metadata */
  metadata?: ScriptMetadata
}

/**
 * Supported action types in the scripting engine
 */
export type ScriptActionType =
  | 'navigate'
  | 'card.create'
  | 'card.update'
  | 'card.delete'
  | 'card.duplicate'
  | 'card.select'
  | 'character.create'
  | 'character.update'
  | 'character.select'
  | 'choice.create'
  | 'choice.delete'
  | 'ai.complete'
  | 'ai.generateImage'
  | 'ai.generateChoices'
  | 'ai.generateContent'
  | 'export.json'
  | 'export.story'
  | 'ui.notify'
  | 'ui.confirm'
  | 'ui.prompt'
  | 'view.toggle'
  | 'publish'
  | 'unpublish'
  | 'custom'

/**
 * An action to execute within a command script
 */
export interface ScriptAction {
  /** The type of action */
  type: ScriptActionType
  /** Parameters for the action */
  params?: Record<string, ScriptValue>
  /** Store the result in a variable for later use */
  storeAs?: string
  /** Condition to check before executing this action */
  if?: ScriptCondition
}

/**
 * A value in a script - can be a literal, variable reference, or expression
 */
export type ScriptValue =
  | string
  | number
  | boolean
  | null
  | { $var: string }  // Variable reference: { $var: "cardTitle" }
  | { $expr: string } // Expression: { $expr: "currentCard.title + ' - Copy'" }
  | { $context: ContextPath } // Context reference: { $context: "currentCard.id" }

/**
 * Paths into the editor context
 */
export type ContextPath =
  | 'currentCard'
  | 'currentCard.id'
  | 'currentCard.title'
  | 'currentCard.content'
  | 'currentCard.imageUrl'
  | 'currentCharacter'
  | 'currentCharacter.id'
  | 'currentCharacter.name'
  | 'storyStack'
  | 'storyStack.id'
  | 'storyStack.name'
  | 'storyCards'
  | 'storyCards.length'
  | 'characters'
  | 'characters.length'
  | 'choices'

/**
 * A condition that can enable/disable commands or actions
 */
export interface ScriptCondition {
  /** The context path or variable to check */
  path: string | { $context: ContextPath | string }
  /** The operator for comparison */
  operator: 'exists' | 'not_exists' | 'equals' | 'not_equals' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
  /** The value to compare against (not needed for exists/not_exists) */
  value?: ScriptValue
}

/**
 * Metadata for a command script
 */
export interface ScriptMetadata {
  /** Author of the script */
  author?: string
  /** Version of the script */
  version?: string
  /** Description of what the script does */
  about?: string
  /** Tags for categorization */
  tags?: string[]
  /** When the script was created */
  createdAt?: string
  /** When the script was last updated */
  updatedAt?: string
}

/**
 * A library of command scripts that can be saved, shared, and imported
 */
export interface CommandScriptLibrary {
  /** Unique identifier for the library */
  id: string
  /** Display name for the library */
  name: string
  /** Description of the library */
  description?: string
  /** The command scripts in this library */
  scripts: CommandScript[]
  /** Library metadata */
  metadata?: {
    author?: string
    version?: string
    createdAt?: string
    updatedAt?: string
    exportedFrom?: string
  }
}

/**
 * Result of parsing a command script
 */
export interface ParseResult {
  success: boolean
  script?: CommandScript
  errors?: ParseError[]
  warnings?: ParseWarning[]
}

/**
 * Error during script parsing
 */
export interface ParseError {
  message: string
  line?: number
  column?: number
  path?: string
}

/**
 * Warning during script parsing (non-fatal)
 */
export interface ParseWarning {
  message: string
  line?: number
  path?: string
}

/**
 * Execution context passed to script actions
 */
export interface ScriptExecutionContext {
  /** Variables set during script execution */
  variables: Map<string, unknown>
  /** The editor context */
  editor: {
    storyStack: unknown
    storyCards: unknown[]
    currentCard: unknown | null
    currentCardId: string | null
    choices: unknown[]
    characters: unknown[]
    currentCharacter: unknown | null
    currentCharacterId: string | null
  }
  /** Services available for actions */
  services: {
    aiComplete: (prompt: string, systemPrompt?: string) => Promise<string>
    aiGenerateImage: (prompt: string) => Promise<string>
    notify: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void
    confirm: (message: string) => Promise<boolean>
    prompt: (message: string, defaultValue?: string) => Promise<string | null>
  }
}

/**
 * Result of executing a command script
 */
export interface ScriptExecutionResult {
  success: boolean
  error?: string
  variables?: Record<string, unknown>
}

/**
 * Extended command category including script-specific categories
 */
export type ExtendedCommandCategory = CommandCategory | 'custom' | 'ai' | 'automation'
