// WASM Runtime Types
// Types for serializing stories into WASM-compatible binary format

import type { StoryStack, StoryCard, Choice, Character, PreviewTheme } from '@/lib/types'

/**
 * Compiled story bundle ready for WASM runtime
 * This is the serialized format that gets embedded into the WASM module
 */
export interface CompiledStoryBundle {
  version: string
  compiledAt: string
  checksum: string
  metadata: StoryBundleMetadata
  data: SerializedStoryData
  assets: AssetManifest
}

/**
 * Metadata about the compiled story
 */
export interface StoryBundleMetadata {
  id: string
  name: string
  description: string | null
  author: string | null
  slug: string | null
  theme: PreviewTheme | null
  artStyleId: string | null
  entryCardId: string | null
  cardCount: number
  choiceCount: number
  characterCount: number
  totalAssetSize: number
  estimatedPlaytime: number | null
}

/**
 * Serialized story data in a compact format
 */
export interface SerializedStoryData {
  stack: SerializedStack
  cards: SerializedCard[]
  choices: SerializedChoice[]
  characters: SerializedCharacter[]
  navigation: NavigationGraph
}

/**
 * Compact stack representation
 */
export interface SerializedStack {
  id: string
  name: string
  description: string | null
  firstCardId: string | null
  artStyleId: string | null
  customArtStylePrompt: string | null
  previewTheme: PreviewTheme | null
}

/**
 * Compact card representation
 */
export interface SerializedCard {
  id: string
  title: string
  content: string
  script: string
  imageRef: string | null // Reference to asset in manifest
  message: string | null
  speaker: string | null
  speakerType: 'character' | 'narrator' | 'system' | null
  orderIndex: number
}

/**
 * Compact choice representation
 */
export interface SerializedChoice {
  id: string
  cardId: string
  label: string
  targetId: string
  orderIndex: number
}

/**
 * Compact character representation
 */
export interface SerializedCharacter {
  id: string
  name: string
  appearance: string
  imageRefs: string[] // References to assets in manifest
  avatarRef: string | null
  orderIndex: number
}

/**
 * Pre-computed navigation graph for fast traversal
 */
export interface NavigationGraph {
  nodes: Record<string, NavigationNode>
  edges: NavigationEdge[]
  entryNodeId: string | null
  deadEnds: string[]
  orphans: string[]
}

export interface NavigationNode {
  cardId: string
  outEdges: string[]
  inEdges: string[]
  isDeadEnd: boolean
  isOrphan: boolean
  depth: number // Distance from entry node
}

export interface NavigationEdge {
  id: string
  sourceCardId: string
  targetCardId: string
  choiceId: string
  label: string
}

/**
 * Asset manifest for embedded images and media
 */
export interface AssetManifest {
  images: AssetEntry[]
  totalSize: number
  compression: 'none' | 'gzip' | 'br'
}

export interface AssetEntry {
  id: string
  url: string
  dataUri: string | null // Base64 encoded for embedding
  mimeType: string
  size: number
  width: number | null
  height: number | null
  isEmbedded: boolean
}

/**
 * Runtime state for the WASM player
 */
export interface WasmRuntimeState {
  currentCardId: string | null
  history: string[]
  variables: Record<string, unknown>
  flags: Set<string>
  visitedCards: Set<string>
  playStartTime: number
  totalPlayTime: number
  isComplete: boolean
}

/**
 * Runtime event types
 */
export type RuntimeEventType =
  | 'card_entered'
  | 'choice_selected'
  | 'card_exited'
  | 'story_started'
  | 'story_completed'
  | 'state_restored'
  | 'script_executed'
  | 'error'

export interface RuntimeEvent {
  type: RuntimeEventType
  timestamp: number
  cardId?: string
  choiceId?: string
  data?: unknown
}

/**
 * Options for compiling a story bundle
 */
export interface CompileOptions {
  embedAssets: boolean
  compressAssets: boolean
  maxAssetSize: number // Max size in bytes per asset
  maxBundleSize: number // Max total bundle size
  includeDebugInfo: boolean
  optimizeForSize: boolean
  targetFormat: 'wasm' | 'json' | 'binary'
}

/**
 * Result of compilation
 */
export interface CompileResult {
  success: boolean
  bundle: CompiledStoryBundle | null
  wasmBytes: Uint8Array | null
  errors: CompileError[]
  warnings: CompileWarning[]
  stats: CompileStats
}

export interface CompileError {
  code: string
  message: string
  cardId?: string
  field?: string
}

export interface CompileWarning {
  code: string
  message: string
  cardId?: string
  suggestion?: string
}

export interface CompileStats {
  totalCards: number
  totalChoices: number
  totalCharacters: number
  totalAssets: number
  bundleSizeBytes: number
  compileDurationMs: number
  assetsSizeBytes: number
  dataCompressionRatio: number
}

/**
 * Export format options
 */
export type ExportFormat = 'wasm-standalone' | 'wasm-embed' | 'html-bundle' | 'json-bundle'

export interface ExportOptions {
  format: ExportFormat
  filename: string
  includePlayer: boolean
  minifyOutput: boolean
  embedStyles: boolean
  customCss?: string
  customJs?: string
}

/**
 * Sync capabilities for online updates
 */
export interface SyncCapabilities {
  canSync: boolean
  lastSyncTime: number | null
  pendingUpdates: number
  syncEndpoint: string | null
}
