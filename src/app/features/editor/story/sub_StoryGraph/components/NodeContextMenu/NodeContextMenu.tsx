'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { StoryCard } from '@/lib/types'
import { getEffectiveArtStylePrompt } from '../../../sub_Story/lib/artStyleService'

// Local imports
import { NodeContextMenuProps } from './lib/types'
import { useAudioGeneration } from './lib/useAudioGeneration'
import { useImageGeneration } from './lib/useImageGeneration'
import { useContentGeneration } from './lib/useContentGeneration'
import { CardPreviewHeader } from './CardPreviewHeader'
import { ActionBar } from './ActionBar'
import { SketchPicker } from './SketchPicker'
import { ContentEditor } from './ContentEditor'

// ============================================================================
// Main Component
// ============================================================================

export function NodeContextMenu({
  nodeId,
  card,
  position,
  isHalloween = false,
  onClose,
  onDelete,
}: NodeContextMenuProps) {
  const { storyStack, updateCard } = useEditor()
  const { error: showError } = useToast()
  const menuRef = useRef<HTMLDivElement>(null)

  const storyStackId = storyStack?.id || ''
  const artStylePrompt = storyStack ? getEffectiveArtStylePrompt(storyStack) : ''

  // Handle card updates
  const handleUpdate = useCallback(
    (updates: Partial<StoryCard>) => {
      updateCard(card.id, updates)

      // Save to database
      fetch(`/api/stories/${storyStackId}/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }).catch((err) => {
        console.error('Failed to save:', err)
        showError('Failed to save changes')
      })
    },
    [card.id, storyStackId, updateCard, showError]
  )

  // Hooks for each action
  const audio = useAudioGeneration(card, storyStackId, handleUpdate)
  const image = useImageGeneration(card, storyStackId, artStylePrompt, handleUpdate)
  const content = useContentGeneration(card, storyStackId, handleUpdate)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Calculate position to keep menu in viewport
  const [menuPosition, setMenuPosition] = useState(position)

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = position.x
      let y = position.y

      // Keep within viewport bounds
      if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20
      }
      if (y + rect.height > viewportHeight - 20) {
        y = viewportHeight - rect.height - 20
      }

      setMenuPosition({ x: Math.max(20, x), y: Math.max(20, y) })
    }
  }, [position])

  // Check for any errors
  const hasError = audio.error || image.error || content.error

  const menuContent = (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-[9999] w-[600px] rounded-xl shadow-2xl overflow-hidden',
        'border-2 backdrop-blur-sm',
        isHalloween
          ? 'bg-purple-950/95 border-purple-500/50'
          : 'bg-card/98 border-border'
      )}
      style={{
        left: menuPosition.x,
        top: menuPosition.y,
      }}
      data-testid="node-context-menu"
    >
      {/* Card Preview Header with Image */}
      <CardPreviewHeader card={card} isHalloween={isHalloween} />

      {/* Action Bar - Icon Buttons Row */}
      <ActionBar
        hasContent={content.hasContent}
        contentState={content.state}
        onGenerateContent={content.generate}
        onEditContent={content.startEditing}
        hasImage={image.hasImage}
        imageState={image.state}
        canGenerateImage={image.hasContent}
        onGenerateImage={image.generate}
        hasAudio={audio.hasAudio}
        audioState={audio.state}
        canGenerateAudio={audio.hasContent}
        onGenerateAudio={audio.generate}
        isPlaying={audio.isPlaying}
        isLoadingAudio={audio.isLoadingAudio}
        onTogglePlayback={audio.togglePlayback}
        isHalloween={isHalloween}
      />

      {/* Content Editor (shown when editing) */}
      {content.isEditing && (
        <div className="px-4 pb-3">
          <ContentEditor
            content={content.editContent}
            onChange={content.setEditContent}
            onSave={content.saveEdit}
            onCancel={content.cancelEdit}
            isSaving={content.state === 'loading'}
            isHalloween={isHalloween}
          />
        </div>
      )}

      {/* Sketch Picker (shown when sketches available) */}
      {image.sketches.length > 0 && (
        <div className="px-4 pb-3">
          <SketchPicker
            sketches={image.sketches}
            selectedIndex={image.selectedIndex}
            onSelect={image.selectSketch}
            onApply={image.applySketch}
            onCancel={image.cancelSketches}
            isHalloween={isHalloween}
          />
        </div>
      )}

      {/* Error Messages */}
      {hasError && (
        <div className="px-4 pb-3">
          <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-destructive">
              {audio.error || image.error || content.error}
            </p>
          </div>
        </div>
      )}

      {/* Footer with Delete/Close */}
      <div
        className={cn(
          'px-4 py-3 border-t flex items-center gap-2',
          isHalloween ? 'border-purple-500/30 bg-purple-950/50' : 'border-border bg-muted/30'
        )}
      >
        <button
          onClick={onDelete}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30'
          )}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
        <button
          onClick={onClose}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
            isHalloween
              ? 'bg-purple-800/50 text-purple-200 hover:bg-purple-700/50 border border-purple-500/30'
              : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border'
          )}
        >
          <X className="w-4 h-4" />
          Close
        </button>
      </div>
    </div>
  )

  // Render via portal to escape ReactFlow's transform
  return createPortal(menuContent, document.body)
}
