/**
 * Story DSL Module
 *
 * A lightweight domain-specific language for representing story graphs as text.
 * Enables version control, diffing, and collaborative editing.
 */

// Types
export type {
  DslCard,
  DslChoice,
  DslMetadata,
  DslDocument,
  DslParseResult,
  DslParseError,
  DslParseWarning,
  DslSerializeOptions,
  DslParseOptions,
  DslIdMapping,
  DslApplyResult,
  DslDiff,
} from './types'

// Parser
export { parseStoryDsl, validateStoryDsl } from './parser'

// Serializer
export { serializeStoryToDsl, serializeCardsToDsl } from './serializer'

// Sync
export {
  applyDslToGraph,
  computeDslDiff,
  createSyncState,
  updateSyncStateFromDsl,
  updateSyncStateFromGraph,
  type DslSyncState,
} from './sync'
