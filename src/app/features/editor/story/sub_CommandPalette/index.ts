export { default as CommandPalette } from './CommandPalette'
export { CommandPaletteProvider, useCommandPalette } from './CommandPaletteContext'
export { CommandRippleProvider, useCommandRipple } from './lib/CommandRippleContext'
export { CommandRippleOverlay } from './components/CommandRippleOverlay'
export { useCommands, categoryLabels, categoryOrder } from './useCommands'
export type { Command, CommandCategory, CommandPaletteContextType } from './types'

// Unified Script State Provider (combines ScriptContext and StoryDSLContext)
export {
  ScriptStateProvider,
  useScriptState,
  // Legacy exports for backward compatibility (deprecated)
  ScriptProvider,
  StoryDSLProvider,
  useScripts,
  useStoryDSL,
} from './lib/scripting/ScriptStateContext'
export { ScriptEditor, StoryDSLEditor } from './components/ScriptEditor'
export type {
  CommandScript,
  CommandScriptLibrary,
  ScriptAction,
  ScriptActionType,
  ScriptCondition,
  ScriptValue,
  ExtendedCommandCategory,
} from './lib/scripting'
export {
  parseCommandScript,
  parseCommandLibrary,
  serializeCommandScript,
  serializeCommandLibrary,
} from './lib/scripting'

// Story DSL
export {
  parseStoryDsl,
  serializeStoryToDsl,
  serializeCardsToDsl,
  validateStoryDsl,
  type DslCard,
  type DslChoice,
  type DslDocument,
  type DslParseResult,
  type DslSyncState,
} from './lib/scripting/storyDsl'
