'use client'

import { StoryCard } from '@/lib/types'
import { ContentEditor, ContentToolbar, useContentSection } from './sub_ContentSection'

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
  cardId, storyStackId, initialTitle, initialContent, initialMessage, initialSpeaker, currentCard,
}: ContentSectionProps) {
  const {
    title, content, message, speaker, isSaving, isGenerating, hasContext, isLoadingContext, characters,
    handleTitleChange, handleContentChange, handleMessageChange, handleSpeakerChange,
    saveTitle, saveContent, saveMessage, saveSpeaker, handleGenerateContent,
  } = useContentSection({ cardId, storyStackId, initialTitle, initialContent, initialMessage, initialSpeaker, currentCard })

  return (
    <div className="space-y-8">
      <ContentEditor
        title={title}
        content={content}
        isSaving={isSaving}
        isGenerating={isGenerating}
        hasContext={hasContext}
        isLoadingContext={isLoadingContext}
        onTitleChange={handleTitleChange}
        onTitleBlur={saveTitle}
        onContentChange={handleContentChange}
        onContentBlur={saveContent}
        onGenerateContent={handleGenerateContent}
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
    </div>
  )
}
