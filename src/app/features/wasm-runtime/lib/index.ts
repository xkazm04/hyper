// WASM Runtime Library - Barrel exports
// Compile story bundles and run them entirely offline in the browser

// Types
export type {
  CompiledStoryBundle,
  StoryBundleMetadata,
  SerializedStoryData,
  SerializedStack,
  SerializedCard,
  SerializedChoice,
  SerializedCharacter,
  NavigationGraph,
  NavigationNode,
  NavigationEdge,
  AssetManifest,
  AssetEntry,
  WasmRuntimeState,
  RuntimeEventType,
  RuntimeEvent,
  CompileOptions,
  CompileResult,
  CompileError,
  CompileWarning,
  CompileStats,
  ExportFormat,
  ExportOptions,
  SyncCapabilities,
} from './types'

// Serialization
export {
  serializeStory,
  buildNavigationGraph,
  bundleToBytes,
  bytesToBundle,
  validateBundle,
} from './serializer'

// Compiler
export {
  compileStory,
  exportBundle,
  createDownloadUrl,
  revokeDownloadUrl,
  downloadFile,
} from './compiler'

// Runtime
export { WasmRuntime, createRuntime, type RuntimeEventListener } from './runtime'

// Sync
export {
  WasmSyncManager,
  createSyncManager,
  useSyncStatus,
  type SyncEventType,
  type SyncEvent,
  type SyncEventListener,
} from './sync'

// Utilities
export {
  generateChecksum,
  estimatePlaytime,
  compressData,
  decompressData,
  formatBytes,
  formatDuration,
  generateRuntimeId,
  canLoadBundle,
  deepFreeze,
  deepClone,
  debounce,
  createSandbox,
} from './utils'
