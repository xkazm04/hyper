'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Type,
  FileText,
  ImageIcon,
  Volume2,
  Trash2,
  X,
  Loader2,
  Check,
  Sparkles,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { StoryCard } from '@/lib/types'
import {
  generateSketchesFromNarrative,
  cleanupUnusedSketches,
  type GeneratedSketch,
} from '../../sub_ContentSection/lib/sketchGeneration'
import { getEffectiveArtStylePrompt } from '../../sub_Story/lib/artStyleService'

// ============================================================================
// Types
// ============================================================================

export interface NodeContextMenuProps {
  nodeId: string
  card: StoryCard
  position: { x: number; y: number }
  isHalloween?: boolean
  onClose: () => void
  onDelete: () => void
}

type GenerationState = 'idle' | 'loading' | 'success' | 'error'

interface ActionState {
  audio: GenerationState
  image: GenerationState
  content: GenerationState
}

// ============================================================================
// Audio Hook
// ============================================================================

function useAudioGeneration(
  card: StoryCard,
  storyStackId: string,
  onUpdate: (updates: Partial<StoryCard>) => void
) {
  const [state, setState] = useState<GenerationState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const hasAudio = !!card.audioUrl
  const hasContent = !!(card.content && card.content.trim().length > 0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [])

  const generate = useCallback(async () => {
    if (!hasContent || state === 'loading') return

    setState('loading')
    setError(null)

    try {
      const response = await fetch('/api/ai/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: card.content,
          storyStackId,
          cardId: card.id,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio')
      }

      onUpdate({ audioUrl: data.audioUrl })
      setState('success')

      // Reset success state after 2s
      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio')
      setState('error')
    }
  }, [card.content, card.id, storyStackId, hasContent, state, onUpdate])

  const togglePlayback = useCallback(async () => {
    if (!card.audioUrl) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    setIsLoadingAudio(true)

    try {
      // Cleanup old audio
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }

      // Fetch and play
      const response = await fetch(card.audioUrl)
      if (!response.ok) throw new Error('Failed to fetch audio')

      const blob = await response.blob()
      const audioBlob = new Blob([blob], { type: 'audio/mpeg' })
      const blobUrl = URL.createObjectURL(audioBlob)
      blobUrlRef.current = blobUrl

      const audio = new Audio()
      audioRef.current = audio

      audio.onended = () => setIsPlaying(false)
      audio.onpause = () => setIsPlaying(false)
      audio.onplay = () => {
        setIsPlaying(true)
        setIsLoadingAudio(false)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setIsLoadingAudio(false)
      }

      audio.src = blobUrl
      await audio.play()
    } catch (err) {
      console.error('Audio playback error:', err)
      setIsLoadingAudio(false)
    }
  }, [card.audioUrl, isPlaying])

  return {
    state,
    error,
    hasAudio,
    hasContent,
    isPlaying,
    isLoadingAudio,
    generate,
    togglePlayback,
  }
}

// ============================================================================
// Image Hook
// ============================================================================

function useImageGeneration(
  card: StoryCard,
  storyStackId: string,
  artStylePrompt: string,
  onUpdate: (updates: Partial<StoryCard>) => void
) {
  const [state, setState] = useState<GenerationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sketches, setSketches] = useState<GeneratedSketch[]>([])
  const [generationIds, setGenerationIds] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const hasImage = !!card.imageUrl
  const hasContent = !!(card.content && card.content.trim().length > 20)

  const generate = useCallback(async () => {
    if (!hasContent || state === 'loading') return

    setState('loading')
    setError(null)
    setSketches([])
    setSelectedIndex(null)

    try {
      const result = await generateSketchesFromNarrative(card.content || '', {
        artStylePrompt,
        count: 3,
      })

      setSketches(result.sketches)
      setGenerationIds(result.generationIds)
      setState('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images')
      setState('error')
    }
  }, [card.content, hasContent, state, artStylePrompt])

  const selectSketch = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const applySketch = useCallback(async () => {
    if (selectedIndex === null || !sketches[selectedIndex]) return

    const sketch = sketches[selectedIndex]
    onUpdate({
      imageUrl: sketch.url,
      imagePrompt: sketch.prompt || null,
    })

    // Cleanup unused generations
    await cleanupUnusedSketches(generationIds, sketch.generationId)

    setSketches([])
    setGenerationIds([])
    setSelectedIndex(null)
    setState('success')

    setTimeout(() => setState('idle'), 2000)
  }, [selectedIndex, sketches, generationIds, onUpdate])

  const cancelSketches = useCallback(async () => {
    if (generationIds.length > 0) {
      await cleanupUnusedSketches(generationIds)
    }
    setSketches([])
    setGenerationIds([])
    setSelectedIndex(null)
  }, [generationIds])

  return {
    state,
    error,
    hasImage,
    hasContent,
    sketches,
    selectedIndex,
    generate,
    selectSketch,
    applySketch,
    cancelSketches,
  }
}

// ============================================================================
// Content Hook
// ============================================================================

function useContentGeneration(
  card: StoryCard,
  storyStackId: string,
  onUpdate: (updates: Partial<StoryCard>) => void
) {
  const [state, setState] = useState<GenerationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(card.content || '')

  const hasContent = !!(card.content && card.content.trim().length > 0)

  // Sync edit content when card changes
  useEffect(() => {
    setEditContent(card.content || '')
  }, [card.content])

  const generate = useCallback(async () => {
    if (state === 'loading') return

    setState('loading')
    setError(null)

    try {
      // Fetch predecessors/successors for context
      const [predResponse, succResponse] = await Promise.all([
        fetch(`/api/stories/${storyStackId}/cards/${card.id}/predecessors`),
        fetch(`/api/stories/${storyStackId}/cards/${card.id}/successors`),
      ])

      const predecessors = predResponse.ok ? (await predResponse.json()).predecessors || [] : []
      const successors = succResponse.ok ? (await succResponse.json()).successors || [] : []

      const response = await fetch('/api/ai/generate-card-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predecessors,
          successors,
          currentTitle: card.title,
          currentContent: card.content || '',
          currentMessage: card.message || '',
          currentSpeaker: card.speaker || '',
          existingChoices: [],
          characters: [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate content')
      }

      const data = await response.json()

      onUpdate({
        title: data.title,
        content: data.content,
        message: data.message || null,
        speaker: data.speaker || null,
      })

      setEditContent(data.content)
      setState('success')

      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content')
      setState('error')
    }
  }, [card, storyStackId, state, onUpdate])

  const startEditing = useCallback(() => {
    setIsEditing(true)
  }, [])

  const saveEdit = useCallback(async () => {
    if (editContent === card.content) {
      setIsEditing(false)
      return
    }

    setState('loading')

    try {
      const response = await fetch(`/api/stories/${storyStackId}/cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      })

      if (!response.ok) {
        throw new Error('Failed to save content')
      }

      onUpdate({ content: editContent })
      setIsEditing(false)
      setState('success')

      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setState('error')
    }
  }, [editContent, card.content, card.id, storyStackId, onUpdate])

  const cancelEdit = useCallback(() => {
    setEditContent(card.content || '')
    setIsEditing(false)
  }, [card.content])

  return {
    state,
    error,
    hasContent,
    isEditing,
    editContent,
    setEditContent,
    generate,
    startEditing,
    saveEdit,
    cancelEdit,
  }
}

// ============================================================================
// Action Button Component
// ============================================================================

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  done: boolean
  state: GenerationState
  isHalloween?: boolean
  disabled?: boolean
  onClick: () => void
  secondaryAction?: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    onClick: () => void
    loading?: boolean
  }
}

function ActionButton({
  icon: Icon,
  label,
  done,
  state,
  isHalloween,
  disabled,
  onClick,
  secondaryAction,
}: ActionButtonProps) {
  const isLoading = state === 'loading'
  const isSuccess = state === 'success'
  const isError = state === 'error'

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(
          'flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all w-full',
          'border-2 text-sm font-medium',
          done
            ? isHalloween
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
              : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600'
            : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted hover:text-foreground',
          isLoading && 'opacity-70 cursor-wait',
          isSuccess && 'bg-emerald-500/30 border-emerald-500',
          isError && 'bg-destructive/20 border-destructive/50 text-destructive'
        )}
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            done
              ? isHalloween
                ? 'bg-orange-500/30'
                : 'bg-emerald-500/30'
              : 'bg-muted'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isSuccess ? (
            <Check className="w-4 h-4 text-emerald-500" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 text-left">
          <span>{label}</span>
          {!done && !isLoading && (
            <span className="block text-xs opacity-60">Click to generate</span>
          )}
          {done && !isLoading && (
            <span className="block text-xs opacity-60">Click to regenerate</span>
          )}
        </div>
      </button>

      {secondaryAction && done && (
        <button
          onClick={secondaryAction.onClick}
          disabled={secondaryAction.loading}
          className={cn(
            'p-2.5 rounded-lg border-2 transition-all',
            isHalloween
              ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 hover:bg-orange-500/30'
              : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
          )}
          title={secondaryAction.label}
        >
          {secondaryAction.loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <secondaryAction.icon className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Sketch Picker Component
// ============================================================================

interface SketchPickerProps {
  sketches: GeneratedSketch[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  onApply: () => void
  onCancel: () => void
  isHalloween?: boolean
}

function SketchPicker({
  sketches,
  selectedIndex,
  onSelect,
  onApply,
  onCancel,
  isHalloween,
}: SketchPickerProps) {
  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Select a sketch</span>
        <button
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {sketches.map((sketch, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={cn(
              'relative aspect-video rounded-lg overflow-hidden border-2 transition-all',
              selectedIndex === index
                ? isHalloween
                  ? 'border-orange-500 ring-2 ring-orange-500/30'
                  : 'border-primary ring-2 ring-primary/30'
                : 'border-border hover:border-primary/50'
            )}
          >
            <img src={sketch.url} alt={`Sketch ${index + 1}`} className="w-full h-full object-cover" />
            {selectedIndex === index && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-primary-foreground drop-shadow-lg" />
              </div>
            )}
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <button
          onClick={onApply}
          className={cn(
            'w-full py-2 rounded-lg font-medium text-sm transition-all',
            isHalloween
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          <Check className="w-4 h-4 inline mr-2" />
          Use Selected Sketch
        </button>
      )}
    </div>
  )
}

// ============================================================================
// Content Editor Component
// ============================================================================

interface ContentEditorProps {
  content: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  isHalloween?: boolean
}

function ContentEditor({
  content,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isHalloween,
}: ContentEditorProps) {
  return (
    <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full min-h-[120px] p-2 rounded-lg text-sm',
          'bg-card border border-border resize-none',
          'focus:outline-none focus:ring-2',
          isHalloween ? 'focus:ring-orange-500/50' : 'focus:ring-primary/50'
        )}
        placeholder="Enter scene content..."
        disabled={isSaving}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            'flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
            isHalloween
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

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
  const { success, error: showError } = useToast()
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

      if (x + rect.width > viewportWidth - 20) {
        x = viewportWidth - rect.width - 20
      }
      if (y + rect.height > viewportHeight - 20) {
        y = viewportHeight - rect.height - 20
      }

      setMenuPosition({ x: Math.max(20, x), y: Math.max(20, y) })
    }
  }, [position])

  const menuContent = (
    <div
      ref={menuRef}
      className={cn(
        'fixed z-[9999] w-[320px] rounded-xl shadow-2xl',
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
      {/* Header */}
      <div
        className={cn(
          'px-4 py-3 border-b',
          isHalloween ? 'border-purple-500/30' : 'border-border'
        )}
      >
        <h3 className="font-semibold text-foreground truncate">{card.title || 'Untitled'}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {card.content?.slice(0, 80) || 'No content yet'}
          {card.content && card.content.length > 80 ? '...' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        {/* Content */}
        <ActionButton
          icon={FileText}
          label="Content"
          done={content.hasContent}
          state={content.state}
          isHalloween={isHalloween}
          onClick={content.hasContent ? content.startEditing : content.generate}
          secondaryAction={
            content.hasContent
              ? {
                  icon: Sparkles,
                  label: 'Regenerate with AI',
                  onClick: content.generate,
                  loading: content.state === 'loading',
                }
              : undefined
          }
        />

        {content.isEditing && (
          <ContentEditor
            content={content.editContent}
            onChange={content.setEditContent}
            onSave={content.saveEdit}
            onCancel={content.cancelEdit}
            isSaving={content.state === 'loading'}
            isHalloween={isHalloween}
          />
        )}

        {/* Image */}
        <ActionButton
          icon={ImageIcon}
          label="Scene Image"
          done={image.hasImage}
          state={image.state}
          isHalloween={isHalloween}
          disabled={!image.hasContent}
          onClick={image.generate}
        />

        {!image.hasContent && !image.hasImage && (
          <p className="text-xs text-muted-foreground pl-3">
            Add content first to generate images
          </p>
        )}

        {image.sketches.length > 0 && (
          <SketchPicker
            sketches={image.sketches}
            selectedIndex={image.selectedIndex}
            onSelect={image.selectSketch}
            onApply={image.applySketch}
            onCancel={image.cancelSketches}
            isHalloween={isHalloween}
          />
        )}

        {/* Audio */}
        <ActionButton
          icon={Volume2}
          label="Audio Narration"
          done={audio.hasAudio}
          state={audio.state}
          isHalloween={isHalloween}
          disabled={!audio.hasContent}
          onClick={audio.generate}
          secondaryAction={
            audio.hasAudio
              ? {
                  icon: audio.isPlaying ? Pause : Play,
                  label: audio.isPlaying ? 'Pause' : 'Play',
                  onClick: audio.togglePlayback,
                  loading: audio.isLoadingAudio,
                }
              : undefined
          }
        />

        {!audio.hasContent && !audio.hasAudio && (
          <p className="text-xs text-muted-foreground pl-3">
            Add content first to generate audio
          </p>
        )}

        {/* Error messages */}
        {(audio.error || image.error || content.error) && (
          <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-xs text-destructive">
              {audio.error || image.error || content.error}
            </p>
          </div>
        )}
      </div>

      {/* Footer with Delete/Close */}
      <div
        className={cn(
          'px-3 py-2 border-t flex items-center gap-2',
          isHalloween ? 'border-purple-500/30' : 'border-border'
        )}
      >
        <button
          onClick={onDelete}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
            'bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30'
          )}
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
        <button
          onClick={onClose}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all',
            'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border'
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
