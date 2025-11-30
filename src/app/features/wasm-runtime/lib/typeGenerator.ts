// TypeScript Definition Generator for Story Bundles
// Generates .d.ts files from compiled bundle metadata for compile-time type safety

import type {
  CompiledStoryBundle,
  SerializedCard,
  SerializedChoice,
  SerializedCharacter,
  NavigationGraph,
  StoryBundleMetadata,
} from './types'

/**
 * Options for generating TypeScript definitions
 */
export interface TypeGeneratorOptions {
  /** Include JSDoc comments in output */
  includeComments?: boolean
  /** Generate strict literal types for card IDs */
  strictCardIds?: boolean
  /** Generate strict literal types for choice IDs */
  strictChoiceIds?: boolean
  /** Generate strict literal types for character IDs */
  strictCharacterIds?: boolean
  /** Generate variable type definitions from runtime usage */
  inferVariableTypes?: boolean
  /** Generate flag type definitions */
  inferFlagTypes?: boolean
  /** Output file name (without extension) */
  outputName?: string
}

const DEFAULT_OPTIONS: TypeGeneratorOptions = {
  includeComments: true,
  strictCardIds: true,
  strictChoiceIds: true,
  strictCharacterIds: true,
  inferVariableTypes: true,
  inferFlagTypes: true,
  outputName: 'bundle.generated',
}

/**
 * Result of type generation
 */
export interface TypeGenerationResult {
  /** The generated TypeScript definition content */
  content: string
  /** The suggested output filename */
  filename: string
  /** Metadata about the generation */
  stats: TypeGenerationStats
}

export interface TypeGenerationStats {
  cardIdCount: number
  choiceIdCount: number
  characterIdCount: number
  variableCount: number
  flagCount: number
  generatedAt: string
}

/**
 * Generates TypeScript definitions from a compiled story bundle
 */
export function generateBundleTypes(
  bundle: CompiledStoryBundle,
  options: Partial<TypeGeneratorOptions> = {}
): TypeGenerationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const lines: string[] = []
  const stats: TypeGenerationStats = {
    cardIdCount: 0,
    choiceIdCount: 0,
    characterIdCount: 0,
    variableCount: 0,
    flagCount: 0,
    generatedAt: new Date().toISOString(),
  }

  // Header
  lines.push('// Auto-generated TypeScript definitions for story bundle')
  lines.push(`// Generated from: ${bundle.metadata.name}`)
  lines.push(`// Generated at: ${stats.generatedAt}`)
  lines.push(`// Bundle version: ${bundle.version}`)
  lines.push(`// Checksum: ${bundle.checksum}`)
  lines.push('')
  lines.push('/* eslint-disable @typescript-eslint/no-empty-object-type */')
  lines.push('')

  // Generate Card ID types
  const cardIds = generateCardIdTypes(bundle.data.cards, opts)
  stats.cardIdCount = bundle.data.cards.length
  lines.push(...cardIds)

  // Generate Choice ID types
  const choiceIds = generateChoiceIdTypes(bundle.data.choices, opts)
  stats.choiceIdCount = bundle.data.choices.length
  lines.push(...choiceIds)

  // Generate Character ID types
  const characterIds = generateCharacterIdTypes(bundle.data.characters, opts)
  stats.characterIdCount = bundle.data.characters.length
  lines.push(...characterIds)

  // Generate Variable types from scripts
  const variableTypes = generateVariableTypes(bundle, opts)
  stats.variableCount = variableTypes.variableCount
  lines.push(...variableTypes.lines)

  // Generate Flag types from scripts
  const flagTypes = generateFlagTypes(bundle, opts)
  stats.flagCount = flagTypes.flagCount
  lines.push(...flagTypes.lines)

  // Generate Navigation Graph types
  const navTypes = generateNavigationTypes(bundle.data.navigation, opts)
  lines.push(...navTypes)

  // Generate Metadata type
  const metaTypes = generateMetadataType(bundle.metadata, opts)
  lines.push(...metaTypes)

  // Generate typed bundle interface
  const bundleInterface = generateTypedBundleInterface(bundle, opts)
  lines.push(...bundleInterface)

  // Generate typed runtime interface
  const runtimeInterface = generateTypedRuntimeInterface(opts)
  lines.push(...runtimeInterface)

  return {
    content: lines.join('\n'),
    filename: `${opts.outputName}.d.ts`,
    stats,
  }
}

/**
 * Generates card ID union types
 */
function generateCardIdTypes(cards: SerializedCard[], opts: TypeGeneratorOptions): string[] {
  const lines: string[] = []

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Union type of all valid card IDs in this bundle')
    lines.push(' */')
  }

  if (opts.strictCardIds && cards.length > 0) {
    const cardIdUnion = cards.map((c) => `  | '${escapeStringLiteral(c.id)}'`).join('\n')
    lines.push(`export type CardId =\n${cardIdUnion}`)
  } else {
    lines.push('export type CardId = string')
  }
  lines.push('')

  // Generate card title map
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Map of card IDs to their titles for reference')
    lines.push(' */')
  }
  lines.push('export interface CardTitleMap {')
  for (const card of cards) {
    const escapedId = escapeStringLiteral(card.id)
    const escapedTitle = escapeStringLiteral(card.title)
    lines.push(`  readonly '${escapedId}': '${escapedTitle}'`)
  }
  lines.push('}')
  lines.push('')

  return lines
}

/**
 * Generates choice ID union types
 */
function generateChoiceIdTypes(choices: SerializedChoice[], opts: TypeGeneratorOptions): string[] {
  const lines: string[] = []

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Union type of all valid choice IDs in this bundle')
    lines.push(' */')
  }

  if (opts.strictChoiceIds && choices.length > 0) {
    const choiceIdUnion = choices.map((c) => `  | '${escapeStringLiteral(c.id)}'`).join('\n')
    lines.push(`export type ChoiceId =\n${choiceIdUnion}`)
  } else {
    lines.push('export type ChoiceId = string')
  }
  lines.push('')

  // Generate choice-to-card map
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Map of choice IDs to their source card IDs')
    lines.push(' */')
  }
  lines.push('export interface ChoiceSourceMap {')
  for (const choice of choices) {
    const escapedId = escapeStringLiteral(choice.id)
    const escapedCardId = escapeStringLiteral(choice.cardId)
    lines.push(`  readonly '${escapedId}': '${escapedCardId}'`)
  }
  lines.push('}')
  lines.push('')

  // Generate choice target map
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Map of choice IDs to their target card IDs')
    lines.push(' */')
  }
  lines.push('export interface ChoiceTargetMap {')
  for (const choice of choices) {
    const escapedId = escapeStringLiteral(choice.id)
    const escapedTargetId = escapeStringLiteral(choice.targetId)
    lines.push(`  readonly '${escapedId}': '${escapedTargetId}'`)
  }
  lines.push('}')
  lines.push('')

  return lines
}

/**
 * Generates character ID union types
 */
function generateCharacterIdTypes(
  characters: SerializedCharacter[],
  opts: TypeGeneratorOptions
): string[] {
  const lines: string[] = []

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Union type of all valid character IDs in this bundle')
    lines.push(' */')
  }

  if (opts.strictCharacterIds && characters.length > 0) {
    const charIdUnion = characters.map((c) => `  | '${escapeStringLiteral(c.id)}'`).join('\n')
    lines.push(`export type CharacterId =\n${charIdUnion}`)
  } else {
    lines.push('export type CharacterId = string')
  }
  lines.push('')

  // Generate character name map
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Map of character IDs to their names')
    lines.push(' */')
  }
  lines.push('export interface CharacterNameMap {')
  for (const char of characters) {
    const escapedId = escapeStringLiteral(char.id)
    const escapedName = escapeStringLiteral(char.name)
    lines.push(`  readonly '${escapedId}': '${escapedName}'`)
  }
  lines.push('}')
  lines.push('')

  return lines
}

/**
 * Extracts and generates variable types from card scripts
 */
function generateVariableTypes(
  bundle: CompiledStoryBundle,
  opts: TypeGeneratorOptions
): { lines: string[]; variableCount: number } {
  const lines: string[] = []
  const variableUsages = new Map<string, Set<string>>() // name -> inferred types

  if (!opts.inferVariableTypes) {
    lines.push('export type StoryVariables = Record<string, unknown>')
    lines.push('')
    return { lines, variableCount: 0 }
  }

  // Parse scripts for variable usage patterns
  for (const card of bundle.data.cards) {
    if (!card.script) continue

    // Match setVariable calls: runtime.setVariable('name', value)
    const setVarRegex = /runtime\.setVariable\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g
    let match
    while ((match = setVarRegex.exec(card.script)) !== null) {
      const varName = match[1]
      const valueExpr = match[2].trim()
      const inferredType = inferTypeFromExpression(valueExpr)
      if (!variableUsages.has(varName)) {
        variableUsages.set(varName, new Set())
      }
      variableUsages.get(varName)!.add(inferredType)
    }

    // Match getVariable calls: runtime.getVariable('name')
    const getVarRegex = /runtime\.getVariable\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    while ((match = getVarRegex.exec(card.script)) !== null) {
      const varName = match[1]
      if (!variableUsages.has(varName)) {
        variableUsages.set(varName, new Set(['unknown']))
      }
    }
  }

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Typed story variables inferred from script usage')
    lines.push(' */')
  }

  if (variableUsages.size > 0) {
    lines.push('export interface StoryVariables {')
    const entries = Array.from(variableUsages.entries())
    for (const entry of entries) {
      const name = entry[0]
      const types = entry[1]
      const typeUnion = Array.from(types).join(' | ')
      lines.push(`  '${escapeStringLiteral(name)}'?: ${typeUnion}`)
    }
    lines.push('}')
  } else {
    lines.push('export interface StoryVariables {}')
  }
  lines.push('')

  // Generate variable name union type
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Union of all known variable names')
    lines.push(' */')
  }
  if (variableUsages.size > 0) {
    const varNames = Array.from(variableUsages.keys())
    const varNameUnion = varNames
      .map((n) => `  | '${escapeStringLiteral(n)}'`)
      .join('\n')
    lines.push(`export type VariableName =\n${varNameUnion}`)
  } else {
    lines.push('export type VariableName = never')
  }
  lines.push('')

  return { lines, variableCount: variableUsages.size }
}

/**
 * Extracts and generates flag types from card scripts
 */
function generateFlagTypes(
  bundle: CompiledStoryBundle,
  opts: TypeGeneratorOptions
): { lines: string[]; flagCount: number } {
  const lines: string[] = []
  const flags = new Set<string>()

  if (!opts.inferFlagTypes) {
    lines.push('export type StoryFlag = string')
    lines.push('')
    return { lines, flagCount: 0 }
  }

  // Parse scripts for flag usage patterns
  for (const card of bundle.data.cards) {
    if (!card.script) continue

    // Match hasFlag, setFlag, clearFlag calls
    const flagRegex = /runtime\.(hasFlag|setFlag|clearFlag)\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    let match
    while ((match = flagRegex.exec(card.script)) !== null) {
      flags.add(match[2])
    }
  }

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Union of all known story flags inferred from script usage')
    lines.push(' */')
  }

  if (flags.size > 0) {
    const flagUnion = Array.from(flags)
      .map((f) => `  | '${escapeStringLiteral(f)}'`)
      .join('\n')
    lines.push(`export type StoryFlag =\n${flagUnion}`)
  } else {
    lines.push('export type StoryFlag = never')
  }
  lines.push('')

  return { lines, flagCount: flags.size }
}

/**
 * Generates navigation graph types
 */
function generateNavigationTypes(nav: NavigationGraph, opts: TypeGeneratorOptions): string[] {
  const lines: string[] = []

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Pre-computed navigation graph structure')
    lines.push(' */')
  }

  lines.push('export interface TypedNavigationGraph {')
  lines.push(`  readonly entryNodeId: ${nav.entryNodeId ? `'${escapeStringLiteral(nav.entryNodeId)}'` : 'null'}`)

  // Dead ends
  if (nav.deadEnds.length > 0) {
    const deadEndUnion = nav.deadEnds.map((d) => `'${escapeStringLiteral(d)}'`).join(' | ')
    lines.push(`  readonly deadEnds: ReadonlyArray<${deadEndUnion}>`)
  } else {
    lines.push('  readonly deadEnds: readonly []')
  }

  // Orphans
  if (nav.orphans.length > 0) {
    const orphanUnion = nav.orphans.map((o) => `'${escapeStringLiteral(o)}'`).join(' | ')
    lines.push(`  readonly orphans: ReadonlyArray<${orphanUnion}>`)
  } else {
    lines.push('  readonly orphans: readonly []')
  }

  lines.push('}')
  lines.push('')

  // Generate adjacency map type
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Map of card IDs to their outgoing choice targets')
    lines.push(' */')
  }
  lines.push('export interface NavigationAdjacencyMap {')
  const nodeEntries = Object.entries(nav.nodes)
  for (const entry of nodeEntries) {
    const cardId = entry[0]
    const targets = nav.edges
      .filter((e) => e.sourceCardId === cardId)
      .map((e) => `'${escapeStringLiteral(e.targetCardId)}'`)

    if (targets.length > 0) {
      lines.push(`  readonly '${escapeStringLiteral(cardId)}': readonly [${targets.join(', ')}]`)
    } else {
      lines.push(`  readonly '${escapeStringLiteral(cardId)}': readonly []`)
    }
  }
  lines.push('}')
  lines.push('')

  return lines
}

/**
 * Generates metadata type with actual values
 */
function generateMetadataType(metadata: StoryBundleMetadata, opts: TypeGeneratorOptions): string[] {
  const lines: string[] = []

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Compile-time bundle metadata')
    lines.push(' */')
  }

  lines.push('export interface TypedBundleMetadata {')
  lines.push(`  readonly id: '${escapeStringLiteral(metadata.id)}'`)
  lines.push(`  readonly name: '${escapeStringLiteral(metadata.name)}'`)
  lines.push(`  readonly description: ${metadata.description ? `'${escapeStringLiteral(metadata.description)}'` : 'null'}`)
  lines.push(`  readonly author: ${metadata.author ? `'${escapeStringLiteral(metadata.author)}'` : 'null'}`)
  lines.push(`  readonly slug: ${metadata.slug ? `'${escapeStringLiteral(metadata.slug)}'` : 'null'}`)
  lines.push(`  readonly theme: ${metadata.theme ? `'${metadata.theme}'` : 'null'}`)
  lines.push(`  readonly entryCardId: ${metadata.entryCardId ? `'${escapeStringLiteral(metadata.entryCardId)}'` : 'null'}`)
  lines.push(`  readonly cardCount: ${metadata.cardCount}`)
  lines.push(`  readonly choiceCount: ${metadata.choiceCount}`)
  lines.push(`  readonly characterCount: ${metadata.characterCount}`)
  lines.push('}')
  lines.push('')

  return lines
}

/**
 * Generates the main typed bundle interface
 */
function generateTypedBundleInterface(
  bundle: CompiledStoryBundle,
  opts: TypeGeneratorOptions
): string[] {
  const lines: string[] = []

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Fully-typed story bundle interface')
    lines.push(' * Use this type for compile-time safety when accessing bundle data')
    lines.push(' */')
  }

  lines.push('export interface TypedStoryBundle {')
  lines.push(`  readonly version: '${bundle.version}'`)
  lines.push(`  readonly checksum: '${bundle.checksum}'`)
  lines.push('  readonly metadata: TypedBundleMetadata')
  lines.push('  readonly data: {')
  lines.push('    readonly cards: ReadonlyArray<TypedCard>')
  lines.push('    readonly choices: ReadonlyArray<TypedChoice>')
  lines.push('    readonly characters: ReadonlyArray<TypedCharacter>')
  lines.push('    readonly navigation: TypedNavigationGraph')
  lines.push('  }')
  lines.push('}')
  lines.push('')

  // Card type
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Typed card with strict ID')
    lines.push(' */')
  }
  lines.push('export interface TypedCard {')
  lines.push('  readonly id: CardId')
  lines.push('  readonly title: string')
  lines.push('  readonly content: string')
  lines.push('  readonly script: string')
  lines.push('  readonly imageRef: string | null')
  lines.push('  readonly message: string | null')
  lines.push('  readonly speaker: string | null')
  lines.push("  readonly speakerType: 'character' | 'narrator' | 'system' | null")
  lines.push('  readonly orderIndex: number')
  lines.push('}')
  lines.push('')

  // Choice type
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Typed choice with strict IDs')
    lines.push(' */')
  }
  lines.push('export interface TypedChoice {')
  lines.push('  readonly id: ChoiceId')
  lines.push('  readonly cardId: CardId')
  lines.push('  readonly label: string')
  lines.push('  readonly targetId: CardId')
  lines.push('  readonly orderIndex: number')
  lines.push('}')
  lines.push('')

  // Character type
  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Typed character with strict ID')
    lines.push(' */')
  }
  lines.push('export interface TypedCharacter {')
  lines.push('  readonly id: CharacterId')
  lines.push('  readonly name: string')
  lines.push('  readonly appearance: string')
  lines.push('  readonly imageRefs: readonly string[]')
  lines.push('  readonly avatarRef: string | null')
  lines.push('  readonly orderIndex: number')
  lines.push('}')
  lines.push('')

  return lines
}

/**
 * Generates typed runtime interface for script usage
 */
function generateTypedRuntimeInterface(opts: TypeGeneratorOptions): string[] {
  const lines: string[] = []

  if (opts.includeComments) {
    lines.push('/**')
    lines.push(' * Typed runtime API for use in card scripts')
    lines.push(' * Provides compile-time safety for variable and flag operations')
    lines.push(' */')
  }

  lines.push('export interface TypedRuntime {')
  lines.push('  /** Get a typed variable value */')
  lines.push('  getVariable<K extends VariableName>(key: K): StoryVariables[K]')
  lines.push('  /** Set a typed variable value */')
  lines.push('  setVariable<K extends VariableName>(key: K, value: StoryVariables[K]): void')
  lines.push('  /** Check if a flag is set */')
  lines.push('  hasFlag(flag: StoryFlag): boolean')
  lines.push('  /** Set a flag */')
  lines.push('  setFlag(flag: StoryFlag): void')
  lines.push('  /** Clear a flag */')
  lines.push('  clearFlag(flag: StoryFlag): void')
  lines.push('  /** Check if a card has been visited */')
  lines.push('  hasVisited(cardId: CardId): boolean')
  lines.push('  /** Get total visited card count */')
  lines.push('  getVisitCount(): number')
  lines.push('  /** Get current card ID */')
  lines.push('  getCurrentCardId(): CardId | null')
  lines.push('  /** Get total play time in milliseconds */')
  lines.push('  getPlayTime(): number')
  lines.push('}')
  lines.push('')

  return lines
}

/**
 * Infers TypeScript type from a JavaScript expression
 */
function inferTypeFromExpression(expr: string): string {
  const trimmed = expr.trim()

  // String literals
  if (/^['"]/.test(trimmed)) {
    return 'string'
  }

  // Number literals
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return 'number'
  }

  // Boolean literals
  if (trimmed === 'true' || trimmed === 'false') {
    return 'boolean'
  }

  // Array literals
  if (trimmed.startsWith('[')) {
    return 'unknown[]'
  }

  // Object literals
  if (trimmed.startsWith('{')) {
    return 'Record<string, unknown>'
  }

  // null/undefined
  if (trimmed === 'null') {
    return 'null'
  }
  if (trimmed === 'undefined') {
    return 'undefined'
  }

  // Arithmetic operations likely result in number
  if (/[+\-*/]/.test(trimmed) && !/['"]/.test(trimmed)) {
    return 'number'
  }

  return 'unknown'
}

/**
 * Escapes string literals for TypeScript output
 */
function escapeStringLiteral(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
}

/**
 * Creates a downloadable .d.ts file from a bundle
 */
export function createTypesBlob(result: TypeGenerationResult): Blob {
  return new Blob([result.content], { type: 'text/typescript' })
}

/**
 * Gets the suggested types filename for a bundle
 */
export function getTypesFilename(bundle: CompiledStoryBundle): string {
  const safeName = bundle.metadata.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return `${safeName}.bundle.d.ts`
}
