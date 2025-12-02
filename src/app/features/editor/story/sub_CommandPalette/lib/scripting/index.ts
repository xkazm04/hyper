/**
 * Command Scripting Engine
 *
 * A lightweight DSL for authoring custom editor commands.
 * Scripts can be saved, shared, and imported as part of stack templates.
 */

// Types
export type {
  CommandScript,
  ScriptAction,
  ScriptActionType,
  ScriptCondition,
  ScriptValue,
  ContextPath,
  ScriptMetadata,
  CommandScriptLibrary,
  ParseResult,
  ParseError,
  ParseWarning,
  ScriptExecutionContext,
  ScriptExecutionResult,
  ExtendedCommandCategory,
} from './types'

// Parser
export {
  parseCommandScript,
  parseCommandLibrary,
  serializeCommandScript,
  serializeCommandLibrary,
} from './parser'

// Engine
export {
  compileScript,
  executeScript,
} from './engine'
