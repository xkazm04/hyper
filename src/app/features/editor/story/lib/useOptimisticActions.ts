'use client'

import { useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { StoryCard, Choice, Character, CharacterCard } from '@/lib/types'
import { StoryService } from '@/lib/services/story/index'

/**
 * Hook that provides optimistic update actions with automatic rollback on API failure.
 *
 * Usage:
 * ```tsx
 * const { addCardOptimistic, deleteCardOptimistic } = useOptimisticActions()
 *
 * // Add a card optimistically - UI updates immediately, rolls back if API fails
 * await addCardOptimistic(newCard)
 * ```
 */
export function useOptimisticActions() {
  const {
    storyStack,
    storyCards,
    choices,
    characters,
    characterCards,
    addCard,
    updateCard,
    deleteCard,
    addChoice,
    updateChoice,
    deleteChoice,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    addCharacterCard,
    updateCharacterCard,
    deleteCharacterCard,
    startOperation,
    completeOperation,
    failOperation,
    getSnapshot,
    applySnapshot,
  } = useEditor()

  const storyService = new StoryService()

  // ============================================================================
  // Card Operations
  // ============================================================================

  /**
   * Add a card optimistically. The card is added to the UI immediately,
   * and the API call is made in the background. If the API call fails,
   * the card is removed from the UI.
   */
  const addCardOptimistic = useCallback(async (
    card: StoryCard
  ): Promise<StoryCard> => {
    const operationId = startOperation(card.id, 'add_card')
    const snapshot = getSnapshot()

    // Optimistically add the card to UI
    addCard(card)

    try {
      // Make the actual API call
      const savedCard = await storyService.createStoryCard({
        storyStackId: card.storyStackId,
        title: card.title,
        content: card.content ?? '',
        orderIndex: card.orderIndex,
        imageUrl: card.imageUrl ?? undefined,
        imagePrompt: card.imagePrompt ?? undefined,
      })

      // Update the card with the server response (in case IDs or timestamps differ)
      updateCard(card.id, savedCard)
      completeOperation(operationId)
      return savedCard
    } catch (error) {
      // Rollback the optimistic update
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to create card')
      throw error
    }
  }, [storyService, startOperation, getSnapshot, addCard, updateCard, completeOperation, applySnapshot, failOperation])

  /**
   * Update a card optimistically.
   */
  const updateCardOptimistic = useCallback(async (
    cardId: string,
    updates: Partial<StoryCard>
  ): Promise<StoryCard> => {
    const operationId = startOperation(cardId, 'update_card')
    const snapshot = getSnapshot()

    // Get the current card for fallback
    const currentCard = storyCards.find(c => c.id === cardId)
    if (!currentCard) {
      failOperation(operationId, 'Card not found')
      throw new Error('Card not found')
    }

    // Optimistically update the card
    updateCard(cardId, updates)

    try {
      const savedCard = await storyService.updateStoryCard(cardId, updates)
      completeOperation(operationId)
      return savedCard
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to update card')
      throw error
    }
  }, [storyService, storyCards, startOperation, getSnapshot, updateCard, completeOperation, applySnapshot, failOperation])

  /**
   * Delete a card optimistically.
   */
  const deleteCardOptimistic = useCallback(async (
    cardId: string
  ): Promise<void> => {
    const operationId = startOperation(cardId, 'delete_card')
    const snapshot = getSnapshot()

    // Optimistically delete the card
    deleteCard(cardId)

    // Also delete any choices that reference this card
    const affectedChoices = choices.filter(
      c => c.storyCardId === cardId || c.targetCardId === cardId
    )
    affectedChoices.forEach(choice => deleteChoice(choice.id))

    try {
      await storyService.deleteStoryCard(cardId)
      completeOperation(operationId)
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to delete card')
      throw error
    }
  }, [storyService, choices, startOperation, getSnapshot, deleteCard, deleteChoice, completeOperation, applySnapshot, failOperation])

  // ============================================================================
  // Choice Operations
  // ============================================================================

  /**
   * Add a choice optimistically.
   */
  const addChoiceOptimistic = useCallback(async (
    choice: Choice
  ): Promise<Choice> => {
    const operationId = startOperation(choice.id, 'add_choice')
    const snapshot = getSnapshot()

    // Optimistically add the choice
    addChoice(choice)

    try {
      const savedChoice = await storyService.createChoice({
        storyCardId: choice.storyCardId,
        targetCardId: choice.targetCardId ?? undefined,
        label: choice.label,
        orderIndex: choice.orderIndex,
      })

      // Update with server response
      updateChoice(choice.id, savedChoice)
      completeOperation(operationId)
      return savedChoice
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to create choice')
      throw error
    }
  }, [storyService, startOperation, getSnapshot, addChoice, updateChoice, completeOperation, applySnapshot, failOperation])

  /**
   * Update a choice optimistically.
   */
  const updateChoiceOptimistic = useCallback(async (
    choiceId: string,
    updates: Partial<Choice>
  ): Promise<Choice> => {
    const operationId = startOperation(choiceId, 'update_choice')
    const snapshot = getSnapshot()

    const currentChoice = choices.find(c => c.id === choiceId)
    if (!currentChoice) {
      failOperation(operationId, 'Choice not found')
      throw new Error('Choice not found')
    }

    // Optimistically update
    updateChoice(choiceId, updates)

    try {
      const savedChoice = await storyService.updateChoice(choiceId, updates)
      completeOperation(operationId)
      return savedChoice
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to update choice')
      throw error
    }
  }, [storyService, choices, startOperation, getSnapshot, updateChoice, completeOperation, applySnapshot, failOperation])

  /**
   * Delete a choice optimistically.
   */
  const deleteChoiceOptimistic = useCallback(async (
    choiceId: string
  ): Promise<void> => {
    const operationId = startOperation(choiceId, 'delete_choice')
    const snapshot = getSnapshot()

    // Optimistically delete
    deleteChoice(choiceId)

    try {
      await storyService.deleteChoice(choiceId)
      completeOperation(operationId)
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to delete choice')
      throw error
    }
  }, [storyService, startOperation, getSnapshot, deleteChoice, completeOperation, applySnapshot, failOperation])

  // ============================================================================
  // Character Operations
  // ============================================================================

  /**
   * Add a character optimistically.
   */
  const addCharacterOptimistic = useCallback(async (
    character: Character
  ): Promise<Character> => {
    const operationId = startOperation(character.id, 'add_character')
    const snapshot = getSnapshot()

    // Optimistically add
    addCharacter(character)

    try {
      const savedCharacter = await storyService.createCharacter({
        storyStackId: character.storyStackId,
        name: character.name,
        appearance: character.appearance ?? undefined,
        imageUrls: character.imageUrls ?? undefined,
        imagePrompts: character.imagePrompts ?? undefined,
        avatarUrl: character.avatarUrl ?? undefined,
      })

      updateCharacter(character.id, savedCharacter)
      completeOperation(operationId)
      return savedCharacter
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to create character')
      throw error
    }
  }, [storyService, startOperation, getSnapshot, addCharacter, updateCharacter, completeOperation, applySnapshot, failOperation])

  /**
   * Update a character optimistically.
   */
  const updateCharacterOptimistic = useCallback(async (
    characterId: string,
    updates: Partial<Character>
  ): Promise<Character> => {
    const operationId = startOperation(characterId, 'update_character')
    const snapshot = getSnapshot()

    const currentCharacter = characters.find(c => c.id === characterId)
    if (!currentCharacter) {
      failOperation(operationId, 'Character not found')
      throw new Error('Character not found')
    }

    // Optimistically update
    updateCharacter(characterId, updates)

    try {
      const savedCharacter = await storyService.updateCharacter(characterId, updates)
      completeOperation(operationId)
      return savedCharacter
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to update character')
      throw error
    }
  }, [storyService, characters, startOperation, getSnapshot, updateCharacter, completeOperation, applySnapshot, failOperation])

  /**
   * Delete a character optimistically.
   */
  const deleteCharacterOptimistic = useCallback(async (
    characterId: string
  ): Promise<void> => {
    const operationId = startOperation(characterId, 'delete_character')
    const snapshot = getSnapshot()

    // Also delete associated character cards
    const affectedCards = characterCards.filter(cc => cc.characterId === characterId)
    affectedCards.forEach(cc => deleteCharacterCard(cc.id))

    // Optimistically delete
    deleteCharacter(characterId)

    try {
      await storyService.deleteCharacter(characterId)
      completeOperation(operationId)
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to delete character')
      throw error
    }
  }, [storyService, characterCards, startOperation, getSnapshot, deleteCharacter, deleteCharacterCard, completeOperation, applySnapshot, failOperation])

  // ============================================================================
  // Character Card Operations
  // ============================================================================

  /**
   * Add a character card optimistically.
   */
  const addCharacterCardOptimistic = useCallback(async (
    characterCard: CharacterCard
  ): Promise<CharacterCard> => {
    const operationId = startOperation(characterCard.id, 'add_character_card')
    const snapshot = getSnapshot()

    // Optimistically add
    addCharacterCard(characterCard)

    try {
      const savedCard = await storyService.createCharacterCard({
        characterId: characterCard.characterId,
        storyStackId: characterCard.storyStackId,
        title: characterCard.title ?? undefined,
        content: characterCard.content ?? undefined,
        imageIndex: characterCard.imageIndex ?? undefined,
        showAvatar: characterCard.showAvatar ?? undefined,
      })

      updateCharacterCard(characterCard.id, savedCard)
      completeOperation(operationId)
      return savedCard
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to create character card')
      throw error
    }
  }, [storyService, startOperation, getSnapshot, addCharacterCard, updateCharacterCard, completeOperation, applySnapshot, failOperation])

  /**
   * Update a character card optimistically.
   */
  const updateCharacterCardOptimistic = useCallback(async (
    characterCardId: string,
    updates: Partial<CharacterCard>
  ): Promise<CharacterCard> => {
    const operationId = startOperation(characterCardId, 'update_character_card')
    const snapshot = getSnapshot()

    const currentCard = characterCards.find(c => c.id === characterCardId)
    if (!currentCard) {
      failOperation(operationId, 'Character card not found')
      throw new Error('Character card not found')
    }

    // Optimistically update
    updateCharacterCard(characterCardId, updates)

    try {
      const savedCard = await storyService.updateCharacterCard(characterCardId, updates)
      completeOperation(operationId)
      return savedCard
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to update character card')
      throw error
    }
  }, [storyService, characterCards, startOperation, getSnapshot, updateCharacterCard, completeOperation, applySnapshot, failOperation])

  /**
   * Delete a character card optimistically.
   */
  const deleteCharacterCardOptimistic = useCallback(async (
    characterCardId: string
  ): Promise<void> => {
    const operationId = startOperation(characterCardId, 'delete_character_card')
    const snapshot = getSnapshot()

    // Optimistically delete
    deleteCharacterCard(characterCardId)

    try {
      await storyService.deleteCharacterCard(characterCardId)
      completeOperation(operationId)
    } catch (error) {
      // Rollback
      applySnapshot(snapshot)
      failOperation(operationId, error instanceof Error ? error.message : 'Failed to delete character card')
      throw error
    }
  }, [storyService, startOperation, getSnapshot, deleteCharacterCard, completeOperation, applySnapshot, failOperation])

  return {
    // Card operations
    addCardOptimistic,
    updateCardOptimistic,
    deleteCardOptimistic,

    // Choice operations
    addChoiceOptimistic,
    updateChoiceOptimistic,
    deleteChoiceOptimistic,

    // Character operations
    addCharacterOptimistic,
    updateCharacterOptimistic,
    deleteCharacterOptimistic,

    // Character card operations
    addCharacterCardOptimistic,
    updateCharacterCardOptimistic,
    deleteCharacterCardOptimistic,
  }
}
