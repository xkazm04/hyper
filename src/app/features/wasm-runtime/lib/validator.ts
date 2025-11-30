// Bundle Validator - Corruption-resistant bundle validation
// Verifies bundle integrity via checksum and schema before deserialization

import type {
  CompiledStoryBundle,
  BundleValidationResult,
  BundleValidationError,
  BundleValidationWarning,
  BundleErrorCode,
  BundleWarningCode,
  BundleLoadOptions,
  BundleLoaderState,
} from './types'
import { generateChecksum } from './utils'

const SUPPORTED_VERSIONS = ['1.0.0', '1.0.1', '1.1.0']
const MAX_RECOMMENDED_BUNDLE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Default options for bundle loading
 */
const DEFAULT_LOAD_OPTIONS: Required<BundleLoadOptions> = {
  validateChecksum: true,
  validateSchema: true,
  maxRetries: 3,
  retryDelay: 1000,
  lastKnownGoodKey: '',
  onValidationProgress: () => {},
}

/**
 * Creates an initial loader state
 */
export function createInitialLoaderState(): BundleLoaderState {
  return {
    status: 'idle',
    error: null,
    warnings: [],
    retryCount: 0,
    maxRetries: DEFAULT_LOAD_OPTIONS.maxRetries,
    hasLastKnownGood: false,
    lastKnownGoodKey: null,
  }
}

/**
 * Creates a validation error object
 */
function createError(
  code: BundleErrorCode,
  message: string,
  field?: string,
  details?: unknown
): BundleValidationError {
  return { code, message, field, details }
}

/**
 * Creates a validation warning object
 */
function createWarning(
  code: BundleWarningCode,
  message: string,
  suggestion?: string
): BundleValidationWarning {
  return { code, message, suggestion }
}

/**
 * Validates bundle schema structure
 */
function validateSchema(bundle: unknown): { valid: boolean; errors: BundleValidationError[] } {
  const errors: BundleValidationError[] = []

  if (!bundle || typeof bundle !== 'object') {
    errors.push(createError('CORRUPT_DATA', 'Bundle is not a valid object'))
    return { valid: false, errors }
  }

  const b = bundle as Record<string, unknown>

  // Check required top-level fields
  if (!b.version || typeof b.version !== 'string') {
    errors.push(createError('MISSING_VERSION', 'Bundle version is missing or invalid', 'version'))
  } else if (!SUPPORTED_VERSIONS.includes(b.version)) {
    errors.push(
      createError(
        'UNSUPPORTED_VERSION',
        `Bundle version "${b.version}" is not supported. Supported: ${SUPPORTED_VERSIONS.join(', ')}`,
        'version'
      )
    )
  }

  if (!b.metadata || typeof b.metadata !== 'object') {
    errors.push(createError('MISSING_METADATA', 'Bundle metadata is missing', 'metadata'))
  } else {
    const meta = b.metadata as Record<string, unknown>
    if (!meta.id) {
      errors.push(createError('SCHEMA_INVALID', 'Metadata is missing required field "id"', 'metadata.id'))
    }
    if (!meta.name) {
      errors.push(createError('SCHEMA_INVALID', 'Metadata is missing required field "name"', 'metadata.name'))
    }
  }

  if (!b.data || typeof b.data !== 'object') {
    errors.push(createError('MISSING_DATA', 'Bundle data is missing', 'data'))
  } else {
    const data = b.data as Record<string, unknown>

    if (!data.stack || typeof data.stack !== 'object') {
      errors.push(createError('MISSING_STACK', 'Stack data is missing', 'data.stack'))
    }

    if (!Array.isArray(data.cards)) {
      errors.push(createError('SCHEMA_INVALID', 'Cards must be an array', 'data.cards'))
    } else if (data.cards.length === 0) {
      errors.push(createError('EMPTY_CARDS', 'Bundle contains no cards', 'data.cards'))
    } else {
      // Validate card structure
      for (let i = 0; i < data.cards.length; i++) {
        const card = data.cards[i] as Record<string, unknown>
        if (!card.id) {
          errors.push(createError('SCHEMA_INVALID', `Card at index ${i} is missing id`, `data.cards[${i}].id`))
        }
      }
    }

    if (!Array.isArray(data.choices)) {
      errors.push(createError('SCHEMA_INVALID', 'Choices must be an array', 'data.choices'))
    }

    if (!data.navigation || typeof data.navigation !== 'object') {
      errors.push(createError('INVALID_NAVIGATION', 'Navigation graph is missing', 'data.navigation'))
    } else {
      const nav = data.navigation as Record<string, unknown>
      if (!nav.entryNodeId) {
        errors.push(createError('NO_ENTRY_POINT', 'No entry point defined in navigation', 'data.navigation.entryNodeId'))
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Validates bundle checksum
 */
async function validateChecksum(
  bundle: CompiledStoryBundle
): Promise<{ valid: boolean; computed: string; expected: string }> {
  const bundleData = JSON.stringify({ metadata: bundle.metadata, data: bundle.data, assets: bundle.assets })
  const computed = await generateChecksum(bundleData)
  const expected = bundle.checksum || ''

  return {
    valid: computed === expected,
    computed,
    expected,
  }
}

/**
 * Checks for warnings in the bundle
 */
function checkWarnings(bundle: CompiledStoryBundle, bundleSize?: number): BundleValidationWarning[] {
  const warnings: BundleValidationWarning[] = []

  // Check for orphaned cards
  if (bundle.data.navigation.orphans.length > 0) {
    warnings.push(
      createWarning(
        'ORPHANED_CARDS',
        `${bundle.data.navigation.orphans.length} card(s) are not reachable from the entry point`,
        'Consider linking these cards or removing them'
      )
    )
  }

  // Check for dead ends
  if (bundle.data.navigation.deadEnds.length > 0) {
    warnings.push(
      createWarning(
        'DEAD_END_CARDS',
        `${bundle.data.navigation.deadEnds.length} card(s) have no outgoing choices`,
        'Add choices or mark as intentional endings'
      )
    )
  }

  // Check for large bundle size
  if (bundleSize && bundleSize > MAX_RECOMMENDED_BUNDLE_SIZE) {
    warnings.push(
      createWarning(
        'LARGE_BUNDLE',
        `Bundle size (${Math.round(bundleSize / 1024 / 1024)}MB) exceeds recommended limit`,
        'Consider compressing assets or splitting the story'
      )
    )
  }

  // Check for old version
  if (bundle.version !== SUPPORTED_VERSIONS[SUPPORTED_VERSIONS.length - 1]) {
    warnings.push(
      createWarning('OLD_VERSION', `Bundle uses version ${bundle.version}`, 'Consider recompiling with the latest version')
    )
  }

  return warnings
}

/**
 * Comprehensive bundle validation with checksum and schema verification
 */
export async function validateBundleIntegrity(
  bundle: unknown,
  options: Partial<BundleLoadOptions> = {}
): Promise<BundleValidationResult> {
  const opts = { ...DEFAULT_LOAD_OPTIONS, ...options }
  const result: BundleValidationResult = {
    isValid: false,
    errors: [],
    warnings: [],
    checksumValid: false,
    schemaValid: false,
    computedChecksum: null,
    expectedChecksum: null,
  }

  // Step 1: Validate schema
  opts.onValidationProgress?.('Validating schema...')
  const schemaResult = validateSchema(bundle)
  result.schemaValid = schemaResult.valid
  result.errors.push(...schemaResult.errors)

  if (!schemaResult.valid) {
    return result
  }

  const validBundle = bundle as CompiledStoryBundle

  // Step 2: Validate checksum (if enabled)
  if (opts.validateChecksum) {
    opts.onValidationProgress?.('Verifying checksum...')
    const checksumResult = await validateChecksum(validBundle)
    result.checksumValid = checksumResult.valid
    result.computedChecksum = checksumResult.computed
    result.expectedChecksum = checksumResult.expected

    if (!checksumResult.valid) {
      result.errors.push(
        createError(
          'CHECKSUM_MISMATCH',
          'Bundle checksum verification failed. The bundle may be corrupted.',
          'checksum',
          { computed: checksumResult.computed, expected: checksumResult.expected }
        )
      )
      return result
    }
  } else {
    result.checksumValid = true
  }

  // Step 3: Check warnings
  opts.onValidationProgress?.('Checking for issues...')
  result.warnings = checkWarnings(validBundle)

  result.isValid = true
  return result
}

/**
 * Safely parses bundle bytes with error handling
 */
export function safeParseBundleBytes(bytes: Uint8Array): {
  bundle: CompiledStoryBundle | null
  error: BundleValidationError | null
} {
  try {
    const decoder = new TextDecoder()
    const json = decoder.decode(bytes)
    const bundle = JSON.parse(json)
    return { bundle, error: null }
  } catch (err) {
    return {
      bundle: null,
      error: createError(
        'PARSE_ERROR',
        `Failed to parse bundle: ${err instanceof Error ? err.message : 'Unknown error'}`,
        undefined,
        err
      ),
    }
  }
}

/**
 * Saves a validated bundle as "last known good" state
 */
export function saveLastKnownGood(key: string, bundle: CompiledStoryBundle): boolean {
  try {
    const serialized = JSON.stringify(bundle)
    localStorage.setItem(`lkg_${key}`, serialized)
    localStorage.setItem(`lkg_${key}_timestamp`, Date.now().toString())
    return true
  } catch (err) {
    console.warn('Failed to save last known good bundle:', err)
    return false
  }
}

/**
 * Retrieves the last known good bundle
 */
export function getLastKnownGood(key: string): CompiledStoryBundle | null {
  try {
    const serialized = localStorage.getItem(`lkg_${key}`)
    if (!serialized) return null
    return JSON.parse(serialized)
  } catch {
    return null
  }
}

/**
 * Checks if a last known good bundle exists
 */
export function hasLastKnownGood(key: string): boolean {
  try {
    return localStorage.getItem(`lkg_${key}`) !== null
  } catch {
    return false
  }
}

/**
 * Clears the last known good bundle
 */
export function clearLastKnownGood(key: string): void {
  try {
    localStorage.removeItem(`lkg_${key}`)
    localStorage.removeItem(`lkg_${key}_timestamp`)
  } catch {
    // Ignore errors
  }
}

/**
 * Gets user-friendly error message for display
 */
export function getErrorMessage(error: BundleValidationError): string {
  const messages: Record<BundleErrorCode, string> = {
    CHECKSUM_MISMATCH: 'The story bundle appears to be corrupted. The data may have been modified during transfer.',
    SCHEMA_INVALID: 'The story bundle has an invalid format and cannot be loaded.',
    MISSING_VERSION: 'The story bundle is missing version information.',
    MISSING_METADATA: 'The story bundle is missing required metadata.',
    MISSING_DATA: 'The story bundle is missing story data.',
    MISSING_STACK: 'The story bundle is missing the story stack information.',
    EMPTY_CARDS: 'The story bundle contains no story cards to display.',
    NO_ENTRY_POINT: 'The story bundle has no starting point defined.',
    PARSE_ERROR: 'The story bundle could not be read. The file may be damaged.',
    CORRUPT_DATA: 'The story bundle data is corrupted and cannot be loaded.',
    INVALID_NAVIGATION: 'The story bundle has invalid navigation data.',
    UNSUPPORTED_VERSION: 'This story bundle was created with an unsupported version.',
  }

  return messages[error.code] || error.message
}

/**
 * Gets suggested action for an error
 */
export function getErrorAction(error: BundleValidationError): string {
  const actions: Record<BundleErrorCode, string> = {
    CHECKSUM_MISMATCH: 'Try reloading the story or contact the author for a new copy.',
    SCHEMA_INVALID: 'The story needs to be recompiled. Contact the author.',
    MISSING_VERSION: 'The story needs to be recompiled with a newer version.',
    MISSING_METADATA: 'The story file is incomplete. Try downloading again.',
    MISSING_DATA: 'The story file is incomplete. Try downloading again.',
    MISSING_STACK: 'The story file is incomplete. Try downloading again.',
    EMPTY_CARDS: 'This story has no content yet.',
    NO_ENTRY_POINT: 'The story author needs to set a starting card.',
    PARSE_ERROR: 'Try reloading the page or downloading the story again.',
    CORRUPT_DATA: 'Try reloading the page or downloading the story again.',
    INVALID_NAVIGATION: 'The story needs to be recompiled. Contact the author.',
    UNSUPPORTED_VERSION: 'Update your player or ask the author for a compatible version.',
  }

  return actions[error.code] || 'Try reloading the page.'
}

/**
 * Delay utility for retries
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
