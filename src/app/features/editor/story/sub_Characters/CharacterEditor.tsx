'use client'

import { useState, useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { User, ImageIcon, Sparkles, Eye } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/lib/context/ToastContext'
import { Character } from '@/lib/types'
import { PreviewSection } from './components/PreviewSection'
import { ImageGeneratorSection } from './components/ImageGeneratorSection'
import { AvatarGeneratorSection } from './components/AvatarGeneratorSection'

export default function CharacterEditor() {
  const { currentCharacter, storyStack, updateCharacter } = useEditor()
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

  // Empty state - no character selected
  if (!currentCharacter) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <User className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Character Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a character from the list or create a new one to start editing
          </p>
        </div>
      </div>
    )
  }

  if (!storyStack) {
    return null
  }

  return (
    <div className="h-full overflow-hidden flex flex-col bg-muted">
      {/* Character Header */}
      <div className="flex-shrink-0 p-3 sm:p-4 border-b border-border bg-card">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          {/* Avatar thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-border bg-muted flex-shrink-0">
            {currentCharacter.avatarUrl ? (
              <img
                src={currentCharacter.avatarUrl}
                alt={currentCharacter.name}
                className="w-full h-full object-cover"
              />
            ) : currentCharacter.imageUrls && currentCharacter.imageUrls.length > 0 ? (
              <img
                src={currentCharacter.imageUrls[0]}
                alt={currentCharacter.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground/50" />
              </div>
            )}
          </div>

          {/* Character info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {currentCharacter.name || 'Unnamed Character'}
            </h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {currentCharacter.imageUrls?.length || 0}/4 images
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {currentCharacter.avatarUrl ? 'Avatar set' : 'No avatar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="flex-shrink-0 w-full max-w-3xl mx-auto p-3 sm:p-4 bg-transparent justify-start gap-2">
          <TabsTrigger
            value="preview"
            className="flex items-center gap-2 px-4 data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="flex items-center gap-2 px-4 data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          >
            <ImageIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Image Generator</span>
          </TabsTrigger>
          <TabsTrigger
            value="avatar"
            className="flex items-center gap-2 px-4 data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Avatar Generator</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-3 sm:p-4 md:p-6">
            <TabsContent value="preview" className="mt-0">
              <PreviewSection
                character={currentCharacter}
                storyStackId={storyStack.id}
                isSaving={isSaving}
                onUpdateCharacter={handleUpdateCharacter}
              />
            </TabsContent>

            <TabsContent value="images" className="mt-0">
              <ImageGeneratorSection
                character={currentCharacter}
                storyStackId={storyStack.id}
                isSaving={isSaving}
                onAddImage={handleAddImage}
                onRemoveImage={handleRemoveImage}
              />
            </TabsContent>

            <TabsContent value="avatar" className="mt-0">
              <AvatarGeneratorSection
                character={currentCharacter}
                storyStackId={storyStack.id}
                isSaving={isSaving}
                onSetAvatar={handleSetAvatar}
                onRemoveAvatar={handleRemoveAvatar}
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
