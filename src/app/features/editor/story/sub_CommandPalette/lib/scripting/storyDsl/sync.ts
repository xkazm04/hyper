/**
 * Story DSL Sync Bridge
 *
 * Handles bidirectional synchronization between the DSL text representation
 * and the editor context (cards, choices). This is the core of the real-time
 * sync feature that keeps the DSL editor and visual canvas in sync.
 */

import { v4 as uuidv4 } from 'uuid'
import type { StoryStack, StoryCard, Choice, CreateChoiceInput } from '@/lib/types'
import type { DslDocument, DslCard, DslApplyResult, DslIdMapping, DslDiff } from './types'
import { parseStoryDsl } from './parser'
import { serializeStoryToDsl } from './serializer'

/**
 * Generate a deterministic slug ID from title
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
 * Create a new StoryCard from a DSL card
 */
function createCardFromDsl(
  dslCard: DslCard,
  storyStackId: string,
  orderIndex: number
): StoryCard {
  const now = new Date().toISOString()
  return {
    id: uuidv4(),
    storyStackId,
    title: dslCard.title,
    content: dslCard.content,
    script: '',
    imageUrl: null,
    imagePrompt: dslCard.imagePrompt || null,
    imageDescription: dslCard.imageDescription || null,
    message: dslCard.message || null,
    speaker: dslCard.speaker || null,
    speakerType: dslCard.speakerType || null,
    orderIndex,
    version: 1,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Update an existing StoryCard from DSL changes
 */
function updateCardFromDsl(
  existingCard: StoryCard,
  dslCard: DslCard
): StoryCard {
  return {
    ...existingCard,
    title: dslCard.title,
    content: dslCard.content,
    imagePrompt: dslCard.imagePrompt ?? existingCard.imagePrompt,
    imageDescription: dslCard.imageDescription ?? existingCard.imageDescription,
    message: dslCard.message ?? existingCard.message,
    speaker: dslCard.speaker ?? existingCard.speaker,
    speakerType: dslCard.speakerType ?? existingCard.speakerType,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Compute diff between two DSL documents
 */
export function computeDslDiff(
  oldDoc: DslDocument,
  newDoc: DslDocument
): DslDiff {
  const oldCardMap = new Map(oldDoc.cards.map(c => [c.id, c]))
  const newCardMap = new Map(newDoc.cards.map(c => [c.id, c]))

  const addedCards: DslCard[] = []
  const removedCards: DslCard[] = []
  const modifiedCards: Array<{ id: string; changes: Partial<DslCard> }> = []

  // Find added and modified cards
  for (const [id, newCard] of newCardMap) {
    const oldCard = oldCardMap.get(id)
    if (!oldCard) {
      addedCards.push(newCard)
    } else {
      // Check for changes
      const changes: Partial<DslCard> = {}
      if (oldCard.title !== newCard.title) changes.title = newCard.title
      if (oldCard.content !== newCard.content) changes.content = newCard.content
      if (oldCard.speaker !== newCard.speaker) changes.speaker = newCard.speaker
      if (oldCard.speakerType !== newCard.speakerType) changes.speakerType = newCard.speakerType
      if (oldCard.message !== newCard.message) changes.message = newCard.message
      if (oldCard.imagePrompt !== newCard.imagePrompt) changes.imagePrompt = newCard.imagePrompt

      // Check choices for changes
      const oldChoiceKeys = oldCard.choices.map(c => `${c.label}:${c.targetId}`).join('|')
      const newChoiceKeys = newCard.choices.map(c => `${c.label}:${c.targetId}`).join('|')
      if (oldChoiceKeys !== newChoiceKeys) {
        changes.choices = newCard.choices
      }

      if (Object.keys(changes).length > 0) {
        modifiedCards.push({ id, changes })
      }
    }
  }

  // Find removed cards
  for (const [id, oldCard] of oldCardMap) {
    if (!newCardMap.has(id)) {
      removedCards.push(oldCard)
    }
  }

  return {
    addedCards,
    removedCards,
    modifiedCards,
    startCardChanged: oldDoc.startCardId !== newDoc.startCardId,
    newStartCardId: newDoc.startCardId || undefined,
  }
}

/**
 * Apply DSL document to create/update story graph
 *
 * This is the main sync function that takes a parsed DSL document and
 * updates the editor context to match. It handles:
 * - Creating new cards
 * - Updating existing cards
 * - Deleting removed cards
 * - Creating/updating/deleting choices
 * - Maintaining ID mappings
 */
export function applyDslToGraph(
  document: DslDocument,
  storyStack: StoryStack,
  existingCards: StoryCard[],
  existingChoices: Choice[],
  idMapping: DslIdMapping
): DslApplyResult {
  const errors: string[] = []
  const created: string[] = []
  const updated: string[] = []
  const deleted: string[] = []
  const choicesCreated: string[] = []
  const choicesUpdated: string[] = []
  const choicesDeleted: string[] = []

  // Create maps for efficient lookup
  const existingCardMap = new Map(existingCards.map(c => [c.id, c]))
  const dslCardMap = new Map(document.cards.map(c => [c.id, c]))

  // Updated ID mapping
  const newIdMapping: DslIdMapping = {
    dslToDb: new Map(idMapping.dslToDb),
    dbToDsl: new Map(idMapping.dbToDsl),
  }

  // Track which DB cards are still in use
  const usedDbIds = new Set<string>()

  // New cards and updated cards
  const newCards: StoryCard[] = []
  const updatedCards: StoryCard[] = []
  let orderIndex = 0

  for (const dslCard of document.cards) {
    const existingDbId = idMapping.dslToDb.get(dslCard.id)

    if (existingDbId && existingCardMap.has(existingDbId)) {
      // Update existing card
      const existingCard = existingCardMap.get(existingDbId)!
      const updatedCard = updateCardFromDsl(existingCard, dslCard)
      updatedCard.orderIndex = orderIndex
      updatedCards.push(updatedCard)
      usedDbIds.add(existingDbId)
      updated.push(existingDbId)
    } else {
      // Create new card
      const newCard = createCardFromDsl(dslCard, storyStack.id, orderIndex)
      newCards.push(newCard)
      created.push(newCard.id)

      // Update mapping
      newIdMapping.dslToDb.set(dslCard.id, newCard.id)
      newIdMapping.dbToDsl.set(newCard.id, dslCard.id)
      usedDbIds.add(newCard.id)
    }

    orderIndex++
  }

  // Find deleted cards
  for (const [dbId] of existingCardMap) {
    if (!usedDbIds.has(dbId)) {
      deleted.push(dbId)
      // Remove from mapping
      const dslId = newIdMapping.dbToDsl.get(dbId)
      if (dslId) {
        newIdMapping.dslToDb.delete(dslId)
        newIdMapping.dbToDsl.delete(dbId)
      }
    }
  }

  // Build complete card list (updated + new)
  const allCards = [...updatedCards, ...newCards]
  const cardIdMap = new Map(allCards.map(c => [c.id, c]))

  // Process choices
  const existingChoiceMap = new Map<string, Choice>()
  for (const choice of existingChoices) {
    const key = `${choice.storyCardId}:${choice.label}`
    existingChoiceMap.set(key, choice)
  }

  const newChoices: Choice[] = []
  const updatedChoicesLocal: Choice[] = []
  const usedChoiceKeys = new Set<string>()

  for (const dslCard of document.cards) {
    const dbCardId = newIdMapping.dslToDb.get(dslCard.id)
    if (!dbCardId) continue

    let choiceOrderIndex = 0
    for (const dslChoice of dslCard.choices) {
      if (dslChoice.isTerminal) {
        // Terminal choices don't have a target - skip for now
        // Could create a special "END" card in the future
        continue
      }

      const targetDbId = newIdMapping.dslToDb.get(dslChoice.targetId)
      if (!targetDbId) {
        errors.push(`Choice "${dslChoice.label}" targets unknown card "${dslChoice.targetId}"`)
        continue
      }

      const choiceKey = `${dbCardId}:${dslChoice.label}`
      usedChoiceKeys.add(choiceKey)

      const existingChoice = existingChoiceMap.get(choiceKey)
      if (existingChoice) {
        // Update existing choice
        if (existingChoice.targetCardId !== targetDbId || existingChoice.orderIndex !== choiceOrderIndex) {
          updatedChoicesLocal.push({
            ...existingChoice,
            targetCardId: targetDbId,
            orderIndex: choiceOrderIndex,
            updatedAt: new Date().toISOString(),
          })
          choicesUpdated.push(existingChoice.id)
        }
      } else {
        // Create new choice
        const now = new Date().toISOString()
        const newChoice: Choice = {
          id: uuidv4(),
          storyCardId: dbCardId,
          label: dslChoice.label,
          targetCardId: targetDbId,
          orderIndex: choiceOrderIndex,
          createdAt: now,
          updatedAt: now,
        }
        newChoices.push(newChoice)
        choicesCreated.push(newChoice.id)
      }

      choiceOrderIndex++
    }
  }

  // Find deleted choices
  for (const [key, choice] of existingChoiceMap) {
    if (!usedChoiceKeys.has(key)) {
      choicesDeleted.push(choice.id)
    }
  }

  return {
    success: errors.length === 0,
    created,
    updated,
    deleted,
    choicesCreated,
    choicesUpdated,
    choicesDeleted,
    errors,
    idMapping: newIdMapping,
  }
}

/**
 * Sync state for managing DSL <-> Graph synchronization
 */
export interface DslSyncState {
  /** Current DSL text */
  dslText: string
  /** Current parsed document (may be null if parse failed) */
  document: DslDocument | null
  /** ID mapping between DSL IDs and database UUIDs */
  idMapping: DslIdMapping
  /** Whether DSL has unsaved changes */
  isDirty: boolean
  /** Last sync timestamp */
  lastSyncAt: number
  /** Parse errors */
  parseErrors: string[]
  /** Parse warnings */
  parseWarnings: string[]
}

/**
 * Create initial sync state from existing graph
 */
export function createSyncState(
  storyStack: StoryStack,
  cards: StoryCard[],
  choices: Choice[]
): DslSyncState {
  const { text, idMapping } = serializeStoryToDsl(storyStack, cards, choices)
  const parseResult = parseStoryDsl(text)

  return {
    dslText: text,
    document: parseResult.document || null,
    idMapping,
    isDirty: false,
    lastSyncAt: Date.now(),
    parseErrors: parseResult.errors.map(e => e.message),
    parseWarnings: parseResult.warnings.map(w => w.message),
  }
}

/**
 * Update sync state when DSL text changes
 */
export function updateSyncStateFromDsl(
  currentState: DslSyncState,
  newDslText: string
): DslSyncState {
  const parseResult = parseStoryDsl(newDslText)

  return {
    ...currentState,
    dslText: newDslText,
    document: parseResult.document || null,
    isDirty: true,
    parseErrors: parseResult.errors.map(e => e.message),
    parseWarnings: parseResult.warnings.map(w => w.message),
  }
}

/**
 * Update sync state when graph changes
 */
export function updateSyncStateFromGraph(
  currentState: DslSyncState,
  storyStack: StoryStack,
  cards: StoryCard[],
  choices: Choice[]
): DslSyncState {
  const { text, idMapping } = serializeStoryToDsl(storyStack, cards, choices)
  const parseResult = parseStoryDsl(text)

  return {
    dslText: text,
    document: parseResult.document || null,
    idMapping,
    isDirty: false,
    lastSyncAt: Date.now(),
    parseErrors: parseResult.errors.map(e => e.message),
    parseWarnings: parseResult.warnings.map(w => w.message),
  }
}
