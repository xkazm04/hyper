/**
 * Command Script Parser
 *
 * Parses command scripts from JSON or YAML-like declarative syntax
 * into validated CommandScript objects.
 */

import type {
  CommandScript,
  ScriptAction,
  ScriptActionType,
  ScriptCondition,
  ScriptValue,
  ParseResult,
  ParseError,
  ParseWarning,
  ExtendedCommandCategory,
} from './types'

const VALID_ACTION_TYPES: ScriptActionType[] = [
  'navigate',
  'card.create',
  'card.update',
  'card.delete',
  'card.duplicate',
  'card.select',
  'character.create',
  'character.update',
  'character.select',
  'choice.create',
  'choice.delete',
  'ai.complete',
  'ai.generateImage',
  'ai.generateChoices',
  'ai.generateContent',
  'export.json',
  'export.story',
  'ui.notify',
  'ui.confirm',
  'ui.prompt',
  'view.toggle',
  'publish',
  'unpublish',
  'custom',
]

const VALID_CATEGORIES: ExtendedCommandCategory[] = [
  'navigation',
  'cards',
  'characters',
  'story',
  'view',
  'export',
  'custom',
  'ai',
  'automation',
]

const VALID_OPERATORS = [
  'exists',
  'not_exists',
  'equals',
  'not_equals',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
]

/**
 * Parse a command script from JSON string or object
 */
export function parseCommandScript(input: string | object): ParseResult {
  const errors: ParseError[] = []
  const warnings: ParseWarning[] = []

  let data: unknown

  // Parse JSON if string
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input)
    } catch (e) {
      return {
        success: false,
        errors: [{ message: `Invalid JSON: ${(e as Error).message}` }],
      }
    }
  } else {
    data = input
  }

  // Validate root object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      success: false,
      errors: [{ message: 'Script must be an object' }],
    }
  }

  const obj = data as Record<string, unknown>

  // Validate required fields
  if (!obj.id || typeof obj.id !== 'string') {
    errors.push({ message: 'Script must have a string "id" field', path: 'id' })
  }

  if (!obj.label || typeof obj.label !== 'string') {
    errors.push({ message: 'Script must have a string "label" field', path: 'label' })
  }

  if (!obj.category || typeof obj.category !== 'string') {
    errors.push({ message: 'Script must have a "category" field', path: 'category' })
  } else if (!VALID_CATEGORIES.includes(obj.category as ExtendedCommandCategory)) {
    warnings.push({
      message: `Unknown category "${obj.category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`,
      path: 'category',
    })
  }

  if (!obj.actions || !Array.isArray(obj.actions)) {
    errors.push({ message: 'Script must have an "actions" array', path: 'actions' })
  } else if (obj.actions.length === 0) {
    errors.push({ message: 'Script must have at least one action', path: 'actions' })
  }

  // Early return if critical errors
  if (errors.length > 0) {
    return { success: false, errors, warnings: warnings.length > 0 ? warnings : undefined }
  }

  // Validate actions
  const actions: ScriptAction[] = []
  for (let i = 0; i < (obj.actions as unknown[]).length; i++) {
    const actionResult = validateAction((obj.actions as unknown[])[i], `actions[${i}]`)
    if (actionResult.errors) {
      errors.push(...actionResult.errors)
    }
    if (actionResult.warnings) {
      warnings.push(...actionResult.warnings)
    }
    if (actionResult.action) {
      actions.push(actionResult.action)
    }
  }

  // Validate conditions if present
  const conditions: ScriptCondition[] = []
  if (obj.when && Array.isArray(obj.when)) {
    for (let i = 0; i < obj.when.length; i++) {
      const condResult = validateCondition(obj.when[i], `when[${i}]`)
      if (condResult.errors) {
        errors.push(...condResult.errors)
      }
      if (condResult.condition) {
        conditions.push(condResult.condition)
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors, warnings: warnings.length > 0 ? warnings : undefined }
  }

  // Build the script object
  const script: CommandScript = {
    id: obj.id as string,
    label: obj.label as string,
    category: obj.category as ExtendedCommandCategory,
    actions,
  }

  if (obj.description && typeof obj.description === 'string') {
    script.description = obj.description
  }

  if (obj.shortcut && typeof obj.shortcut === 'string') {
    script.shortcut = obj.shortcut
  }

  if (obj.icon && typeof obj.icon === 'string') {
    script.icon = obj.icon
  }

  if (conditions.length > 0) {
    script.when = conditions
  }

  if (obj.metadata && typeof obj.metadata === 'object') {
    script.metadata = obj.metadata as CommandScript['metadata']
  }

  return {
    success: true,
    script,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Validate a single action
 */
function validateAction(
  input: unknown,
  path: string
): { action?: ScriptAction; errors?: ParseError[]; warnings?: ParseWarning[] } {
  const errors: ParseError[] = []
  const warnings: ParseWarning[] = []

  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: [{ message: 'Action must be an object', path }] }
  }

  const obj = input as Record<string, unknown>

  if (!obj.type || typeof obj.type !== 'string') {
    return { errors: [{ message: 'Action must have a "type" field', path: `${path}.type` }] }
  }

  if (!VALID_ACTION_TYPES.includes(obj.type as ScriptActionType)) {
    warnings.push({
      message: `Unknown action type "${obj.type}". Valid types: ${VALID_ACTION_TYPES.join(', ')}`,
      path: `${path}.type`,
    })
  }

  const action: ScriptAction = {
    type: obj.type as ScriptActionType,
  }

  if (obj.params && typeof obj.params === 'object') {
    action.params = obj.params as Record<string, ScriptValue>
  }

  if (obj.storeAs && typeof obj.storeAs === 'string') {
    action.storeAs = obj.storeAs
  }

  if (obj.if) {
    const condResult = validateCondition(obj.if, `${path}.if`)
    if (condResult.errors) {
      errors.push(...condResult.errors)
    }
    if (condResult.condition) {
      action.if = condResult.condition
    }
  }

  return {
    action,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

/**
 * Validate a condition
 */
function validateCondition(
  input: unknown,
  path: string
): { condition?: ScriptCondition; errors?: ParseError[] } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { errors: [{ message: 'Condition must be an object', path }] }
  }

  const obj = input as Record<string, unknown>

  if (!obj.path) {
    return { errors: [{ message: 'Condition must have a "path" field', path: `${path}.path` }] }
  }

  if (!obj.operator || typeof obj.operator !== 'string') {
    return { errors: [{ message: 'Condition must have an "operator" field', path: `${path}.operator` }] }
  }

  if (!VALID_OPERATORS.includes(obj.operator)) {
    return {
      errors: [{
        message: `Invalid operator "${obj.operator}". Valid operators: ${VALID_OPERATORS.join(', ')}`,
        path: `${path}.operator`,
      }],
    }
  }

  const condition: ScriptCondition = {
    path: obj.path as ScriptCondition['path'],
    operator: obj.operator as ScriptCondition['operator'],
  }

  if (obj.value !== undefined) {
    condition.value = obj.value as ScriptValue
  }

  return { condition }
}

/**
 * Parse multiple command scripts from a library JSON
 */
export function parseCommandLibrary(input: string | object): {
  success: boolean
  scripts?: CommandScript[]
  errors?: ParseError[]
  warnings?: ParseWarning[]
} {
  let data: unknown

  if (typeof input === 'string') {
    try {
      data = JSON.parse(input)
    } catch (e) {
      return {
        success: false,
        errors: [{ message: `Invalid JSON: ${(e as Error).message}` }],
      }
    }
  } else {
    data = input
  }

  if (!data || typeof data !== 'object') {
    return { success: false, errors: [{ message: 'Library must be an object' }] }
  }

  const obj = data as Record<string, unknown>

  // Check if it's a library format or a single script
  if (obj.scripts && Array.isArray(obj.scripts)) {
    // Library format
    const allErrors: ParseError[] = []
    const allWarnings: ParseWarning[] = []
    const scripts: CommandScript[] = []

    for (let i = 0; i < obj.scripts.length; i++) {
      const result = parseCommandScript(obj.scripts[i])
      if (result.errors) {
        allErrors.push(...result.errors.map(e => ({
          ...e,
          path: `scripts[${i}].${e.path || ''}`,
        })))
      }
      if (result.warnings) {
        allWarnings.push(...result.warnings.map(w => ({
          ...w,
          path: `scripts[${i}].${w.path || ''}`,
        })))
      }
      if (result.script) {
        scripts.push(result.script)
      }
    }

    return {
      success: allErrors.length === 0,
      scripts: scripts.length > 0 ? scripts : undefined,
      errors: allErrors.length > 0 ? allErrors : undefined,
      warnings: allWarnings.length > 0 ? allWarnings : undefined,
    }
  } else if (obj.id && obj.label && obj.actions) {
    // Single script format
    const result = parseCommandScript(obj)
    return {
      success: result.success,
      scripts: result.script ? [result.script] : undefined,
      errors: result.errors,
      warnings: result.warnings,
    }
  } else {
    return {
      success: false,
      errors: [{ message: 'Invalid format. Expected a script or library object.' }],
    }
  }
}

/**
 * Serialize a command script to JSON string
 */
export function serializeCommandScript(script: CommandScript): string {
  return JSON.stringify(script, null, 2)
}

/**
 * Serialize a command script library to JSON string
 */
export function serializeCommandLibrary(
  scripts: CommandScript[],
  metadata?: { name?: string; description?: string; author?: string; version?: string }
): string {
  const library = {
    id: `library-${Date.now()}`,
    name: metadata?.name || 'Custom Command Library',
    description: metadata?.description,
    scripts,
    metadata: {
      author: metadata?.author,
      version: metadata?.version || '1.0.0',
      createdAt: new Date().toISOString(),
      exportedFrom: 'HyperCard Renaissance',
    },
  }
  return JSON.stringify(library, null, 2)
}
