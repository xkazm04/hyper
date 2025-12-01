'use client'

import { useCallback, useState } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { StoryService } from '@/lib/services/story'
import {
  exportStoryGraph,
  downloadExport,
  validateImport,
  parseExportFile,
  StoryGraphExport,
  ImportValidationResult,
} from '../lib/storyGraphExport'
import type { StoryCard, Choice, Character, CharacterCard } from '@/lib/types'

export interface UseStoryGraphExportResult {
  // Export
  handleExport: () => void
  isExporting: boolean

  // Import
  handleImportFile: (file: File) => Promise<void>
  handleImportToCurrentStack: () => Promise<void>
  isImporting: boolean
  importData: StoryGraphExport | null
  validationResult: ImportValidationResult | null
  clearImportData: () => void

  // Error handling
  error: string | null
  clearError: () => void
}

/**
 * Hook for exporting and importing story graphs
 */
export function useStoryGraphExport(): UseStoryGraphExportResult {
  const {
    storyStack,
    storyCards,
    choices,
    characters,
    characterCards,
    setStoryCards,
    setChoices,
    setCharacters,
    setCharacterCards,
    setCurrentCardId,
  } = useEditor()

  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importData, setImportData] = useState<StoryGraphExport | null>(null)
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Export the current story graph to a JSON file
   */
  const handleExport = useCallback(() => {
    if (!storyStack) {
      setError('No story stack to export')
      return
    }

    setIsExporting(true)
    setError(null)

    try {
      const exportData = exportStoryGraph(
        storyStack,
        storyCards,
        choices,
        characters,
        characterCards
      )

      downloadExport(exportData)
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setIsExporting(false)
    }
  }, [storyStack, storyCards, choices, characters, characterCards])

  /**
   * Handle file selection for import
   */
  const handleImportFile = useCallback(async (file: File) => {
    setIsImporting(true)
    setError(null)
    setImportData(null)
    setValidationResult(null)

    try {
      const content = await file.text()
      const { data, error: parseError } = parseExportFile(content)

      if (parseError || !data) {
        setError(parseError || 'Failed to parse import file')
        setIsImporting(false)
        return
      }

      const validation = validateImport(data)
      setValidationResult(validation)

      if (validation.isValid) {
        setImportData(data)
      } else {
        setError(`Validation failed:\n${validation.errors.join('\n')}`)
      }
    } catch (e) {
      setError(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setIsImporting(false)
    }
  }, [])

  /**
   * Import the validated data into the current story stack
   * This replaces the current graph while preserving the stack itself
   */
  const handleImportToCurrentStack = useCallback(async () => {
    if (!storyStack || !importData) {
      setError('No story stack or import data available')
      return
    }

    setIsImporting(true)
    setError(null)

    try {
      const storyService = new StoryService()

      // Create ID mapping for new entities
      const cardIdMap = new Map<string, string>()
      const characterIdMap = new Map<string, string>()

      // First, delete existing data (cards, choices, characters, characterCards)
      // Delete choices first (they depend on cards)
      for (const choice of choices) {
        await storyService.deleteChoice(choice.id)
      }

      // Delete character cards (they depend on characters)
      for (const charCard of characterCards) {
        await storyService.deleteCharacterCard(charCard.id)
      }

      // Delete characters
      for (const char of characters) {
        await storyService.deleteCharacter(char.id)
      }

      // Delete cards
      for (const card of storyCards) {
        await storyService.deleteStoryCard(card.id)
      }

      // Create new characters first (characterCards depend on them)
      const newCharacters: Character[] = []
      for (const charExport of importData.characters) {
        const created = await storyService.createCharacter({
          storyStackId: storyStack.id,
          name: charExport.name,
          appearance: charExport.appearance,
          imageUrls: charExport.imageUrls,
          imagePrompts: charExport.imagePrompts,
          avatarUrl: charExport.avatarUrl,
          avatarPrompt: charExport.avatarPrompt,
          orderIndex: charExport.orderIndex,
        })
        characterIdMap.set(charExport.id, created.id)
        newCharacters.push(created)
      }

      // Create new cards
      const newCards: StoryCard[] = []
      for (const cardExport of importData.storyCards) {
        const created = await storyService.createStoryCard({
          storyStackId: storyStack.id,
          title: cardExport.title,
          content: cardExport.content,
          script: cardExport.script,
          imageUrl: cardExport.imageUrl,
          imagePrompt: cardExport.imagePrompt,
          imageDescription: cardExport.imageDescription,
          message: cardExport.message,
          speaker: cardExport.speaker,
          speakerType: cardExport.speakerType,
          orderIndex: cardExport.orderIndex,
        })
        cardIdMap.set(cardExport.id, created.id)
        newCards.push(created)
      }

      // Create choices with mapped IDs
      const newChoices: Choice[] = []
      for (const choiceExport of importData.choices) {
        const mappedSourceId = cardIdMap.get(choiceExport.storyCardId)
        const mappedTargetId = cardIdMap.get(choiceExport.targetCardId)

        if (mappedSourceId && mappedTargetId) {
          const created = await storyService.createChoice({
            storyCardId: mappedSourceId,
            label: choiceExport.label,
            targetCardId: mappedTargetId,
            orderIndex: choiceExport.orderIndex,
          })
          newChoices.push(created)
        }
      }

      // Create character cards with mapped IDs
      const newCharacterCards: CharacterCard[] = []
      for (const charCardExport of importData.characterCards) {
        const mappedCharacterId = characterIdMap.get(charCardExport.characterId)

        if (mappedCharacterId) {
          const created = await storyService.createCharacterCard({
            storyStackId: storyStack.id,
            characterId: mappedCharacterId,
            title: charCardExport.title,
            content: charCardExport.content,
            imageIndex: charCardExport.imageIndex,
            showAvatar: charCardExport.showAvatar,
            orderIndex: charCardExport.orderIndex,
          })
          newCharacterCards.push(created)
        }
      }

      // Update firstCardId if needed
      if (importData.storyStack.firstCardId) {
        const mappedFirstCardId = cardIdMap.get(importData.storyStack.firstCardId)
        if (mappedFirstCardId) {
          await storyService.updateStoryStack(storyStack.id, {
            firstCardId: mappedFirstCardId,
          })
        }
      }

      // Update editor context with new data
      setStoryCards(newCards)
      setChoices(newChoices)
      setCharacters(newCharacters)
      setCharacterCards(newCharacterCards)

      // Set current card to first card if available
      const firstCardId = importData.storyStack.firstCardId
      if (firstCardId) {
        const mappedFirstCardId = cardIdMap.get(firstCardId)
        if (mappedFirstCardId) {
          setCurrentCardId(mappedFirstCardId)
        }
      } else if (newCards.length > 0) {
        setCurrentCardId(newCards[0].id)
      }

      // Clear import state
      setImportData(null)
      setValidationResult(null)
    } catch (e) {
      setError(`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    } finally {
      setIsImporting(false)
    }
  }, [
    storyStack,
    importData,
    choices,
    characterCards,
    characters,
    storyCards,
    setStoryCards,
    setChoices,
    setCharacters,
    setCharacterCards,
    setCurrentCardId,
  ])

  const clearImportData = useCallback(() => {
    setImportData(null)
    setValidationResult(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    handleExport,
    isExporting,
    handleImportFile,
    handleImportToCurrentStack,
    isImporting,
    importData,
    validationResult,
    clearImportData,
    error,
    clearError,
  }
}
