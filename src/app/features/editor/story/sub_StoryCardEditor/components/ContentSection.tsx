'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { StoryCard } from '@/lib/types'
import { ContentEditor } from './sub_ContentSection/ContentEditor'
import { ContentToolbar } from './sub_ContentSection/ContentToolbar'
import { SceneSketchPanel } from './sub_ContentSection/SceneSketchPanel'
import { ChoiceEditor } from '../../sub_ChoiceEditor'
import { useContentSection } from './sub_ContentSection/useContentSection'
import { updateCard, fetchCard, VersionConflictError } from '../lib/cardApi'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { SavedRibbon, useSavedRibbon } from './SavedRibbon'

interface ContentSectionProps {
  cardId: string
  storyStackId: string
  initialTitle: string
  initialContent: string
  initialMessage?: string | null
  initialSpeaker?: string | null
  availableCards?: StoryCard[]
  currentCard?: StoryCard
}

export function ContentSection({
  cardId, storyStackId, initialTitle, initialContent, initialMessage, initialSpeaker, availableCards, currentCard,
}: ContentSectionProps) {
  const { updateCard: updateCardContext } = useEditor()
  const { success, error: showError, warning: showWarning } = useToast()
  const [isImageSaving, setIsImageSaving] = useState(false)
  // Image description is separate from story content
  const [imageDescription, setImageDescription] = useState(currentCard?.imageDescription || '')

  // Track card version for optimistic concurrency control
  const versionRef = useRef<number>(currentCard?.version ?? 1)

  // Update version when card changes
  useEffect(() => {
    versionRef.current = currentCard?.version ?? 1
  }, [currentCard?.version])

  // Saved ribbon state
  const { showRibbon, isMuted, triggerRibbon, hideRibbon, toggleMute } = useSavedRibbon()

  const {
    title, content, message, speaker, isSaving, isGenerating, hasContext, isLoadingContext, characters, hasVersionConflict,
    handleTitleChange, handleContentChange, handleMessageChange, handleSpeakerChange,
    saveTitle, saveContent, saveMessage, saveSpeaker, handleGenerateContent,
  } = useContentSection({ cardId, storyStackId, initialTitle, initialContent, initialMessage, initialSpeaker, currentCard, onSaveComplete: triggerRibbon })

  // Handle version conflict by refreshing the card
  const handleVersionConflict = useCallback(async () => {
    showWarning('This card was modified in another tab. Refreshing to latest version...')
    try {
      const latestCard = await fetchCard(storyStackId, cardId)
      versionRef.current = latestCard.version
      updateCardContext(cardId, latestCard)
      setImageDescription(latestCard.imageDescription || '')
      success('Card refreshed to latest version')
    } catch (err) {
      showError('Failed to refresh card. Please reload the page.')
    }
  }, [storyStackId, cardId, updateCardContext, success, showError, showWarning])

  // Handle image selection from SceneSketchPanel
  const handleImageSelect = useCallback(async (imageUrl: string, prompt: string) => {
    setIsImageSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, {
        imageUrl,
        imagePrompt: prompt,
        version: versionRef.current,
      })
      versionRef.current = updated.version
      updateCardContext(cardId, updated)
      success('Scene image saved')
    } catch (err) {
      if (err instanceof VersionConflictError) {
        await handleVersionConflict()
      } else {
        showError(err instanceof Error ? err.message : 'Failed to save image')
      }
    } finally {
      setIsImageSaving(false)
    }
  }, [storyStackId, cardId, updateCardContext, success, showError, handleVersionConflict])

  // Handle image removal
  const handleRemoveImage = useCallback(async () => {
    setIsImageSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, {
        imageUrl: null,
        imagePrompt: null,
        version: versionRef.current,
      })
      versionRef.current = updated.version
      updateCardContext(cardId, updated)
      success('Image removed')
    } catch (err) {
      if (err instanceof VersionConflictError) {
        await handleVersionConflict()
      } else {
        showError(err instanceof Error ? err.message : 'Failed to remove image')
      }
    } finally {
      setIsImageSaving(false)
    }
  }, [storyStackId, cardId, updateCardContext, success, showError, handleVersionConflict])

  // Handle image description change (separate from story content)
  const handleImageDescriptionChange = useCallback(async (description: string) => {
    setImageDescription(description)
    // Auto-save image description to database
    try {
      const updated = await updateCard(storyStackId, cardId, { imageDescription: description, version: versionRef.current })
      versionRef.current = updated.version
      updateCardContext(cardId, updated)
    } catch (err) {
      if (err instanceof VersionConflictError) {
        await handleVersionConflict()
      } else {
        // Silent fail for auto-save, user can still use the description
        console.error('Failed to save image description:', err)
      }
    }
  }, [storyStackId, cardId, updateCardContext, handleVersionConflict])

  return (
    <div className="relative grid grid-cols-2 gap-6">
      {/* Saved Ribbon - positioned at top of card */}
      <SavedRibbon
        show={showRibbon}
        onHide={hideRibbon}
        muted={isMuted}
      />

      {/* Mute toggle for saved ribbon */}
      <button
        type="button"
        onClick={toggleMute}
        className="absolute top-0 right-0 z-40 p-1.5 text-xs text-muted-foreground hover:text-foreground
                   bg-muted/50 hover:bg-muted rounded-bl border-l border-b border-border
                   transition-colors duration-150"
        title={isMuted ? 'Enable save notifications' : 'Disable save notifications'}
        data-testid="saved-ribbon-mute-toggle"
        aria-label={isMuted ? 'Enable save notifications' : 'Disable save notifications'}
        aria-pressed={isMuted}
      >
        {isMuted ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>

      {/* Left Column - Content Editor */}
      <div className="space-y-6">
        <ContentEditor
          title={title}
          content={content}
          isSaving={isSaving}
          isGenerating={isGenerating}
          onTitleChange={handleTitleChange}
          onTitleBlur={saveTitle}
          onContentChange={handleContentChange}
          onContentBlur={saveContent}
        />

        <ContentToolbar
          message={message}
          speaker={speaker}
          characters={characters}
          isSaving={isSaving}
          isGenerating={isGenerating}
          onMessageChange={handleMessageChange}
          onMessageBlur={saveMessage}
          onSpeakerChange={handleSpeakerChange}
          onSpeakerBlur={saveSpeaker}
        />

        {/* Choices - Player decisions for this card */}
        <ChoiceEditor
          mode="integrated"
          storyStackId={storyStackId}
          cardId={cardId}
          availableCards={availableCards || []}
          currentCard={currentCard}
        />
      </div>

      {/* Right Column - Scene Sketch Panel */}
      <div>
        <div className="sticky top-4 p-4 bg-muted/30 rounded-lg border-2 border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Scene Image
          </h3>
          <SceneSketchPanel
            storyContent={content}
            imageUrl={currentCard?.imageUrl || null}
            imagePrompt={currentCard?.imagePrompt || null}
            imageDescription={imageDescription}
            onImageDescriptionChange={handleImageDescriptionChange}
            onImageSelect={handleImageSelect}
            onRemoveImage={handleRemoveImage}
            isSaving={isImageSaving}
          />
        </div>
      </div>
    </div>
  )
}
