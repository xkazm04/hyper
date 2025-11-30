#!/usr/bin/env node
/**
 * Build script for generating TypeScript definitions from story bundles
 *
 * This script scans compiled bundle files and generates corresponding .d.ts files
 * that describe the exact shape of each bundle for compile-time type safety.
 *
 * Usage:
 *   npx tsx scripts/generate-bundle-types.ts [options]
 *
 * Options:
 *   --input <path>    Input bundle file or directory (default: ./bundles)
 *   --output <path>   Output directory for .d.ts files (default: ./src/types/bundles)
 *   --watch           Watch for bundle changes and regenerate
 *   --verbose         Show detailed output
 */

import * as fs from 'fs'
import * as path from 'path'

// Type definitions (matching the main lib types)
interface StoryBundleMetadata {
  id: string
  name: string
  description: string | null
  author: string | null
  slug: string | null
  theme: string | null
  artStyleId: string | null
  entryCardId: string | null
  cardCount: number
  choiceCount: number
  characterCount: number
  totalAssetSize: number
  estimatedPlaytime: number | null
}

interface SerializedCard {
  id: string
  title: string
  content: string
  script: string
  imageRef: string | null
  message: string | null
  speaker: string | null
  speakerType: 'character' | 'narrator' | 'system' | null
  orderIndex: number
}

interface SerializedChoice {
  id: string
  cardId: string
  label: string
  targetId: string
  orderIndex: number
}

interface SerializedCharacter {
  id: string
  name: string
  appearance: string
  imageRefs: string[]
  avatarRef: string | null
  orderIndex: number
}

interface NavigationEdge {
  id: string
  sourceCardId: string
  targetCardId: string
  choiceId: string
  label: string
}

interface NavigationNode {
  cardId: string
  outEdges: string[]
  inEdges: string[]
  isDeadEnd: boolean
  isOrphan: boolean
  depth: number
}

interface NavigationGraph {
  nodes: Record<string, NavigationNode>
  edges: NavigationEdge[]
  entryNodeId: string | null
  deadEnds: string[]
  orphans: string[]
}

interface SerializedStoryData {
  stack: {
    id: string
    name: string
    description: string | null
    firstCardId: string | null
    artStyleId: string | null
    customArtStylePrompt: string | null
    previewTheme: string | null
  }
  cards: SerializedCard[]
  choices: SerializedChoice[]
  characters: SerializedCharacter[]
  navigation: NavigationGraph
}

interface AssetEntry {
  id: string
  url: string
  dataUri: string | null
  mimeType: string
  size: number
  width: number | null
  height: number | null
  isEmbedded: boolean
}

interface AssetManifest {
  images: AssetEntry[]
  totalSize: number
  compression: 'none' | 'gzip' | 'br'
}

interface CompiledStoryBundle {
  version: string
  compiledAt: string
  checksum: string
  metadata: StoryBundleMetadata
  data: SerializedStoryData
  assets: AssetManifest
}

interface TypeGeneratorOptions {
  includeComments: boolean
  strictCardIds: boolean
  strictChoiceIds: boolean
  strictCharacterIds: boolean
  inferVariableTypes: boolean
  inferFlagTypes: boolean
}

interface GenerationStats {
  cardIdCount: number
  choiceIdCount: number
  characterIdCount: number
  variableCount: number
  flagCount: number
  generatedAt: string
}

// CLI arguments
const args = process.argv.slice(2)
const inputPath = getArg('--input') || './bundles'
const outputPath = getArg('--output') || './src/types/bundles'
const watchMode = args.includes('--watch')
const verbose = args.includes('--verbose')

function getArg(flag: string): string | undefined {
  const index = args.indexOf(flag)
  if (index !== -1 && args[index + 1]) {
    return args[index + 1]
  }
  return undefined
}

function log(message: string): void {
  if (verbose) {
    console.log(`[bundle-types] ${message}`)
  }
}

function escapeStringLiteral(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

function inferTypeFromExpression(expr: string): string {
  const trimmed = expr.trim()

  if (/^['"]/.test(trimmed)) return 'string'
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return 'number'
  if (trimmed === 'true' || trimmed === 'false') return 'boolean'
  if (trimmed.startsWith('[')) return 'unknown[]'
  if (trimmed.startsWith('{')) return 'Record<string, unknown>'
  if (trimmed === 'null') return 'null'
  if (trimmed === 'undefined') return 'undefined'
  if (/[+\-*/]/.test(trimmed) && !/['"]/.test(trimmed)) return 'number'

  return 'unknown'
}

function generateBundleTypes(
  bundle: CompiledStoryBundle,
  options: TypeGeneratorOptions
): { content: string; stats: GenerationStats } {
  const lines: string[] = []
  const stats: GenerationStats = {
    cardIdCount: bundle.data.cards.length,
    choiceIdCount: bundle.data.choices.length,
    characterIdCount: bundle.data.characters.length,
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

  // Card ID types
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Union type of all valid card IDs in this bundle')
    lines.push(' */')
  }
  if (options.strictCardIds && bundle.data.cards.length > 0) {
    const cardIdUnion = bundle.data.cards
      .map((c) => `  | '${escapeStringLiteral(c.id)}'`)
      .join('\n')
    lines.push(`export type CardId =\n${cardIdUnion}`)
  } else {
    lines.push('export type CardId = string')
  }
  lines.push('')

  // Card title map
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Map of card IDs to their titles for reference')
    lines.push(' */')
  }
  lines.push('export interface CardTitleMap {')
  for (const card of bundle.data.cards) {
    lines.push(
      `  readonly '${escapeStringLiteral(card.id)}': '${escapeStringLiteral(card.title)}'`
    )
  }
  lines.push('}')
  lines.push('')

  // Choice ID types
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Union type of all valid choice IDs in this bundle')
    lines.push(' */')
  }
  if (options.strictChoiceIds && bundle.data.choices.length > 0) {
    const choiceIdUnion = bundle.data.choices
      .map((c) => `  | '${escapeStringLiteral(c.id)}'`)
      .join('\n')
    lines.push(`export type ChoiceId =\n${choiceIdUnion}`)
  } else {
    lines.push('export type ChoiceId = string')
  }
  lines.push('')

  // Choice maps
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Map of choice IDs to their source card IDs')
    lines.push(' */')
  }
  lines.push('export interface ChoiceSourceMap {')
  for (const choice of bundle.data.choices) {
    lines.push(
      `  readonly '${escapeStringLiteral(choice.id)}': '${escapeStringLiteral(choice.cardId)}'`
    )
  }
  lines.push('}')
  lines.push('')

  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Map of choice IDs to their target card IDs')
    lines.push(' */')
  }
  lines.push('export interface ChoiceTargetMap {')
  for (const choice of bundle.data.choices) {
    lines.push(
      `  readonly '${escapeStringLiteral(choice.id)}': '${escapeStringLiteral(choice.targetId)}'`
    )
  }
  lines.push('}')
  lines.push('')

  // Character ID types
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Union type of all valid character IDs in this bundle')
    lines.push(' */')
  }
  if (options.strictCharacterIds && bundle.data.characters.length > 0) {
    const charIdUnion = bundle.data.characters
      .map((c) => `  | '${escapeStringLiteral(c.id)}'`)
      .join('\n')
    lines.push(`export type CharacterId =\n${charIdUnion}`)
  } else {
    lines.push('export type CharacterId = string')
  }
  lines.push('')

  // Character name map
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Map of character IDs to their names')
    lines.push(' */')
  }
  lines.push('export interface CharacterNameMap {')
  for (const char of bundle.data.characters) {
    lines.push(
      `  readonly '${escapeStringLiteral(char.id)}': '${escapeStringLiteral(char.name)}'`
    )
  }
  lines.push('}')
  lines.push('')

  // Variable types from scripts
  const variableUsages = new Map<string, Set<string>>()
  if (options.inferVariableTypes) {
    for (const card of bundle.data.cards) {
      if (!card.script) continue

      const setVarRegex =
        /runtime\.setVariable\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g
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

      const getVarRegex = /runtime\.getVariable\s*\(\s*['"]([^'"]+)['"]\s*\)/g
      while ((match = getVarRegex.exec(card.script)) !== null) {
        const varName = match[1]
        if (!variableUsages.has(varName)) {
          variableUsages.set(varName, new Set(['unknown']))
        }
      }
    }
  }

  stats.variableCount = variableUsages.size

  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Typed story variables inferred from script usage')
    lines.push(' */')
  }
  if (variableUsages.size > 0) {
    lines.push('export interface StoryVariables {')
    for (const [name, types] of variableUsages) {
      const typeUnion = Array.from(types).join(' | ')
      lines.push(`  '${escapeStringLiteral(name)}'?: ${typeUnion}`)
    }
    lines.push('}')
  } else {
    lines.push('export interface StoryVariables {}')
  }
  lines.push('')

  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Union of all known variable names')
    lines.push(' */')
  }
  if (variableUsages.size > 0) {
    const varNameUnion = Array.from(variableUsages.keys())
      .map((n) => `  | '${escapeStringLiteral(n)}'`)
      .join('\n')
    lines.push(`export type VariableName =\n${varNameUnion}`)
  } else {
    lines.push('export type VariableName = never')
  }
  lines.push('')

  // Flag types from scripts
  const flags = new Set<string>()
  if (options.inferFlagTypes) {
    for (const card of bundle.data.cards) {
      if (!card.script) continue

      const flagRegex =
        /runtime\.(hasFlag|setFlag|clearFlag)\s*\(\s*['"]([^'"]+)['"]\s*\)/g
      let match
      while ((match = flagRegex.exec(card.script)) !== null) {
        flags.add(match[2])
      }
    }
  }

  stats.flagCount = flags.size

  if (options.includeComments) {
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

  // Navigation graph types
  const nav = bundle.data.navigation
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Pre-computed navigation graph structure')
    lines.push(' */')
  }
  lines.push('export interface TypedNavigationGraph {')
  lines.push(
    `  readonly entryNodeId: ${nav.entryNodeId ? `'${escapeStringLiteral(nav.entryNodeId)}'` : 'null'}`
  )
  if (nav.deadEnds.length > 0) {
    const deadEndUnion = nav.deadEnds
      .map((d) => `'${escapeStringLiteral(d)}'`)
      .join(' | ')
    lines.push(`  readonly deadEnds: ReadonlyArray<${deadEndUnion}>`)
  } else {
    lines.push('  readonly deadEnds: readonly []')
  }
  if (nav.orphans.length > 0) {
    const orphanUnion = nav.orphans
      .map((o) => `'${escapeStringLiteral(o)}'`)
      .join(' | ')
    lines.push(`  readonly orphans: ReadonlyArray<${orphanUnion}>`)
  } else {
    lines.push('  readonly orphans: readonly []')
  }
  lines.push('}')
  lines.push('')

  // Adjacency map
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Map of card IDs to their outgoing choice targets')
    lines.push(' */')
  }
  lines.push('export interface NavigationAdjacencyMap {')
  for (const [cardId] of Object.entries(nav.nodes)) {
    const targets = nav.edges
      .filter((e) => e.sourceCardId === cardId)
      .map((e) => `'${escapeStringLiteral(e.targetCardId)}'`)

    if (targets.length > 0) {
      lines.push(
        `  readonly '${escapeStringLiteral(cardId)}': readonly [${targets.join(', ')}]`
      )
    } else {
      lines.push(`  readonly '${escapeStringLiteral(cardId)}': readonly []`)
    }
  }
  lines.push('}')
  lines.push('')

  // Metadata type
  const metadata = bundle.metadata
  if (options.includeComments) {
    lines.push('/**')
    lines.push(' * Compile-time bundle metadata')
    lines.push(' */')
  }
  lines.push('export interface TypedBundleMetadata {')
  lines.push(`  readonly id: '${escapeStringLiteral(metadata.id)}'`)
  lines.push(`  readonly name: '${escapeStringLiteral(metadata.name)}'`)
  lines.push(
    `  readonly description: ${metadata.description ? `'${escapeStringLiteral(metadata.description)}'` : 'null'}`
  )
  lines.push(
    `  readonly author: ${metadata.author ? `'${escapeStringLiteral(metadata.author)}'` : 'null'}`
  )
  lines.push(
    `  readonly slug: ${metadata.slug ? `'${escapeStringLiteral(metadata.slug)}'` : 'null'}`
  )
  lines.push(`  readonly theme: ${metadata.theme ? `'${metadata.theme}'` : 'null'}`)
  lines.push(
    `  readonly entryCardId: ${metadata.entryCardId ? `'${escapeStringLiteral(metadata.entryCardId)}'` : 'null'}`
  )
  lines.push(`  readonly cardCount: ${metadata.cardCount}`)
  lines.push(`  readonly choiceCount: ${metadata.choiceCount}`)
  lines.push(`  readonly characterCount: ${metadata.characterCount}`)
  lines.push('}')
  lines.push('')

  // Typed bundle interface
  if (options.includeComments) {
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
  if (options.includeComments) {
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
  if (options.includeComments) {
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
  if (options.includeComments) {
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

  // Typed runtime interface
  if (options.includeComments) {
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

  return { content: lines.join('\n'), stats }
}

function processBundle(bundlePath: string, outputDir: string): void {
  const bundleContent = fs.readFileSync(bundlePath, 'utf-8')
  let bundle: CompiledStoryBundle

  try {
    bundle = JSON.parse(bundleContent)
  } catch (e) {
    console.error(`Failed to parse bundle: ${bundlePath}`)
    return
  }

  // Validate bundle structure
  if (!bundle.version || !bundle.metadata || !bundle.data) {
    console.error(`Invalid bundle structure: ${bundlePath}`)
    return
  }

  const options: TypeGeneratorOptions = {
    includeComments: true,
    strictCardIds: true,
    strictChoiceIds: true,
    strictCharacterIds: true,
    inferVariableTypes: true,
    inferFlagTypes: true,
  }

  const result = generateBundleTypes(bundle, options)

  // Create output filename from bundle name
  const safeName = bundle.metadata.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const outputFile = path.join(outputDir, `${safeName}.bundle.d.ts`)

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true })

  // Write the types file
  fs.writeFileSync(outputFile, result.content)

  console.log(`Generated: ${outputFile}`)
  log(`  Cards: ${result.stats.cardIdCount}`)
  log(`  Choices: ${result.stats.choiceIdCount}`)
  log(`  Characters: ${result.stats.characterIdCount}`)
  log(`  Variables: ${result.stats.variableCount}`)
  log(`  Flags: ${result.stats.flagCount}`)
}

function processDirectory(inputDir: string, outputDir: string): void {
  if (!fs.existsSync(inputDir)) {
    console.log(`Input directory does not exist: ${inputDir}`)
    console.log('No bundles to process.')
    return
  }

  const files = fs.readdirSync(inputDir)
  const bundleFiles = files.filter((f) => f.endsWith('.json'))

  if (bundleFiles.length === 0) {
    console.log(`No bundle files found in: ${inputDir}`)
    return
  }

  console.log(`Processing ${bundleFiles.length} bundle(s)...`)

  for (const file of bundleFiles) {
    const bundlePath = path.join(inputDir, file)
    processBundle(bundlePath, outputDir)
  }

  console.log('Done!')
}

function main(): void {
  console.log('Story Bundle Type Generator')
  console.log('===========================')
  console.log(`Input: ${inputPath}`)
  console.log(`Output: ${outputPath}`)
  console.log('')

  // Check if input is a file or directory
  if (fs.existsSync(inputPath)) {
    const stat = fs.statSync(inputPath)
    if (stat.isFile()) {
      processBundle(inputPath, outputPath)
    } else {
      processDirectory(inputPath, outputPath)
    }
  } else {
    console.log(`Creating input directory: ${inputPath}`)
    fs.mkdirSync(inputPath, { recursive: true })
    console.log('No bundles to process yet.')
  }

  if (watchMode) {
    console.log('\nWatching for changes...')
    fs.watch(inputPath, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.json')) {
        console.log(`\nChange detected: ${filename}`)
        const bundlePath = path.join(inputPath, filename)
        if (fs.existsSync(bundlePath)) {
          processBundle(bundlePath, outputPath)
        }
      }
    })
  }
}

main()
