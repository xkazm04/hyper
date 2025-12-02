/**
 * Snapshot Integrity Guard for Undo/Redo
 *
 * Validates EditorSnapshot structure before applying during undo/redo operations.
 * Prevents corrupted snapshots from crashing the editor or causing data loss.
 */

import { EditorSnapshot } from '@/contexts/EditorContext'

export interface SnapshotValidationResult {
  isValid: boolean
  errors: SnapshotValidationError[]
}

export interface SnapshotValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Validates that a value is a non-null array
 */
function isValidArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Validates that a value is a string or null
 */
function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

/**
 * Validates that a value is a Set (or can be converted to one)
 */
function isValidSet(value: unknown): value is Set<string> {
  if (value instanceof Set) {
    return true
  }
  // Allow arrays to be converted to Sets (for JSON deserialization)
  if (Array.isArray(value)) {
    return value.every(item => typeof item === 'string')
  }
  return false
}

/**
 * Validates a StoryCard object has required fields
 */
function validateStoryCard(card: unknown, index: number): SnapshotValidationError[] {
  const errors: SnapshotValidationError[] = []
  const prefix = `storyCards[${index}]`

  if (typeof card !== 'object' || card === null) {
    errors.push({
      field: prefix,
      message: 'Card must be an object',
      severity: 'error',
    })
    return errors
  }

  const c = card as Record<string, unknown>

  // Required string fields
  if (typeof c.id !== 'string' || c.id.length === 0) {
    errors.push({
      field: `${prefix}.id`,
      message: 'Card ID must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.storyStackId !== 'string' || c.storyStackId.length === 0) {
    errors.push({
      field: `${prefix}.storyStackId`,
      message: 'Card storyStackId must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.title !== 'string') {
    errors.push({
      field: `${prefix}.title`,
      message: 'Card title must be a string',
      severity: 'error',
    })
  }

  if (typeof c.content !== 'string') {
    errors.push({
      field: `${prefix}.content`,
      message: 'Card content must be a string',
      severity: 'error',
    })
  }

  if (typeof c.orderIndex !== 'number') {
    errors.push({
      field: `${prefix}.orderIndex`,
      message: 'Card orderIndex must be a number',
      severity: 'error',
    })
  }

  return errors
}

/**
 * Validates a Choice object has required fields
 */
function validateChoice(choice: unknown, index: number): SnapshotValidationError[] {
  const errors: SnapshotValidationError[] = []
  const prefix = `choices[${index}]`

  if (typeof choice !== 'object' || choice === null) {
    errors.push({
      field: prefix,
      message: 'Choice must be an object',
      severity: 'error',
    })
    return errors
  }

  const c = choice as Record<string, unknown>

  if (typeof c.id !== 'string' || c.id.length === 0) {
    errors.push({
      field: `${prefix}.id`,
      message: 'Choice ID must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.storyCardId !== 'string' || c.storyCardId.length === 0) {
    errors.push({
      field: `${prefix}.storyCardId`,
      message: 'Choice storyCardId must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.label !== 'string') {
    errors.push({
      field: `${prefix}.label`,
      message: 'Choice label must be a string',
      severity: 'error',
    })
  }

  if (typeof c.targetCardId !== 'string' || c.targetCardId.length === 0) {
    errors.push({
      field: `${prefix}.targetCardId`,
      message: 'Choice targetCardId must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.orderIndex !== 'number') {
    errors.push({
      field: `${prefix}.orderIndex`,
      message: 'Choice orderIndex must be a number',
      severity: 'error',
    })
  }

  return errors
}

/**
 * Validates a Character object has required fields
 */
function validateCharacter(character: unknown, index: number): SnapshotValidationError[] {
  const errors: SnapshotValidationError[] = []
  const prefix = `characters[${index}]`

  if (typeof character !== 'object' || character === null) {
    errors.push({
      field: prefix,
      message: 'Character must be an object',
      severity: 'error',
    })
    return errors
  }

  const c = character as Record<string, unknown>

  if (typeof c.id !== 'string' || c.id.length === 0) {
    errors.push({
      field: `${prefix}.id`,
      message: 'Character ID must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.storyStackId !== 'string' || c.storyStackId.length === 0) {
    errors.push({
      field: `${prefix}.storyStackId`,
      message: 'Character storyStackId must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.name !== 'string') {
    errors.push({
      field: `${prefix}.name`,
      message: 'Character name must be a string',
      severity: 'error',
    })
  }

  if (typeof c.appearance !== 'string') {
    errors.push({
      field: `${prefix}.appearance`,
      message: 'Character appearance must be a string',
      severity: 'error',
    })
  }

  if (!isValidArray(c.imageUrls)) {
    errors.push({
      field: `${prefix}.imageUrls`,
      message: 'Character imageUrls must be an array',
      severity: 'error',
    })
  }

  if (!isValidArray(c.imagePrompts)) {
    errors.push({
      field: `${prefix}.imagePrompts`,
      message: 'Character imagePrompts must be an array',
      severity: 'error',
    })
  }

  if (typeof c.orderIndex !== 'number') {
    errors.push({
      field: `${prefix}.orderIndex`,
      message: 'Character orderIndex must be a number',
      severity: 'error',
    })
  }

  return errors
}

/**
 * Validates a CharacterCard object has required fields
 */
function validateCharacterCard(characterCard: unknown, index: number): SnapshotValidationError[] {
  const errors: SnapshotValidationError[] = []
  const prefix = `characterCards[${index}]`

  if (typeof characterCard !== 'object' || characterCard === null) {
    errors.push({
      field: prefix,
      message: 'CharacterCard must be an object',
      severity: 'error',
    })
    return errors
  }

  const c = characterCard as Record<string, unknown>

  if (typeof c.id !== 'string' || c.id.length === 0) {
    errors.push({
      field: `${prefix}.id`,
      message: 'CharacterCard ID must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.storyStackId !== 'string' || c.storyStackId.length === 0) {
    errors.push({
      field: `${prefix}.storyStackId`,
      message: 'CharacterCard storyStackId must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.characterId !== 'string' || c.characterId.length === 0) {
    errors.push({
      field: `${prefix}.characterId`,
      message: 'CharacterCard characterId must be a non-empty string',
      severity: 'error',
    })
  }

  if (typeof c.imageIndex !== 'number') {
    errors.push({
      field: `${prefix}.imageIndex`,
      message: 'CharacterCard imageIndex must be a number',
      severity: 'error',
    })
  }

  if (typeof c.orderIndex !== 'number') {
    errors.push({
      field: `${prefix}.orderIndex`,
      message: 'CharacterCard orderIndex must be a number',
      severity: 'error',
    })
  }

  return errors
}

/**
 * Validates an EditorSnapshot for structural integrity.
 *
 * @param snapshot - The snapshot to validate
 * @returns Validation result with any errors found
 */
export function validateSnapshot(snapshot: unknown): SnapshotValidationResult {
  const errors: SnapshotValidationError[] = []

  // Check if snapshot is an object
  if (typeof snapshot !== 'object' || snapshot === null) {
    return {
      isValid: false,
      errors: [{
        field: 'snapshot',
        message: 'Snapshot must be a non-null object',
        severity: 'error',
      }],
    }
  }

  const s = snapshot as Record<string, unknown>

  // Validate storyCards array
  if (!isValidArray(s.storyCards)) {
    errors.push({
      field: 'storyCards',
      message: 'storyCards must be an array',
      severity: 'error',
    })
  } else {
    for (let i = 0; i < (s.storyCards as unknown[]).length; i++) {
      errors.push(...validateStoryCard((s.storyCards as unknown[])[i], i))
    }
  }

  // Validate choices array
  if (!isValidArray(s.choices)) {
    errors.push({
      field: 'choices',
      message: 'choices must be an array',
      severity: 'error',
    })
  } else {
    for (let i = 0; i < (s.choices as unknown[]).length; i++) {
      errors.push(...validateChoice((s.choices as unknown[])[i], i))
    }
  }

  // Validate characters array
  if (!isValidArray(s.characters)) {
    errors.push({
      field: 'characters',
      message: 'characters must be an array',
      severity: 'error',
    })
  } else {
    for (let i = 0; i < (s.characters as unknown[]).length; i++) {
      errors.push(...validateCharacter((s.characters as unknown[])[i], i))
    }
  }

  // Validate characterCards array
  if (!isValidArray(s.characterCards)) {
    errors.push({
      field: 'characterCards',
      message: 'characterCards must be an array',
      severity: 'error',
    })
  } else {
    for (let i = 0; i < (s.characterCards as unknown[]).length; i++) {
      errors.push(...validateCharacterCard((s.characterCards as unknown[])[i], i))
    }
  }

  // Validate currentCardId
  if (!isStringOrNull(s.currentCardId)) {
    errors.push({
      field: 'currentCardId',
      message: 'currentCardId must be a string or null',
      severity: 'error',
    })
  }

  // Validate currentCharacterId
  if (!isStringOrNull(s.currentCharacterId)) {
    errors.push({
      field: 'currentCharacterId',
      message: 'currentCharacterId must be a string or null',
      severity: 'error',
    })
  }

  // Validate currentCharacterCardId
  if (!isStringOrNull(s.currentCharacterCardId)) {
    errors.push({
      field: 'currentCharacterCardId',
      message: 'currentCharacterCardId must be a string or null',
      severity: 'error',
    })
  }

  // Validate collapsedNodes (Set or array of strings)
  if (!isValidSet(s.collapsedNodes)) {
    errors.push({
      field: 'collapsedNodes',
      message: 'collapsedNodes must be a Set or array of strings',
      severity: 'error',
    })
  }

  // Only count errors (not warnings) for validity
  const criticalErrors = errors.filter(e => e.severity === 'error')

  return {
    isValid: criticalErrors.length === 0,
    errors,
  }
}

/**
 * Normalizes a snapshot by converting JSON-deserialized data back to proper types.
 * For example, converts arrays to Sets for collapsedNodes.
 *
 * @param snapshot - The snapshot to normalize
 * @returns Normalized snapshot
 */
export function normalizeSnapshot(snapshot: EditorSnapshot): EditorSnapshot {
  return {
    ...snapshot,
    // Ensure collapsedNodes is a Set
    collapsedNodes: snapshot.collapsedNodes instanceof Set
      ? snapshot.collapsedNodes
      : new Set(Array.isArray(snapshot.collapsedNodes)
          ? (snapshot.collapsedNodes as unknown as string[])
          : []),
  }
}

/**
 * Logs snapshot validation errors for debugging.
 *
 * @param errors - The validation errors to log
 * @param context - Additional context about when the error occurred
 */
export function logSnapshotValidationErrors(
  errors: SnapshotValidationError[],
  context: string
): void {
  console.error(
    `[Undo/Redo] Snapshot validation failed during ${context}:`,
    {
      errorCount: errors.length,
      errors: errors.map(e => ({
        field: e.field,
        message: e.message,
        severity: e.severity,
      })),
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Creates a safe fallback snapshot with empty collections.
 * Used when a snapshot is malformed and needs to be discarded.
 *
 * @returns A minimal valid EditorSnapshot
 */
export function createEmptySnapshot(): EditorSnapshot {
  return {
    storyCards: [],
    choices: [],
    characters: [],
    characterCards: [],
    currentCardId: null,
    currentCharacterId: null,
    currentCharacterCardId: null,
    collapsedNodes: new Set(),
  }
}
