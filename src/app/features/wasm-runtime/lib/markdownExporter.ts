// Markdown Exporter - Converts story data to human-readable Markdown format
// This module creates a clean textual outline of the story structure

import type { StoryStack, StoryCard, Choice, Character } from '@/lib/types'
import type { NavigationGraph } from './types'
import { buildNavigationGraph } from './serializer'

export interface MarkdownExportOptions {
  includeCharacters: boolean
  includeNavigationGraph: boolean
  includeOrphanedCards: boolean
  includeDeadEnds: boolean
}

const DEFAULT_OPTIONS: MarkdownExportOptions = {
  includeCharacters: true,
  includeNavigationGraph: true,
  includeOrphanedCards: true,
  includeDeadEnds: true,
}

/**
 * Generates a Markdown document from the story structure
 */
export function generateStoryMarkdown(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  options: Partial<MarkdownExportOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const navigation = buildNavigationGraph(stack, cards, choices)
  const sections: string[] = []

  // Title and metadata
  sections.push(generateHeader(stack, cards, choices, characters))

  // Characters section
  if (opts.includeCharacters && characters.length > 0) {
    sections.push(generateCharactersSection(characters))
  }

  // Story cards section
  sections.push(generateCardsSection(cards, choices, navigation, stack.firstCardId))

  // Navigation graph summary
  if (opts.includeNavigationGraph) {
    sections.push(generateNavigationSummary(navigation))
  }

  // Orphaned cards warning
  if (opts.includeOrphanedCards && navigation.orphans.length > 0) {
    sections.push(generateOrphanedCardsSection(navigation.orphans, cards))
  }

  // Dead ends warning
  if (opts.includeDeadEnds && navigation.deadEnds.length > 0) {
    sections.push(generateDeadEndsSection(navigation.deadEnds, cards))
  }

  return sections.join('\n\n---\n\n')
}

/**
 * Generates the header section with story metadata
 */
function generateHeader(
  stack: StoryStack,
  cards: StoryCard[],
  choices: Choice[],
  characters: Character[]
): string {
  const lines: string[] = []

  lines.push(`# ${stack.name}`)
  lines.push('')

  if (stack.description) {
    lines.push(`> ${stack.description}`)
    lines.push('')
  }

  lines.push('## Story Overview')
  lines.push('')
  lines.push('| Metric | Count |')
  lines.push('|--------|-------|')
  lines.push(`| Cards | ${cards.length} |`)
  lines.push(`| Choices | ${choices.length} |`)
  lines.push(`| Characters | ${characters.length} |`)

  if (stack.slug) {
    lines.push('')
    lines.push(`**Published Slug:** \`${stack.slug}\``)
  }

  if (stack.previewTheme) {
    lines.push(`**Theme:** ${stack.previewTheme}`)
  }

  return lines.join('\n')
}

/**
 * Generates the characters section
 */
function generateCharactersSection(characters: Character[]): string {
  const lines: string[] = []

  lines.push('## Characters')
  lines.push('')

  const sortedCharacters = [...characters].sort((a, b) => a.orderIndex - b.orderIndex)

  for (const character of sortedCharacters) {
    lines.push(`### ${character.name}`)
    lines.push('')

    if (character.appearance) {
      lines.push('**Appearance:**')
      lines.push('')
      lines.push(character.appearance)
      lines.push('')
    }

    if (character.imageUrls.length > 0) {
      lines.push(`*${character.imageUrls.length} image(s) generated*`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Generates the story cards section with choices
 */
function generateCardsSection(
  cards: StoryCard[],
  choices: Choice[],
  navigation: NavigationGraph,
  firstCardId: string | null
): string {
  const lines: string[] = []

  lines.push('## Story Cards')
  lines.push('')

  // Build a map of choices by card ID
  const choicesByCard = new Map<string, Choice[]>()
  for (const choice of choices) {
    if (!choicesByCard.has(choice.storyCardId)) {
      choicesByCard.set(choice.storyCardId, [])
    }
    choicesByCard.get(choice.storyCardId)!.push(choice)
  }

  // Sort cards: entry card first, then by depth in navigation graph, then by orderIndex
  const sortedCards = [...cards].sort((a, b) => {
    // Entry card always first
    if (a.id === firstCardId) return -1
    if (b.id === firstCardId) return 1

    // Then by depth (closer to entry = earlier)
    const depthA = navigation.nodes[a.id]?.depth ?? Infinity
    const depthB = navigation.nodes[b.id]?.depth ?? Infinity
    if (depthA !== depthB) return depthA - depthB

    // Then by orderIndex
    return a.orderIndex - b.orderIndex
  })

  // Create a card ID to title map for choice references
  const cardTitleMap = new Map<string, string>()
  for (const card of cards) {
    cardTitleMap.set(card.id, card.title)
  }

  for (const card of sortedCards) {
    const node = navigation.nodes[card.id]
    const isEntry = card.id === firstCardId
    const isOrphan = node?.isOrphan && !isEntry
    const isDeadEnd = node?.isDeadEnd

    // Card header with badges
    const badges: string[] = []
    if (isEntry) badges.push('📍 Entry Point')
    if (isOrphan) badges.push('⚠️ Orphaned')
    if (isDeadEnd) badges.push('🔚 Dead End')

    const badgeStr = badges.length > 0 ? ` ${badges.join(' | ')}` : ''
    lines.push(`### ${card.title}${badgeStr}`)
    lines.push('')

    // Card content
    if (card.content) {
      lines.push(card.content)
      lines.push('')
    } else {
      lines.push('*No content*')
      lines.push('')
    }

    // Message/dialogue if present
    if (card.message) {
      const speakerLabel = card.speaker || (card.speakerType === 'narrator' ? 'Narrator' : 'Character')
      lines.push(`> **${speakerLabel}:** "${card.message}"`)
      lines.push('')
    }

    // Choices
    const cardChoices = choicesByCard.get(card.id) || []
    if (cardChoices.length > 0) {
      lines.push('**Choices:**')
      lines.push('')

      // Sort choices by orderIndex
      const sortedChoices = [...cardChoices].sort((a, b) => a.orderIndex - b.orderIndex)

      for (const choice of sortedChoices) {
        const targetTitle = cardTitleMap.get(choice.targetCardId) || 'Unknown Card'
        lines.push(`- [ ] **${choice.label}** → *${targetTitle}*`)
      }
      lines.push('')
    }

    // Image reference
    if (card.imageUrl) {
      lines.push('*Has generated image*')
      lines.push('')
    }
  }

  return lines.join('\n')
}

/**
 * Generates a navigation summary section
 */
function generateNavigationSummary(navigation: NavigationGraph): string {
  const lines: string[] = []

  lines.push('## Navigation Structure')
  lines.push('')

  // Calculate stats
  const totalNodes = Object.keys(navigation.nodes).length
  const reachableNodes = Object.values(navigation.nodes).filter((n) => !n.isOrphan).length
  const maxDepth = Math.max(...Object.values(navigation.nodes).map((n) => n.depth).filter((d) => d >= 0), 0)
  const avgChoices = navigation.edges.length / Math.max(totalNodes, 1)

  lines.push('### Graph Statistics')
  lines.push('')
  lines.push('| Metric | Value |')
  lines.push('|--------|-------|')
  lines.push(`| Total Cards | ${totalNodes} |`)
  lines.push(`| Reachable Cards | ${reachableNodes} |`)
  lines.push(`| Maximum Depth | ${maxDepth} |`)
  lines.push(`| Total Connections | ${navigation.edges.length} |`)
  lines.push(`| Avg Choices per Card | ${avgChoices.toFixed(1)} |`)

  return lines.join('\n')
}

/**
 * Generates a section listing orphaned cards
 */
function generateOrphanedCardsSection(orphanIds: string[], cards: StoryCard[]): string {
  const lines: string[] = []

  lines.push('## ⚠️ Orphaned Cards')
  lines.push('')
  lines.push('The following cards are not reachable from the story entry point:')
  lines.push('')

  const cardMap = new Map(cards.map((c) => [c.id, c]))

  for (const orphanId of orphanIds) {
    const card = cardMap.get(orphanId)
    if (card) {
      lines.push(`- **${card.title}**`)
    }
  }

  lines.push('')
  lines.push('*Consider adding choices that lead to these cards, or remove them if unused.*')

  return lines.join('\n')
}

/**
 * Generates a section listing dead-end cards
 */
function generateDeadEndsSection(deadEndIds: string[], cards: StoryCard[]): string {
  const lines: string[] = []

  lines.push('## 🔚 Dead Ends')
  lines.push('')
  lines.push('The following cards have no outgoing choices (story endings):')
  lines.push('')

  const cardMap = new Map(cards.map((c) => [c.id, c]))

  for (const deadEndId of deadEndIds) {
    const card = cardMap.get(deadEndId)
    if (card) {
      lines.push(`- **${card.title}**`)
    }
  }

  lines.push('')
  lines.push('*This is normal for story endings. If unintentional, add choices to continue the story.*')

  return lines.join('\n')
}

/**
 * Creates a Markdown blob for download
 */
export function createMarkdownBlob(markdown: string): Blob {
  return new Blob([markdown], { type: 'text/markdown' })
}
