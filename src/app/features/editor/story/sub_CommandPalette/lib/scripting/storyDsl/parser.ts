/**
 * Story DSL Parser
 *
 * Parses the text DSL format into structured data that can be
 * applied to the story graph.
 *
 * DSL Format:
 * - Lines starting with `#` are metadata (# Story: Title)
 * - Lines starting with `##` are card headers (## card_id: Card Title)
 * - Lines starting with `@` are card attributes (@start, @speaker: Name)
 * - Lines starting with `->` are choices (-> Label -> target_id)
 * - Lines with `---` separate cards
 * - Everything else is card content
 */

import type {
  DslCard,
  DslChoice,
  DslDocument,
  DslMetadata,
  DslParseError,
  DslParseOptions,
  DslParseResult,
  DslParseWarning,
} from './types'

const DEFAULT_OPTIONS: DslParseOptions = {
  validateTargets: true,
  autoGenerateIds: true,
  preserveLineNumbers: true,
}

/**
 * Generate a slug-like ID from a title
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50) || 'card'
}

/**
 * Generate a unique ID by appending a number if needed
 */
function uniqueId(base: string, existingIds: Set<string>): string {
  if (!existingIds.has(base)) return base
  let counter = 1
  while (existingIds.has(`${base}_${counter}`)) {
    counter++
  }
  return `${base}_${counter}`
}

/**
 * Parse metadata lines (# Key: Value)
 */
function parseMetadata(lines: string[]): DslMetadata {
  const metadata: DslMetadata = {
    properties: {},
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('#') || trimmed.startsWith('##')) continue

    // Remove the # prefix
    const content = trimmed.substring(1).trim()

    // Check for key: value format
    const colonIndex = content.indexOf(':')
    if (colonIndex > 0) {
      const key = content.substring(0, colonIndex).trim().toLowerCase()
      const value = content.substring(colonIndex + 1).trim()

      if (key === 'story' || key === 'title') {
        metadata.title = value
      } else if (key === 'description') {
        metadata.description = value
      } else {
        metadata.properties[key] = value
      }
    }
  }

  return metadata
}

/**
 * Parse a choice line (-> Label -> target_id)
 */
function parseChoice(line: string, lineNumber: number): DslChoice | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('->')) return null

  // Remove leading ->
  const content = trimmed.substring(2).trim()

  // Split by -> to get label and target
  const parts = content.split('->')
  if (parts.length < 2) {
    return null
  }

  const label = parts[0].trim()
  const targetId = parts[1].trim().toLowerCase().replace(/\s+/g, '_')

  // Check for terminal markers
  const isTerminal = targetId === 'end' || targetId === 'terminal' || targetId === 'finish'

  return {
    label,
    targetId: isTerminal ? 'END' : targetId,
    isTerminal,
    lineNumber,
  }
}

/**
 * Parse a card header line (## card_id: Title or ## Title)
 */
function parseCardHeader(
  line: string,
  existingIds: Set<string>,
  options: DslParseOptions
): { id: string; title: string } | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('##')) return null

  // Remove ## prefix
  const content = trimmed.substring(2).trim()

  // Check for id: title format
  const colonIndex = content.indexOf(':')
  if (colonIndex > 0) {
    const id = content.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_')
    const title = content.substring(colonIndex + 1).trim()
    return { id, title }
  }

  // Just a title, generate ID
  const title = content
  if (options.autoGenerateIds) {
    const baseId = slugify(title)
    const id = uniqueId(baseId, existingIds)
    return { id, title }
  }

  return { id: slugify(title), title }
}

/**
 * Parse card attributes (@key or @key: value)
 */
function parseAttribute(line: string): { key: string; value: string | true } | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('@')) return null

  const content = trimmed.substring(1)
  const colonIndex = content.indexOf(':')

  if (colonIndex > 0) {
    const key = content.substring(0, colonIndex).trim().toLowerCase()
    const value = content.substring(colonIndex + 1).trim()
    return { key, value }
  }

  // Boolean attribute (just @key)
  return { key: content.trim().toLowerCase(), value: true }
}

/**
 * Parse the DSL text into a structured document
 */
export function parseStoryDsl(text: string, options: Partial<DslParseOptions> = {}): DslParseResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const lines = text.split('\n')
  const errors: DslParseError[] = []
  const warnings: DslParseWarning[] = []

  // First pass: extract metadata from header lines
  const metadata = parseMetadata(lines)

  // Second pass: parse cards
  const cards: DslCard[] = []
  const existingIds = new Set<string>()
  let currentCard: DslCard | null = null
  let contentLines: string[] = []
  let startCardId: string | null = null

  const finalizeCard = () => {
    if (currentCard) {
      // Set content from accumulated lines
      currentCard.content = contentLines
        .join('\n')
        .trim()

      // Check for empty content
      if (!currentCard.content && currentCard.choices.length === 0) {
        warnings.push({
          message: `Card "${currentCard.title}" has no content or choices`,
          line: currentCard.lineNumber || 0,
          type: 'empty_content',
        })
      }

      // Check for dead ends
      if (currentCard.choices.length === 0 && !currentCard.content.toLowerCase().includes('the end')) {
        warnings.push({
          message: `Card "${currentCard.title}" has no choices (dead end)`,
          line: currentCard.lineNumber || 0,
          type: 'dead_end',
        })
      }

      cards.push(currentCard)
      existingIds.add(currentCard.id)
    }
    contentLines = []
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNumber = i + 1
    const trimmed = line.trim()

    // Skip empty lines in between cards
    if (trimmed === '---') {
      finalizeCard()
      currentCard = null
      continue
    }

    // Skip metadata lines
    if (trimmed.startsWith('#') && !trimmed.startsWith('##')) {
      continue
    }

    // Card header
    if (trimmed.startsWith('##')) {
      // Finalize previous card if exists
      if (currentCard) {
        finalizeCard()
      }

      const header = parseCardHeader(line, existingIds, opts)
      if (!header) {
        errors.push({
          message: 'Invalid card header format',
          line: lineNumber,
          suggestion: 'Use format: ## card_id: Card Title',
        })
        continue
      }

      // Check for duplicate IDs
      if (existingIds.has(header.id)) {
        warnings.push({
          message: `Duplicate card ID "${header.id}"`,
          line: lineNumber,
          type: 'duplicate_id',
        })
        header.id = uniqueId(header.id, existingIds)
      }

      currentCard = {
        id: header.id,
        title: header.title,
        content: '',
        isStart: false,
        choices: [],
        lineNumber,
      }
      continue
    }

    // Attribute lines
    if (trimmed.startsWith('@')) {
      const attr = parseAttribute(line)
      if (attr && currentCard) {
        switch (attr.key) {
          case 'start':
          case 'first':
          case 'entry':
            currentCard.isStart = true
            startCardId = currentCard.id
            break
          case 'speaker':
            currentCard.speaker = typeof attr.value === 'string' ? attr.value : undefined
            break
          case 'speakertype':
          case 'speaker_type':
            if (typeof attr.value === 'string') {
              const type = attr.value.toLowerCase()
              if (type === 'character' || type === 'narrator' || type === 'system') {
                currentCard.speakerType = type
              }
            }
            break
          case 'image':
          case 'imageprompt':
          case 'image_prompt':
            currentCard.imagePrompt = typeof attr.value === 'string' ? attr.value : undefined
            break
          case 'imagedesc':
          case 'image_description':
            currentCard.imageDescription = typeof attr.value === 'string' ? attr.value : undefined
            break
          case 'message':
            currentCard.message = typeof attr.value === 'string' ? attr.value : undefined
            break
        }
      }
      continue
    }

    // Choice lines
    if (trimmed.startsWith('->')) {
      const choice = parseChoice(line, lineNumber)
      if (choice && currentCard) {
        currentCard.choices.push(choice)
      } else if (!currentCard) {
        errors.push({
          message: 'Choice found outside of a card',
          line: lineNumber,
          suggestion: 'Add a card header (## Title) before choices',
        })
      }
      continue
    }

    // Regular content line
    if (currentCard) {
      contentLines.push(line)
    }
  }

  // Finalize the last card
  finalizeCard()

  // If no start card was marked, use the first card
  if (!startCardId && cards.length > 0) {
    startCardId = cards[0].id
    cards[0].isStart = true
  }

  // Validate targets if enabled
  if (opts.validateTargets) {
    const allIds = new Set(cards.map(c => c.id))

    for (const card of cards) {
      for (const choice of card.choices) {
        if (!choice.isTerminal && !allIds.has(choice.targetId)) {
          warnings.push({
            message: `Choice "${choice.label}" in card "${card.title}" targets non-existent card "${choice.targetId}"`,
            line: choice.lineNumber || 0,
            type: 'invalid_target',
          })
        }
      }
    }

    // Check for orphaned cards (not reachable from start)
    if (startCardId) {
      const reachable = new Set<string>()
      const queue = [startCardId]

      while (queue.length > 0) {
        const id = queue.shift()!
        if (reachable.has(id)) continue
        reachable.add(id)

        const card = cards.find(c => c.id === id)
        if (card) {
          for (const choice of card.choices) {
            if (!choice.isTerminal && !reachable.has(choice.targetId)) {
              queue.push(choice.targetId)
            }
          }
        }
      }

      for (const card of cards) {
        if (!reachable.has(card.id)) {
          warnings.push({
            message: `Card "${card.title}" is not reachable from the start`,
            line: card.lineNumber || 0,
            type: 'orphaned_card',
          })
        }
      }
    }
  }

  return {
    success: errors.length === 0,
    document: {
      metadata,
      cards,
      startCardId,
    },
    errors,
    warnings,
  }
}

/**
 * Quick validation without full parsing
 */
export function validateStoryDsl(text: string): { valid: boolean; errorCount: number; warningCount: number } {
  const result = parseStoryDsl(text)
  return {
    valid: result.success,
    errorCount: result.errors.length,
    warningCount: result.warnings.length,
  }
}
