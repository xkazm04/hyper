'use client'

import { useState, useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { Character } from '@/lib/types'
import {
  CharacterForm,
  CharacterHeader,
  CharacterCardsEmptyView,
} from './components/sub_CharacterEditor'

export default function CharacterEditor() {
  const {
    currentCharacter,
    currentCharacterId,
    storyStack,
    updateCharacter,
    characters,
    setCurrentCharacterId,
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

      if (currentUrls.length >= 10) {
        showError('Maximum of 10 images allowed')
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

  // No story stack loaded yet
  if (!storyStack) {
    return null
  }

  // Empty state - no character selected, show character avatar grid
  if (!currentCharacter) {
    return (
      <CharacterCardsEmptyView
        characters={characters}
        selectedCharacterId={currentCharacterId}
        onCharacterSelect={setCurrentCharacterId}
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
