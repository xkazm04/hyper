'use client'

import { EditableField } from './EditableField'
import { AudioNarrationPanel } from './AudioNarrationPanel'
import { FileText } from 'lucide-react'

interface ContentEditorViewModeProps {
  title: string
  content: string
  isSaving: boolean
  isGenerating: boolean
  onTitleSave: (value: string) => void | Promise<void>
  onContentSave: (value: string) => void | Promise<void>
  /** Story stack ID for audio storage */
  storyStackId?: string
  /** Card ID for audio storage */
  cardId?: string
  /** Current audio URL */
  audioUrl?: string | null
  /** Callback when audio URL changes */
  onAudioUrlChange?: (url: string | null) => void
}

/**
 * ContentEditorViewMode - View-first card title and story content editor
 *
 * UX improvements:
 * - Clear visual hierarchy with section header
 * - Consistent spacing and typography
 * - Readable font sizes with good line height
 * - Subtle background for content area
 */
export function ContentEditorViewMode({
  title,
  content,
  isSaving,
  isGenerating,
  onTitleSave,
  onContentSave,
  storyStackId,
  cardId,
  audioUrl,
  onAudioUrlChange,
}: ContentEditorViewModeProps) {
  const isDisabled = isSaving || isGenerating

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-1 border-b border-border/50">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Story Content</h3>
      </div>

      {/* Title - larger, bolder for visual hierarchy */}
      <EditableField
        value={title}
        placeholder="Untitled Card"
        onSave={onTitleSave}
        isSaving={isSaving}
        disabled={isDisabled}
        type="text"
        viewClassName="text-lg font-semibold text-foreground tracking-tight"
        editClassName="text-lg font-semibold tracking-tight"
        label="Card Title"
        showLabelInView={true}
        testId="card-title"
      />

      {/* Content - optimized for readability */}
      <div>
        <EditableField
          value={content}
          placeholder="Write your story content here. Describe the scene, setting, and what happens..."
          onSave={onContentSave}
          isSaving={isSaving}
          disabled={isDisabled}
          type="textarea"
          viewClassName="text-[15px] leading-7 text-foreground/90 whitespace-pre-wrap font-normal"
          editClassName="text-[15px] leading-7 font-normal"
          minHeight="180px"
          label="Narrative"
          showLabelInView={true}
          testId="card-content"
        />

        {/* Audio Narration Panel - only shown when ElevenLabs is configured */}
        {storyStackId && cardId && onAudioUrlChange && (
          <AudioNarrationPanel
            content={content}
            storyStackId={storyStackId}
            cardId={cardId}
            audioUrl={audioUrl ?? null}
            onAudioUrlChange={onAudioUrlChange}
            disabled={isDisabled}
          />
        )}
      </div>
    </div>
  )
}
