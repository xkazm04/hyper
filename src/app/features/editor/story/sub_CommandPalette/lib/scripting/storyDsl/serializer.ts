/**
 * Story DSL Serializer
 *
 * Converts the story graph (cards + choices) into the text DSL format.
 * This enables version control, diffing, and collaborative editing.
 */

import type { StoryStack, StoryCard, Choice } from '@/lib/types'
import type { DslSerializeOptions, DslIdMapping } from './types'

const DEFAULT_OPTIONS: DslSerializeOptions = {
  includeMetadata: true,
  includeImagePrompts: false,
  includeDebugInfo: false,
  indentSize: 0,
}

/**
 * Generate a slug-like ID from a title and optional UUID
 */
function generateSlugId(title: string, uuid: string): string {
  // Create a short hash from UUID for uniqueness
  const shortHash = uuid.slice(0, 8)

  // Slugify the title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 30) || 'card'

  return `${slug}_${shortHash}`
}

/**
 * Build ID mapping from cards
 */
function buildIdMapping(cards: StoryCard[]): DslIdMapping {
  const dslToDb = new Map<string, string>()
  const dbToDsl = new Map<string, string>()

  for (const card of cards) {
    const dslId = generateSlugId(card.title, card.id)
    dslToDb.set(dslId, card.id)
    dbToDsl.set(card.id, dslId)
  }

  return { dslToDb, dbToDsl }
}

/**
 * Escape special characters in content for DSL
 */
function escapeContent(content: string): string {
  // Lines starting with # -> @  --- need to be escaped
  return content
    .split('\n')
    .map(line => {
      const trimmed = line.trimStart()
      if (
        trimmed.startsWith('#') ||
        trimmed.startsWith('->') ||
        trimmed.startsWith('@') ||
        trimmed === '---'
      ) {
        // Add a zero-width space to prevent parsing
        return line.replace(/^(\s*)/, '$1\u200B')
      }
      return line
    })
    .join('\n')
}

/**
 * Group choices by source card
 */
function groupChoicesByCard(choices: Choice[]): Map<string, Choice[]> {
  const grouped = new Map<string, Choice[]>()

  for (const choice of choices) {
    const existing = grouped.get(choice.storyCardId) || []
    existing.push(choice)
    grouped.set(choice.storyCardId, existing)
  }

  // Sort choices by orderIndex
  for (const [cardId, cardChoices] of grouped) {
    cardChoices.sort((a, b) => a.orderIndex - b.orderIndex)
  }

  return grouped
}

/**
 * Order cards for serialization
 * Start card first, then breadth-first traversal, then orphans
 */
function orderCards(
  cards: StoryCard[],
  choices: Choice[],
  firstCardId: string | null
): StoryCard[] {
  if (cards.length === 0) return []

  const choicesByCard = groupChoicesByCard(choices)
  const ordered: StoryCard[] = []
  const visited = new Set<string>()

  // BFS from start card
  const startId = firstCardId || cards[0]?.id
  const queue: string[] = startId ? [startId] : []

  while (queue.length > 0) {
    const cardId = queue.shift()!
    if (visited.has(cardId)) continue
    visited.add(cardId)

    const card = cards.find(c => c.id === cardId)
    if (card) {
      ordered.push(card)

      // Add targets of choices to queue
      const cardChoices = choicesByCard.get(cardId) || []
      for (const choice of cardChoices) {
        if (!visited.has(choice.targetCardId)) {
          queue.push(choice.targetCardId)
        }
      }
    }
  }

  // Add any orphaned cards at the end
  for (const card of cards) {
    if (!visited.has(card.id)) {
      ordered.push(card)
    }
  }

  return ordered
}

/**
 * Serialize a story stack to DSL text
 */
export function serializeStoryToDsl(
  storyStack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  options: Partial<DslSerializeOptions> = {}
): { text: string; idMapping: DslIdMapping } {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const lines: string[] = []

  // Build ID mapping
  const idMapping = buildIdMapping(cards)
  const choicesByCard = groupChoicesByCard(choices)

  // Metadata header
  if (opts.includeMetadata) {
    lines.push(`# Story: ${storyStack.name}`)
    if (storyStack.description) {
      lines.push(`# Description: ${storyStack.description}`)
    }
    lines.push('')
  }

  // Order cards for optimal serialization
  const orderedCards = orderCards(cards, choices, storyStack.firstCardId)

  // Serialize each card
  for (let i = 0; i < orderedCards.length; i++) {
    const card = orderedCards[i]
    const dslId = idMapping.dbToDsl.get(card.id) || generateSlugId(card.title, card.id)
    const cardChoices = choicesByCard.get(card.id) || []
    const isStart = card.id === storyStack.firstCardId

    // Add separator between cards
    if (i > 0) {
      lines.push('')
      lines.push('---')
      lines.push('')
    }

    // Card header
    if (isStart) {
      lines.push('@start')
    }

    // Include debug info as comments
    if (opts.includeDebugInfo) {
      lines.push(`# ID: ${card.id}`)
      lines.push(`# Order: ${card.orderIndex}`)
    }

    // Card header with ID and title
    lines.push(`## ${dslId}: ${card.title}`)

    // Optional attributes
    if (card.speaker) {
      lines.push(`@speaker: ${card.speaker}`)
    }
    if (card.speakerType) {
      lines.push(`@speakerType: ${card.speakerType}`)
    }
    if (card.message) {
      lines.push(`@message: ${card.message}`)
    }
    if (opts.includeImagePrompts && card.imagePrompt) {
      lines.push(`@imagePrompt: ${card.imagePrompt}`)
    }
    if (opts.includeImagePrompts && card.imageDescription) {
      lines.push(`@imageDescription: ${card.imageDescription}`)
    }

    // Content
    if (card.content) {
      lines.push(escapeContent(card.content))
    }

    // Blank line before choices if there's content
    if (card.content && cardChoices.length > 0) {
      lines.push('')
    }

    // Choices
    for (const choice of cardChoices) {
      const targetDslId = idMapping.dbToDsl.get(choice.targetCardId) || 'unknown'
      lines.push(`-> ${choice.label} -> ${targetDslId}`)
    }
  }

  // Add trailing newline
  lines.push('')

  return {
    text: lines.join('\n'),
    idMapping,
  }
}

/**
 * Serialize just the cards (without full story context)
 * Useful for export/import of card subsets
 */
export function serializeCardsToDsl(
  cards: StoryCard[],
  choices: Choice[],
  firstCardId: string | null = null
): string {
  const mockStack: StoryStack = {
    id: 'temp',
    ownerId: 'temp',
    name: 'Exported Cards',
    description: null,
    isPublished: false,
    publishedAt: null,
    slug: null,
    firstCardId,
    artStyleId: null,
    customArtStylePrompt: null,
    artStyleSource: 'preset',
    extractedStyleImageUrl: null,
    coverImageUrl: null,
    previewTheme: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { text } = serializeStoryToDsl(mockStack, cards, choices, {
    includeMetadata: false,
    includeImagePrompts: true,
  })

  return text
}
