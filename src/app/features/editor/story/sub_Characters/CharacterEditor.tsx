'use client'

import React, { useState, useCallback, useRef } from 'react'
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
   * Track pending image additions to handle concurrent calls properly.
   * This ensures that when multiple images are added rapidly (e.g., from random poses),
   * each addition builds on top of the previous one instead of overriding.
   *
   * We also track the "known" image URLs that have been submitted but not yet
   * reflected in currentCharacter state to avoid race conditions.
   */
  const pendingImagesRef = useRef<{ urls: string[]; prompts: string[] }>({ urls: [], prompts: [] })
  const knownImageUrlsRef = useRef<string[]>([])
  const isAddingRef = useRef(false)

  // Keep knownImageUrlsRef in sync when currentCharacter changes
  React.useEffect(() => {
    if (currentCharacter?.imageUrls) {
      knownImageUrlsRef.current = [...currentCharacter.imageUrls]
    }
  }, [currentCharacter?.imageUrls])

  /**
   * Add a new image to the character's imageUrls array
   * Handles concurrent calls by queuing images and batching the final update
   */
  const handleAddImage = useCallback(
    async (imageUrl: string, prompt: string) => {
      if (!currentCharacter || !storyStack) return

      // Add to pending queue
      pendingImagesRef.current.urls.push(imageUrl)
      pendingImagesRef.current.prompts.push(prompt)

      // If already processing, let the current process handle it
      if (isAddingRef.current) return

      isAddingRef.current = true

      // Small delay to batch rapid additions
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        // Get all pending images
        const pendingUrls = [...pendingImagesRef.current.urls]
        const pendingPrompts = [...pendingImagesRef.current.prompts]

        // Clear pending queue
        pendingImagesRef.current = { urls: [], prompts: [] }

        if (pendingUrls.length === 0) return

        // Use knownImageUrlsRef which tracks all submitted URLs (not just those in state)
        const baseUrls = [...knownImageUrlsRef.current]
        const basePrompts = [...(currentCharacter.imagePrompts || [])]

        // Calculate how many we can add
        const availableSlots = 10 - baseUrls.length
        if (availableSlots <= 0) {
          showError('Maximum of 10 images allowed')
          return
        }

        // Only add up to available slots
        const urlsToAdd = pendingUrls.slice(0, availableSlots)
        const promptsToAdd = pendingPrompts.slice(0, availableSlots)

        if (urlsToAdd.length === 0) return

        // Update knownImageUrlsRef BEFORE the API call to prevent race conditions
        const newUrls = [...baseUrls, ...urlsToAdd]
        const newPrompts = [...basePrompts, ...promptsToAdd]
        knownImageUrlsRef.current = newUrls

        // Make the API call directly to avoid stale closure issues
        const response = await fetch(
          `/api/stories/${storyStack.id}/characters/${currentCharacter.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageUrls: newUrls,
              imagePrompts: newPrompts,
            }),
          }
        )

        if (!response.ok) {
          // Rollback knownImageUrlsRef on failure
          knownImageUrlsRef.current = baseUrls
          throw new Error('Failed to update character')
        }

        const data = await response.json()
        updateCharacter(currentCharacter.id, data.character)

        const addedCount = urlsToAdd.length
        success(addedCount === 1 ? 'Image added to character' : `${addedCount} images added to character`)

        // If some images couldn't be added due to limit
        if (pendingUrls.length > availableSlots) {
          showError(`${pendingUrls.length - availableSlots} image(s) not added - maximum of 10 reached`)
        }
      } catch (error) {
        console.error('Error adding images:', error)
        showError(error instanceof Error ? error.message : 'Failed to add images')
      } finally {
        isAddingRef.current = false
      }
    },
    [currentCharacter, storyStack, updateCharacter, success, showError]
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
