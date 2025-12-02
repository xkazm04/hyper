/**
 * Story DSL Types
 *
 * A lightweight domain-specific language for representing the entire story graph
 * as plain text. Designers can edit this DSL side-by-side with the visual canvas.
 *
 * DSL Syntax Example:
 * ```
 * # Story: My Adventure
 * # Description: An epic tale
 *
 * @start
 * ## The Beginning
 * You stand at the entrance of a dark cave.
 *
 * -> Enter the cave -> cave_interior
 * -> Turn back -> forest_path
 *
 * ---
 *
 * ## cave_interior: Inside the Cave
 * The darkness surrounds you. You hear dripping water.
 *
 * -> Light a torch -> torch_lit
 * -> Call out -> echo_response
 *
 * ---
 *
 * ## forest_path: The Forest Path
 * @speaker: Narrator
 * @speakerType: narrator
 * You decide to explore the forest instead.
 *
 * -> Follow the path -> END
 * ```
 */

import type { StoryCard, Choice, StoryStack } from '@/lib/types'

/**
 * A parsed card from the DSL
 */
export interface DslCard {
  /** Card identifier (slug-like, used for references) */
  id: string
  /** Display title for the card */
  title: string
  /** Main story content */
  content: string
  /** Whether this is the start card */
  isStart: boolean
  /** Optional image prompt */
  imagePrompt?: string
  /** Optional image description */
  imageDescription?: string
  /** Optional message/dialogue */
  message?: string
  /** Optional speaker name */
  speaker?: string
  /** Optional speaker type */
  speakerType?: 'character' | 'narrator' | 'system'
  /** Outgoing choices */
  choices: DslChoice[]
  /** Line number in source (for error reporting) */
  lineNumber?: number
}

/**
 * A parsed choice from the DSL
 */
export interface DslChoice {
  /** Choice label (button text) */
  label: string
  /** Target card ID or special value like "END" */
  targetId: string
  /** Whether this is a terminal choice (ends the story) */
  isTerminal: boolean
  /** Line number in source */
  lineNumber?: number
}

/**
 * Metadata parsed from the DSL header
 */
export interface DslMetadata {
  /** Story title */
  title?: string
  /** Story description */
  description?: string
  /** Custom properties */
  properties: Record<string, string>
}

/**
 * Complete parsed DSL document
 */
export interface DslDocument {
  /** Parsed metadata */
  metadata: DslMetadata
  /** All parsed cards */
  cards: DslCard[]
  /** ID of the start card (marked with @start) */
  startCardId: string | null
}

/**
 * Result of parsing DSL text
 */
export interface DslParseResult {
  success: boolean
  document?: DslDocument
  errors: DslParseError[]
  warnings: DslParseWarning[]
}

/**
 * Error during DSL parsing
 */
export interface DslParseError {
  message: string
  line: number
  column?: number
  /** Suggested fix */
  suggestion?: string
}

/**
 * Warning during DSL parsing (non-fatal)
 */
export interface DslParseWarning {
  message: string
  line: number
  /** Warning type */
  type: 'orphaned_card' | 'dead_end' | 'duplicate_id' | 'invalid_target' | 'empty_content'
}

/**
 * Options for serializing graph to DSL
 */
export interface DslSerializeOptions {
  /** Include story metadata header */
  includeMetadata?: boolean
  /** Include image prompts */
  includeImagePrompts?: boolean
  /** Include timestamps and IDs as comments */
  includeDebugInfo?: boolean
  /** Indent size for content */
  indentSize?: number
}

/**
 * Options for parsing DSL text
 */
export interface DslParseOptions {
  /** Validate choice targets exist */
  validateTargets?: boolean
  /** Generate IDs for cards without explicit IDs */
  autoGenerateIds?: boolean
  /** Preserve original line numbers for error reporting */
  preserveLineNumbers?: boolean
}

/**
 * Mapping between DSL IDs and database UUIDs
 */
export interface DslIdMapping {
  /** Map from DSL slug ID to database UUID */
  dslToDb: Map<string, string>
  /** Map from database UUID to DSL slug ID */
  dbToDsl: Map<string, string>
}

/**
 * Result of applying DSL changes to the graph
 */
export interface DslApplyResult {
  success: boolean
  /** Cards that were created */
  created: string[]
  /** Cards that were updated */
  updated: string[]
  /** Cards that were deleted */
  deleted: string[]
  /** Choices that were created */
  choicesCreated: string[]
  /** Choices that were updated */
  choicesUpdated: string[]
  /** Choices that were deleted */
  choicesDeleted: string[]
  /** Any errors during application */
  errors: string[]
  /** Updated ID mapping */
  idMapping: DslIdMapping
}

/**
 * Diff between two DSL documents
 */
export interface DslDiff {
  /** Cards added in new document */
  addedCards: DslCard[]
  /** Cards removed from old document */
  removedCards: DslCard[]
  /** Cards that changed */
  modifiedCards: Array<{
    id: string
    changes: Partial<DslCard>
  }>
  /** Whether the start card changed */
  startCardChanged: boolean
  /** New start card ID (if changed) */
  newStartCardId?: string
}
