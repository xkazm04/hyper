// Story Serializer - Converts story data to compact binary format
// This module prepares story data for WASM compilation

import type { StoryStack, StoryCard, Choice, Character } from '@/lib/types'
import type {
  CompiledStoryBundle,
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
  StoryBundleMetadata,
  CompileOptions,
} from './types'
import { generateChecksum, estimatePlaytime } from './utils'

const DEFAULT_COMPILE_OPTIONS: CompileOptions = {
  embedAssets: true,
  compressAssets: true,
  maxAssetSize: 5 * 1024 * 1024, // 5MB per asset
  maxBundleSize: 50 * 1024 * 1024, // 50MB total
  includeDebugInfo: false,
  optimizeForSize: true,
  targetFormat: 'wasm',
}

/**
 * Serializes a complete story into a compiled bundle
 */
export async function serializeStory(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  options: Partial<CompileOptions> = {}
): Promise<CompiledStoryBundle> {
  const opts = { ...DEFAULT_COMPILE_OPTIONS, ...options }

  // Build navigation graph
  const navigation = buildNavigationGraph(stack, cards, choices)

  // Collect and process assets
  const assets = await collectAssets(cards, characters, opts)

  // Serialize data
  const serializedData = serializeStoryData(stack, cards, choices, characters, navigation)

  // Build metadata
  const metadata = buildMetadata(stack, cards, choices, characters, assets, navigation)

  // Generate checksum
  const bundleData = JSON.stringify({ metadata, data: serializedData, assets })
  const checksum = await generateChecksum(bundleData)

  return {
    version: '1.0.0',
    compiledAt: new Date().toISOString(),
    checksum,
    metadata,
    data: serializedData,
    assets,
  }
}

/**
 * Builds pre-computed navigation graph for fast runtime traversal
 */
export function buildNavigationGraph(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[]
): NavigationGraph {
  const nodes: Record<string, NavigationNode> = {}
  const edges: NavigationEdge[] = []
  const cardIds = new Set(cards.map((c) => c.id))

  // Initialize all nodes
  for (const card of cards) {
    nodes[card.id] = {
      cardId: card.id,
      outEdges: [],
      inEdges: [],
      isDeadEnd: true,
      isOrphan: true,
      depth: -1,
    }
  }

  // Build edges from choices
  for (const choice of choices) {
    if (!cardIds.has(choice.storyCardId) || !cardIds.has(choice.targetCardId)) {
      continue // Skip invalid choices
    }

    const edgeId = `${choice.storyCardId}->${choice.targetCardId}`
    edges.push({
      id: edgeId,
      sourceCardId: choice.storyCardId,
      targetCardId: choice.targetCardId,
      choiceId: choice.id,
      label: choice.label,
    })

    // Update node connections
    nodes[choice.storyCardId].outEdges.push(edgeId)
    nodes[choice.storyCardId].isDeadEnd = false
    nodes[choice.targetCardId].inEdges.push(edgeId)
  }

  // Calculate depths using BFS from entry node
  const entryId = stack.firstCardId || cards[0]?.id || null
  if (entryId && nodes[entryId]) {
    nodes[entryId].isOrphan = false
    nodes[entryId].depth = 0

    const queue: string[] = [entryId]
    const visited = new Set<string>([entryId])

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const currentNode = nodes[currentId]

      for (const edgeId of currentNode.outEdges) {
        const edge = edges.find((e) => e.id === edgeId)
        if (edge && !visited.has(edge.targetCardId)) {
          visited.add(edge.targetCardId)
          nodes[edge.targetCardId].isOrphan = false
          nodes[edge.targetCardId].depth = currentNode.depth + 1
          queue.push(edge.targetCardId)
        }
      }
    }
  }

  // Identify dead ends and orphans
  const deadEnds = Object.values(nodes)
    .filter((n) => n.isDeadEnd)
    .map((n) => n.cardId)

  const orphans = Object.values(nodes)
    .filter((n) => n.isOrphan)
    .map((n) => n.cardId)

  return {
    nodes,
    edges,
    entryNodeId: entryId,
    deadEnds,
    orphans,
  }
}

/**
 * Collects all assets (images) from the story
 */
async function collectAssets(
  cards: StoryCard[],
  characters: Character[],
  options: CompileOptions
): Promise<AssetManifest> {
  const images: AssetEntry[] = []
  let totalSize = 0

  // Collect card images
  for (const card of cards) {
    if (card.imageUrl) {
      const entry = await createAssetEntry(card.imageUrl, `card-${card.id}`, options)
      if (entry) {
        images.push(entry)
        totalSize += entry.size
      }
    }
  }

  // Collect character images
  for (const character of characters) {
    for (let i = 0; i < character.imageUrls.length; i++) {
      const url = character.imageUrls[i]
      if (url) {
        const entry = await createAssetEntry(url, `char-${character.id}-${i}`, options)
        if (entry) {
          images.push(entry)
          totalSize += entry.size
        }
      }
    }

    // Collect avatar
    if (character.avatarUrl) {
      const entry = await createAssetEntry(
        character.avatarUrl,
        `char-avatar-${character.id}`,
        options
      )
      if (entry) {
        images.push(entry)
        totalSize += entry.size
      }
    }
  }

  return {
    images,
    totalSize,
    compression: options.compressAssets ? 'gzip' : 'none',
  }
}

/**
 * Creates an asset entry, optionally embedding the data
 */
async function createAssetEntry(
  url: string,
  id: string,
  options: CompileOptions
): Promise<AssetEntry | null> {
  try {
    // For now, we'll store the URL reference
    // In production, you'd fetch and embed the actual image data
    const entry: AssetEntry = {
      id,
      url,
      dataUri: null,
      mimeType: getMimeType(url),
      size: 0, // Would be populated when fetching
      width: null,
      height: null,
      isEmbedded: false,
    }

    if (options.embedAssets) {
      // In a real implementation, fetch and base64 encode the image
      // const response = await fetch(url)
      // const blob = await response.blob()
      // entry.dataUri = await blobToDataUri(blob)
      // entry.size = blob.size
      // entry.isEmbedded = true
    }

    return entry
  } catch {
    console.warn(`Failed to process asset: ${url}`)
    return null
  }
}

/**
 * Gets MIME type from URL
 */
function getMimeType(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

/**
 * Serializes all story data into compact format
 */
function serializeStoryData(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  navigation: NavigationGraph
): SerializedStoryData {
  const serializedStack: SerializedStack = {
    id: stack.id,
    name: stack.name,
    description: stack.description,
    firstCardId: stack.firstCardId,
    artStyleId: stack.artStyleId,
    customArtStylePrompt: stack.customArtStylePrompt,
    previewTheme: stack.previewTheme,
  }

  const serializedCards: SerializedCard[] = cards.map((card) => ({
    id: card.id,
    title: card.title,
    content: card.content,
    script: card.script,
    imageRef: card.imageUrl ? `card-${card.id}` : null,
    message: card.message,
    speaker: card.speaker,
    speakerType: card.speakerType,
    orderIndex: card.orderIndex,
  }))

  const serializedChoices: SerializedChoice[] = choices.map((choice) => ({
    id: choice.id,
    cardId: choice.storyCardId,
    label: choice.label,
    targetId: choice.targetCardId,
    orderIndex: choice.orderIndex,
  }))

  const serializedCharacters: SerializedCharacter[] = characters.map((char) => ({
    id: char.id,
    name: char.name,
    appearance: char.appearance,
    imageRefs: char.imageUrls.map((_, i) => `char-${char.id}-${i}`),
    avatarRef: char.avatarUrl ? `char-avatar-${char.id}` : null,
    orderIndex: char.orderIndex,
  }))

  return {
    stack: serializedStack,
    cards: serializedCards,
    choices: serializedChoices,
    characters: serializedCharacters,
    navigation,
  }
}

/**
 * Builds metadata for the bundle
 */
function buildMetadata(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  assets: AssetManifest,
  navigation: NavigationGraph
): StoryBundleMetadata {
  return {
    id: stack.id,
    name: stack.name,
    description: stack.description,
    author: null, // Would be populated from user profile
    slug: stack.slug,
    theme: stack.previewTheme,
    artStyleId: stack.artStyleId,
    entryCardId: navigation.entryNodeId,
    cardCount: cards.length,
    choiceCount: choices.length,
    characterCount: characters.length,
    totalAssetSize: assets.totalSize,
    estimatedPlaytime: estimatePlaytime(cards, choices, navigation),
  }
}

/**
 * Converts a compiled bundle to a downloadable binary
 */
export function bundleToBytes(bundle: CompiledStoryBundle): Uint8Array {
  const json = JSON.stringify(bundle)
  const encoder = new TextEncoder()
  return encoder.encode(json)
}

/**
 * Parses bytes back into a compiled bundle
 */
export function bytesToBundle(bytes: Uint8Array): CompiledStoryBundle {
  const decoder = new TextDecoder()
  const json = decoder.decode(bytes)
  return JSON.parse(json)
}

/**
 * Validates a compiled bundle
 */
export function validateBundle(bundle: CompiledStoryBundle): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!bundle.version) {
    errors.push('Missing bundle version')
  }

  if (!bundle.data.stack) {
    errors.push('Missing stack data')
  }

  if (bundle.data.cards.length === 0) {
    errors.push('Bundle contains no cards')
  }

  if (!bundle.data.navigation.entryNodeId) {
    errors.push('No entry point defined')
  }

  return { valid: errors.length === 0, errors }
}
