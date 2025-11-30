import { StoryCard, Choice, Character, CharacterCard } from '@/lib/types'
import { EditorSnapshot } from '@/contexts/EditorContext'
import { ActionType, DiffChange, DiffSummary } from './types'

// Field labels for human-readable display
const CARD_FIELD_LABELS: Record<string, string> = {
  title: 'Title',
  content: 'Content',
  imageUrl: 'Image',
  imagePrompt: 'Image prompt',
  script: 'Script',
  message: 'Message',
  speaker: 'Speaker',
  speakerType: 'Speaker type',
}

const CHOICE_FIELD_LABELS: Record<string, string> = {
  label: 'Label',
  targetCardId: 'Target card',
}

const CHARACTER_FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  archetype: 'Archetype',
  pose: 'Pose',
  avatarUrl: 'Avatar',
}

// Truncate long values for display
function truncateValue(value: unknown, maxLength: number = 50): string {
  if (value === null || value === undefined) return '(empty)'
  const str = String(value)
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}

// Compare two objects and return changes
function compareObjects<T extends Record<string, unknown>>(
  oldObj: T | undefined,
  newObj: T | undefined,
  fieldLabels: Record<string, string>,
  fieldsToCompare: string[]
): DiffChange[] {
  const changes: DiffChange[] = []

  for (const field of fieldsToCompare) {
    const oldValue = oldObj?.[field]
    const newValue = newObj?.[field]

    // Skip if both are undefined or equal
    if (oldValue === newValue) continue
    if (oldValue === undefined && newValue === undefined) continue
    if (oldValue === null && newValue === null) continue
    // Treat null/undefined as equivalent for comparison
    if ((oldValue === null || oldValue === undefined) &&
        (newValue === null || newValue === undefined)) continue

    const label = fieldLabels[field] || field

    if (oldValue === undefined || oldValue === null) {
      changes.push({
        field,
        label,
        newValue: newValue as string | number | boolean | null,
        type: 'add',
      })
    } else if (newValue === undefined || newValue === null) {
      changes.push({
        field,
        label,
        oldValue: oldValue as string | number | boolean | null,
        type: 'delete',
      })
    } else {
      changes.push({
        field,
        label,
        oldValue: oldValue as string | number | boolean | null,
        newValue: newValue as string | number | boolean | null,
        type: 'update',
      })
    }
  }

  return changes
}

// Generate diff for a card change
function generateCardDiff(
  oldCard: StoryCard | undefined,
  newCard: StoryCard | undefined
): DiffChange[] {
  const fieldsToCompare = ['title', 'content', 'imageUrl', 'imagePrompt', 'script', 'message', 'speaker', 'speakerType']
  return compareObjects(
    oldCard as unknown as Record<string, unknown>,
    newCard as unknown as Record<string, unknown>,
    CARD_FIELD_LABELS,
    fieldsToCompare
  )
}

// Generate diff for a choice change
function generateChoiceDiff(
  oldChoice: Choice | undefined,
  newChoice: Choice | undefined
): DiffChange[] {
  const fieldsToCompare = ['label', 'targetCardId']
  return compareObjects(
    oldChoice as unknown as Record<string, unknown>,
    newChoice as unknown as Record<string, unknown>,
    CHOICE_FIELD_LABELS,
    fieldsToCompare
  )
}

// Generate diff for a character change
function generateCharacterDiff(
  oldChar: Character | undefined,
  newChar: Character | undefined
): DiffChange[] {
  const fieldsToCompare = ['name', 'description', 'archetype', 'pose', 'avatarUrl']
  return compareObjects(
    oldChar as unknown as Record<string, unknown>,
    newChar as unknown as Record<string, unknown>,
    CHARACTER_FIELD_LABELS,
    fieldsToCompare
  )
}

// Generate a summary string for a single change
export function formatDiffChange(change: DiffChange): string {
  switch (change.type) {
    case 'add':
      return `Added ${change.label}: "${truncateValue(change.newValue)}"`
    case 'delete':
      return `Removed ${change.label}`
    case 'update':
      if (change.field === 'imageUrl') {
        return 'Updated image'
      }
      return `Changed ${change.label}`
    default:
      return `Modified ${change.label}`
  }
}

// Generate a concise summary for display in the history panel
export function formatDiffSummary(summary: DiffSummary | undefined): string {
  if (!summary || summary.changes.length === 0) {
    return 'No changes'
  }

  if (summary.changes.length === 1) {
    return formatDiffChange(summary.changes[0])
  }

  const firstChange = formatDiffChange(summary.changes[0])
  const remainingCount = summary.changes.length - 1
  return `${firstChange} (+${remainingCount} more)`
}

// Generate diff summary comparing two snapshots for a specific action
export function generateDiffSummary(
  prevSnapshot: EditorSnapshot,
  newSnapshot: EditorSnapshot,
  actionType: ActionType,
  affectedId?: string
): DiffSummary | undefined {
  switch (actionType) {
    case 'ADD_CARD': {
      const newCard = newSnapshot.storyCards.find(c =>
        !prevSnapshot.storyCards.find(pc => pc.id === c.id)
      )
      if (newCard) {
        return {
          changes: [{ field: 'card', label: 'Card', type: 'add', newValue: newCard.title }],
          entityType: 'card',
          entityName: newCard.title || 'Untitled',
          totalChanges: 1,
        }
      }
      break
    }

    case 'DELETE_CARD': {
      const deletedCard = prevSnapshot.storyCards.find(c =>
        !newSnapshot.storyCards.find(nc => nc.id === c.id)
      )
      if (deletedCard) {
        return {
          changes: [{ field: 'card', label: 'Card', type: 'delete', oldValue: deletedCard.title }],
          entityType: 'card',
          entityName: deletedCard.title || 'Untitled',
          totalChanges: 1,
        }
      }
      break
    }

    case 'UPDATE_CARD':
    case 'UPDATE_IMAGE': {
      if (!affectedId) break
      const oldCard = prevSnapshot.storyCards.find(c => c.id === affectedId)
      const newCard = newSnapshot.storyCards.find(c => c.id === affectedId)
      if (oldCard && newCard) {
        const changes = generateCardDiff(oldCard, newCard)
        if (changes.length > 0) {
          return {
            changes,
            entityType: 'card',
            entityName: newCard.title || 'Untitled',
            totalChanges: changes.length,
          }
        }
      }
      break
    }

    case 'ADD_CHOICE': {
      const newChoice = newSnapshot.choices.find(c =>
        !prevSnapshot.choices.find(pc => pc.id === c.id)
      )
      if (newChoice) {
        return {
          changes: [{ field: 'choice', label: 'Choice', type: 'add', newValue: newChoice.label }],
          entityType: 'choice',
          entityName: newChoice.label || 'Untitled',
          totalChanges: 1,
        }
      }
      break
    }

    case 'DELETE_CHOICE': {
      const deletedChoice = prevSnapshot.choices.find(c =>
        !newSnapshot.choices.find(nc => nc.id === c.id)
      )
      if (deletedChoice) {
        return {
          changes: [{ field: 'choice', label: 'Choice', type: 'delete', oldValue: deletedChoice.label }],
          entityType: 'choice',
          entityName: deletedChoice.label || 'Untitled',
          totalChanges: 1,
        }
      }
      break
    }

    case 'UPDATE_CHOICE': {
      if (!affectedId) break
      const oldChoice = prevSnapshot.choices.find(c => c.id === affectedId)
      const newChoice = newSnapshot.choices.find(c => c.id === affectedId)
      if (oldChoice && newChoice) {
        const changes = generateChoiceDiff(oldChoice, newChoice)
        if (changes.length > 0) {
          return {
            changes,
            entityType: 'choice',
            entityName: newChoice.label || 'Untitled',
            totalChanges: changes.length,
          }
        }
      }
      break
    }

    case 'ADD_CHARACTER': {
      const newChar = newSnapshot.characters.find(c =>
        !prevSnapshot.characters.find(pc => pc.id === c.id)
      )
      if (newChar) {
        return {
          changes: [{ field: 'character', label: 'Character', type: 'add', newValue: newChar.name }],
          entityType: 'character',
          entityName: newChar.name || 'Unnamed',
          totalChanges: 1,
        }
      }
      break
    }

    case 'DELETE_CHARACTER': {
      const deletedChar = prevSnapshot.characters.find(c =>
        !newSnapshot.characters.find(nc => nc.id === c.id)
      )
      if (deletedChar) {
        return {
          changes: [{ field: 'character', label: 'Character', type: 'delete', oldValue: deletedChar.name }],
          entityType: 'character',
          entityName: deletedChar.name || 'Unnamed',
          totalChanges: 1,
        }
      }
      break
    }

    case 'UPDATE_CHARACTER': {
      if (!affectedId) break
      const oldChar = prevSnapshot.characters.find(c => c.id === affectedId)
      const newChar = newSnapshot.characters.find(c => c.id === affectedId)
      if (oldChar && newChar) {
        const changes = generateCharacterDiff(oldChar, newChar)
        if (changes.length > 0) {
          return {
            changes,
            entityType: 'character',
            entityName: newChar.name || 'Unnamed',
            totalChanges: changes.length,
          }
        }
      }
      break
    }

    case 'BULK_UPDATE': {
      // For bulk updates, count all changes
      let totalChanges = 0
      const allChanges: DiffChange[] = []

      // Compare cards
      for (const newCard of newSnapshot.storyCards) {
        const oldCard = prevSnapshot.storyCards.find(c => c.id === newCard.id)
        if (oldCard) {
          const changes = generateCardDiff(oldCard, newCard)
          allChanges.push(...changes)
          totalChanges += changes.length
        }
      }

      if (totalChanges > 0) {
        return {
          changes: allChanges.slice(0, 5), // Limit to first 5 changes for display
          entityType: 'card',
          entityName: 'Multiple items',
          totalChanges,
        }
      }
      break
    }
  }

  return undefined
}

// Get an action icon for display
export function getActionIcon(actionType: ActionType): string {
  switch (actionType) {
    case 'ADD_CARD':
    case 'ADD_CHOICE':
    case 'ADD_CHARACTER':
      return '+'
    case 'DELETE_CARD':
    case 'DELETE_CHOICE':
    case 'DELETE_CHARACTER':
      return '−'
    case 'UPDATE_CARD':
    case 'UPDATE_CHOICE':
    case 'UPDATE_CHARACTER':
    case 'UPDATE_IMAGE':
      return '✎'
    case 'BULK_UPDATE':
      return '⋮'
    default:
      return '•'
  }
}

// Get action color class
export function getActionColorClass(actionType: ActionType): string {
  switch (actionType) {
    case 'ADD_CARD':
    case 'ADD_CHOICE':
    case 'ADD_CHARACTER':
      return 'text-green-600 bg-green-100'
    case 'DELETE_CARD':
    case 'DELETE_CHOICE':
    case 'DELETE_CHARACTER':
      return 'text-red-600 bg-red-100'
    case 'UPDATE_CARD':
    case 'UPDATE_CHOICE':
    case 'UPDATE_CHARACTER':
    case 'UPDATE_IMAGE':
      return 'text-blue-600 bg-blue-100'
    case 'BULK_UPDATE':
      return 'text-purple-600 bg-purple-100'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

// Format relative time for history entries
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`

  // For older entries, show date
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
