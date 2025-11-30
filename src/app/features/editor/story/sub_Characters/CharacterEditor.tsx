'use client'

import { useState, useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { Character, CreateCharacterCardInput } from '@/lib/types'
import {
  CharacterForm,
  CharacterHeader,
  CharacterCardsEmptyView,
} from './components/sub_CharacterEditor'

export default function CharacterEditor() {
  const {
    currentCharacter,
    storyStack,
    updateCharacter,
    characters,
    characterCards,
    setCurrentCharacterId,
    setCurrentCharacterCardId,
    addCharacterCard,
    deleteCharacterCard,
  } = useEditor()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('preview')
  const { success, error: showError } = useToast()

  /**
   * Generic update handler for character properties
   */
  const handleUpdateCharacter = useCallback(
    async (updates: Partial<Character>) => {
      if (!currentCharacter || !storyStack) return

      setIsSaving(true)
      try {
        const response = await fetch(
          `/api/stories/${storyStack.id}/characters/${currentCharacter.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to update character')
        }

        const data = await response.json()
        updateCharacter(currentCharacter.id, data.character)
      } catch (error) {
        console.error('Error updating character:', error)
        showError(error instanceof Error ? error.message : 'Failed to update character')
        throw error
      } finally {
        setIsSaving(false)
      }
    },
    [currentCharacter, storyStack, updateCharacter, showError]
  )

  /**
   * Add a new image to the character's imageUrls array
   */
  const handleAddImage = useCallback(
    async (imageUrl: string, prompt: string) => {
      if (!currentCharacter) return

      const currentUrls = currentCharacter.imageUrls || []
      const currentPrompts = currentCharacter.imagePrompts || []

      if (currentUrls.length >= 4) {
        showError('Maximum of 4 images allowed')
        return
      }

      await handleUpdateCharacter({
        imageUrls: [...currentUrls, imageUrl],
        imagePrompts: [...currentPrompts, prompt],
      })

      success('Image added to character')
    },
    [currentCharacter, handleUpdateCharacter, success, showError]
  )

  /**
   * Remove an image from the character's imageUrls array
   */
  const handleRemoveImage = useCallback(
    async (index: number) => {
      if (!currentCharacter) return

      const currentUrls = [...(currentCharacter.imageUrls || [])]
      const currentPrompts = [...(currentCharacter.imagePrompts || [])]

      currentUrls.splice(index, 1)
      currentPrompts.splice(index, 1)

      await handleUpdateCharacter({
        imageUrls: currentUrls,
        imagePrompts: currentPrompts,
      })

      success('Image removed')
    },
    [currentCharacter, handleUpdateCharacter, success]
  )

  /**
   * Set the character's avatar
   */
  const handleSetAvatar = useCallback(
    async (avatarUrl: string, prompt: string) => {
      await handleUpdateCharacter({
        avatarUrl,
        avatarPrompt: prompt,
      })

      success('Avatar set successfully')
    },
    [handleUpdateCharacter, success]
  )

  /**
   * Remove the character's avatar
   */
  const handleRemoveAvatar = useCallback(async () => {
    await handleUpdateCharacter({
      avatarUrl: null,
      avatarPrompt: null,
    })

    success('Avatar removed')
  }, [handleUpdateCharacter, success])

  /**
   * Create a new character card
   */
  const handleCreateCharacterCard = useCallback(
    async (input: CreateCharacterCardInput) => {
      if (!storyStack) return

      try {
        const response = await fetch(`/api/stories/${storyStack.id}/character-cards`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!response.ok) {
          throw new Error('Failed to create character card')
        }

        const data = await response.json()
        addCharacterCard(data.characterCard)
        success('Character card created')
      } catch (error) {
        console.error('Error creating character card:', error)
        showError(error instanceof Error ? error.message : 'Failed to create character card')
        throw error
      }
    },
    [storyStack, addCharacterCard, success, showError]
  )

  /**
   * Delete a character card
   */
  const handleDeleteCharacterCard = useCallback(
    async (cardId: string) => {
      if (!storyStack) return

      try {
        const response = await fetch(`/api/stories/${storyStack.id}/character-cards/${cardId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete character card')
        }

        deleteCharacterCard(cardId)
        success('Character card deleted')
      } catch (error) {
        console.error('Error deleting character card:', error)
        showError(error instanceof Error ? error.message : 'Failed to delete character card')
        throw error
      }
    },
    [storyStack, deleteCharacterCard, success, showError]
  )

  // No story stack loaded yet
  if (!storyStack) {
    return null
  }

  // Empty state - no character selected, show character cards list
  if (!currentCharacter) {
    return (
      <CharacterCardsEmptyView
        storyStackId={storyStack.id}
        characters={characters}
        characterCards={characterCards}
        onCardSelect={setCurrentCharacterCardId}
        onCharacterSelect={setCurrentCharacterId}
        onCreateCard={handleCreateCharacterCard}
        onDeleteCard={handleDeleteCharacterCard}
      />
    )
  }

  return (
    <section
      className="h-full overflow-hidden flex flex-col bg-muted"
      aria-label="Character Editor"
      data-testid="character-editor"
    >
      {/* Character Header */}
      <CharacterHeader character={currentCharacter} />

      {/* Character Form with Tabs */}
      <CharacterForm
        character={currentCharacter}
        storyStack={storyStack}
        activeTab={activeTab}
        isSaving={isSaving}
        onTabChange={setActiveTab}
        onUpdateCharacter={handleUpdateCharacter}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        onSetAvatar={handleSetAvatar}
        onRemoveAvatar={handleRemoveAvatar}
      />
    </section>
  )
}
