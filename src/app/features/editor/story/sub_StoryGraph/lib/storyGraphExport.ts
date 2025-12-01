/**
 * Story Graph Export/Import Schema and Utilities
 *
 * Provides functionality to export the current story graph to a JSON file
 * and import a previously exported graph with schema validation.
 */

import type { StoryStack, StoryCard, Choice, Character, CharacterCard, PreviewTheme } from '@/lib/types'

// Current schema version for export format
export const EXPORT_SCHEMA_VERSION = '1.0.0'

/**
 * Export format for a complete story graph
 */
export interface StoryGraphExport {
  schemaVersion: string
  exportedAt: string
  metadata: StoryGraphMetadata
  storyStack: StoryStackExport
  storyCards: StoryCardExport[]
  choices: ChoiceExport[]
  characters: CharacterExport[]
  characterCards: CharacterCardExport[]
}

/**
 * Metadata about the export
 */
export interface StoryGraphMetadata {
  exportedBy: string | null
  originalStackId: string
  totalCards: number
  totalChoices: number
  totalCharacters: number
  totalCharacterCards: number
}

/**
 * Story stack export format (excludes server-generated fields)
 */
export interface StoryStackExport {
  name: string
  description: string | null
  firstCardId: string | null
  artStyleId: string | null
  customArtStylePrompt: string | null
  artStyleSource: 'preset' | 'custom' | 'extracted'
  extractedStyleImageUrl: string | null
  previewTheme: PreviewTheme | null
}

/**
 * Story card export format
 */
export interface StoryCardExport {
  id: string  // Used for internal references (choices, firstCardId)
  title: string
  content: string
  script: string
  imageUrl: string | null
  imagePrompt: string | null
  imageDescription: string | null
  message: string | null
  speaker: string | null
  speakerType: 'character' | 'narrator' | 'system' | null
  orderIndex: number
}

/**
 * Choice export format
 */
export interface ChoiceExport {
  id: string
  storyCardId: string
  label: string
  targetCardId: string
  orderIndex: number
}

/**
 * Character export format
 */
export interface CharacterExport {
  id: string
  name: string
  appearance: string
  imageUrls: string[]
  imagePrompts: string[]
  avatarUrl: string | null
  avatarPrompt: string | null
  orderIndex: number
}

/**
 * Character card export format
 */
export interface CharacterCardExport {
  id: string
  characterId: string
  title: string | null
  content: string | null
  imageIndex: number
  showAvatar: boolean
  orderIndex: number
}

/**
 * Validation result for import
 */
export interface ImportValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Export the current story graph to a JSON object
 */
export function exportStoryGraph(
  storyStack: StoryStack,
  storyCards: StoryCard[],
  choices: Choice[],
  characters: Character[],
  characterCards: CharacterCard[],
  exportedBy: string | null = null
): StoryGraphExport {
  const storyStackExport: StoryStackExport = {
    name: storyStack.name,
    description: storyStack.description,
    firstCardId: storyStack.firstCardId,
    artStyleId: storyStack.artStyleId,
    customArtStylePrompt: storyStack.customArtStylePrompt,
    artStyleSource: storyStack.artStyleSource,
    extractedStyleImageUrl: storyStack.extractedStyleImageUrl,
    previewTheme: storyStack.previewTheme,
  }

  const storyCardsExport: StoryCardExport[] = storyCards.map(card => ({
    id: card.id,
    title: card.title,
    content: card.content,
    script: card.script,
    imageUrl: card.imageUrl,
    imagePrompt: card.imagePrompt,
    imageDescription: card.imageDescription,
    message: card.message,
    speaker: card.speaker,
    speakerType: card.speakerType,
    orderIndex: card.orderIndex,
  }))

  const choicesExport: ChoiceExport[] = choices.map(choice => ({
    id: choice.id,
    storyCardId: choice.storyCardId,
    label: choice.label,
    targetCardId: choice.targetCardId,
    orderIndex: choice.orderIndex,
  }))

  const charactersExport: CharacterExport[] = characters.map(char => ({
    id: char.id,
    name: char.name,
    appearance: char.appearance,
    imageUrls: char.imageUrls,
    imagePrompts: char.imagePrompts,
    avatarUrl: char.avatarUrl,
    avatarPrompt: char.avatarPrompt,
    orderIndex: char.orderIndex,
  }))

  const characterCardsExport: CharacterCardExport[] = characterCards.map(card => ({
    id: card.id,
    characterId: card.characterId,
    title: card.title,
    content: card.content,
    imageIndex: card.imageIndex,
    showAvatar: card.showAvatar,
    orderIndex: card.orderIndex,
  }))

  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    metadata: {
      exportedBy,
      originalStackId: storyStack.id,
      totalCards: storyCards.length,
      totalChoices: choices.length,
      totalCharacters: characters.length,
      totalCharacterCards: characterCards.length,
    },
    storyStack: storyStackExport,
    storyCards: storyCardsExport,
    choices: choicesExport,
    characters: charactersExport,
    characterCards: characterCardsExport,
  }
}

/**
 * Validate an imported story graph JSON
 */
export function validateImport(data: unknown): ImportValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Invalid data: expected an object'], warnings: [] }
  }

  const exportData = data as Record<string, unknown>

  // Check schema version
  if (!exportData.schemaVersion) {
    errors.push('Missing schemaVersion field')
  } else if (typeof exportData.schemaVersion !== 'string') {
    errors.push('schemaVersion must be a string')
  } else {
    const [major] = exportData.schemaVersion.split('.')
    const [currentMajor] = EXPORT_SCHEMA_VERSION.split('.')
    if (major !== currentMajor) {
      errors.push(`Incompatible schema version: ${exportData.schemaVersion} (current: ${EXPORT_SCHEMA_VERSION})`)
    }
  }

  // Check required fields
  if (!exportData.storyStack || typeof exportData.storyStack !== 'object') {
    errors.push('Missing or invalid storyStack field')
  } else {
    const stack = exportData.storyStack as Record<string, unknown>
    if (!stack.name || typeof stack.name !== 'string') {
      errors.push('storyStack.name is required and must be a string')
    }
  }

  // Validate storyCards
  if (!Array.isArray(exportData.storyCards)) {
    errors.push('storyCards must be an array')
  } else {
    const cardIds = new Set<string>()
    exportData.storyCards.forEach((card: unknown, index: number) => {
      if (!card || typeof card !== 'object') {
        errors.push(`storyCards[${index}] must be an object`)
      } else {
        const c = card as Record<string, unknown>
        if (!c.id || typeof c.id !== 'string') {
          errors.push(`storyCards[${index}].id is required and must be a string`)
        } else {
          if (cardIds.has(c.id)) {
            errors.push(`Duplicate card id: ${c.id}`)
          }
          cardIds.add(c.id)
        }
        if (typeof c.title !== 'string') {
          errors.push(`storyCards[${index}].title must be a string`)
        }
      }
    })

    // Validate firstCardId reference
    const stack = exportData.storyStack as Record<string, unknown>
    if (stack?.firstCardId && typeof stack.firstCardId === 'string') {
      if (!cardIds.has(stack.firstCardId)) {
        errors.push(`firstCardId "${stack.firstCardId}" does not reference a valid card`)
      }
    }

    // Validate choices references
    if (Array.isArray(exportData.choices)) {
      exportData.choices.forEach((choice: unknown, index: number) => {
        if (choice && typeof choice === 'object') {
          const c = choice as Record<string, unknown>
          if (typeof c.storyCardId === 'string' && !cardIds.has(c.storyCardId)) {
            errors.push(`choices[${index}].storyCardId "${c.storyCardId}" does not reference a valid card`)
          }
          if (typeof c.targetCardId === 'string' && !cardIds.has(c.targetCardId)) {
            errors.push(`choices[${index}].targetCardId "${c.targetCardId}" does not reference a valid card`)
          }
        }
      })
    }
  }

  // Validate choices
  if (!Array.isArray(exportData.choices)) {
    errors.push('choices must be an array')
  } else {
    exportData.choices.forEach((choice: unknown, index: number) => {
      if (!choice || typeof choice !== 'object') {
        errors.push(`choices[${index}] must be an object`)
      } else {
        const c = choice as Record<string, unknown>
        if (!c.id || typeof c.id !== 'string') {
          errors.push(`choices[${index}].id is required and must be a string`)
        }
        if (!c.label || typeof c.label !== 'string') {
          errors.push(`choices[${index}].label is required and must be a string`)
        }
      }
    })
  }

  // Validate characters
  if (!Array.isArray(exportData.characters)) {
    if (exportData.characters !== undefined) {
      errors.push('characters must be an array if provided')
    }
  } else {
    const characterIds = new Set<string>()
    exportData.characters.forEach((char: unknown, index: number) => {
      if (!char || typeof char !== 'object') {
        errors.push(`characters[${index}] must be an object`)
      } else {
        const c = char as Record<string, unknown>
        if (!c.id || typeof c.id !== 'string') {
          errors.push(`characters[${index}].id is required and must be a string`)
        } else {
          characterIds.add(c.id)
        }
        if (!c.name || typeof c.name !== 'string') {
          errors.push(`characters[${index}].name is required and must be a string`)
        }
      }
    })

    // Validate characterCards references
    if (Array.isArray(exportData.characterCards)) {
      exportData.characterCards.forEach((card: unknown, index: number) => {
        if (card && typeof card === 'object') {
          const c = card as Record<string, unknown>
          if (typeof c.characterId === 'string' && !characterIds.has(c.characterId)) {
            errors.push(`characterCards[${index}].characterId "${c.characterId}" does not reference a valid character`)
          }
        }
      })
    }
  }

  // Validate characterCards
  if (!Array.isArray(exportData.characterCards)) {
    if (exportData.characterCards !== undefined) {
      errors.push('characterCards must be an array if provided')
    }
  }

  // Add warnings for missing optional data
  if (exportData.storyCards && Array.isArray(exportData.storyCards)) {
    const cardsWithoutImages = exportData.storyCards.filter((c: unknown) => {
      if (!c || typeof c !== 'object') return false
      const card = c as Record<string, unknown>
      return !card.imageUrl
    })
    if (cardsWithoutImages.length > 0) {
      warnings.push(`${cardsWithoutImages.length} card(s) have no images`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Download the export as a JSON file
 */
export function downloadExport(exportData: StoryGraphExport, filename?: string): void {
  const json = JSON.stringify(exportData, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `${exportData.storyStack.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Read a JSON file and parse it as a story graph export
 */
export function parseExportFile(content: string): { data: StoryGraphExport | null; error: string | null } {
  try {
    const data = JSON.parse(content)
    return { data: data as StoryGraphExport, error: null }
  } catch (e) {
    return { data: null, error: `Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}` }
  }
}
