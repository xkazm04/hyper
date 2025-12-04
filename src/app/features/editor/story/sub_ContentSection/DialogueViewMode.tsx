'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { MessageCircle, Pencil, Check, X, Loader2, Plus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface Character {
  id: string
  name: string
}

interface DialogueViewModeProps {
  message: string
  speaker: string
  characters: Character[]
  isSaving: boolean
  isGenerating: boolean
  onMessageSave: (value: string) => void | Promise<void>
  onSpeakerSave: (value: string) => void | Promise<void>
}

/**
 * DialogueViewMode - View-first dialogue/message editor
 *
 * Shows a compact formatted dialogue when content exists:
 * "Message text here" — Speaker Name
 *
 * When empty, shows a subtle "Add dialogue" prompt.
 * Click to expand into edit mode.
 */
export function DialogueViewMode({
  message,
  speaker,
  characters,
  isSaving,
  isGenerating,
  onMessageSave,
  onSpeakerSave,
}: DialogueViewModeProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editMessage, setEditMessage] = useState(message)
  const [editSpeaker, setEditSpeaker] = useState(speaker)
  const [isHovered, setIsHovered] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isDisabled = isSaving || isGenerating
  const hasDialogue = message.trim() || speaker.trim()

  // Sync values when props change
  useEffect(() => {
    if (!isEditing) {
      setEditMessage(message)
      setEditSpeaker(speaker)
    }
  }, [message, speaker, isEditing])

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleEdit = useCallback(() => {
    if (isDisabled) return
    setEditMessage(message)
    setEditSpeaker(speaker)
    setIsEditing(true)
  }, [isDisabled, message, speaker])

  const handleSave = useCallback(async () => {
    const trimmedMessage = editMessage.trim()
    const trimmedSpeaker = editSpeaker.trim()

    // Save both if changed
    if (trimmedMessage !== message) {
      await onMessageSave(trimmedMessage)
    }
    if (trimmedSpeaker !== speaker) {
      await onSpeakerSave(trimmedSpeaker)
    }

    setIsEditing(false)
  }, [editMessage, editSpeaker, message, speaker, onMessageSave, onSpeakerSave])

  const handleCancel = useCallback(() => {
    setEditMessage(message)
    setEditSpeaker(speaker)
    setIsEditing(false)
  }, [message, speaker])

  const handleClear = useCallback(async () => {
    setEditMessage('')
    setEditSpeaker('')
    await onMessageSave('')
    await onSpeakerSave('')
    setIsEditing(false)
  }, [onMessageSave, onSpeakerSave])

  const getSpeakerDisplayName = (speakerValue: string) => {
    if (!speakerValue) return null
    if (speakerValue === 'narrator') return 'Narrator'
    const character = characters.find(c => c.name === speakerValue)
    return character?.name || speakerValue
  }

  // View Mode - No dialogue
  if (!isEditing && !hasDialogue) {
    return (
      <button
        type="button"
        onClick={handleEdit}
        disabled={isDisabled}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border',
          'text-sm text-muted-foreground/60 hover:text-muted-foreground',
          'hover:border-muted-foreground/30 hover:bg-muted/30',
          'transition-colors',
          isDisabled && 'opacity-50 cursor-not-allowed'
        )}
        data-testid="add-dialogue-btn"
      >
        <Plus className="w-4 h-4" />
        <span>Add character dialogue</span>
      </button>
    )
  }

  // View Mode - Has dialogue
  if (!isEditing) {
    const speakerDisplay = getSpeakerDisplayName(speaker)

    return (
      <div
        className={cn(
          'group relative rounded-md p-3 transition-colors cursor-pointer',
          'bg-muted/30 border border-border/50',
          !isDisabled && 'hover:bg-muted/50'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleEdit}
        data-testid="dialogue-view"
      >
        <div className="flex items-start gap-2">
          <MessageCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0 pr-8">
            {/* Message */}
            {message && (
              <p className="text-foreground italic">
                "{message}"
              </p>
            )}
            {/* Speaker */}
            {speakerDisplay && (
              <p className="text-sm text-muted-foreground mt-1">
                — {speakerDisplay}
              </p>
            )}
          </div>
        </div>

        {/* Edit icon */}
        {!isDisabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleEdit()
            }}
            className={cn(
              'absolute right-2 top-2 p-1.5 rounded-md',
              'text-muted-foreground hover:text-foreground hover:bg-background',
              'transition-opacity duration-150',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            aria-label="Edit dialogue"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Pencil className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    )
  }

  // Edit Mode
  return (
    <div
      className="rounded-md p-4 bg-muted/30 border-2 border-primary space-y-3"
      data-testid="dialogue-edit"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Character Dialogue</span>
        </div>
        <div className="flex items-center gap-1">
          {isSaving && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mr-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="p-1.5 rounded text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            aria-label="Save"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Speaker Select */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Speaker</label>
        <Select
          value={editSpeaker || 'none'}
          onValueChange={(value) => {
            if (value === 'none') {
              setEditSpeaker('')
            } else {
              setEditSpeaker(value)
            }
          }}
          disabled={isSaving}
        >
          <SelectTrigger className="border-2 border-border bg-background">
            <SelectValue placeholder="Select speaker..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No speaker</SelectItem>
            <SelectItem value="narrator">Narrator</SelectItem>
            {characters.map(c => (
              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message Textarea */}
      <div className="space-y-1.5">
        <label className="text-xs text-muted-foreground">Message</label>
        <Textarea
          ref={textareaRef}
          value={editMessage}
          onChange={(e) => setEditMessage(e.target.value)}
          placeholder="Enter dialogue or narration..."
          disabled={isSaving}
          className="min-h-[80px] resize-y bg-background border-2 border-border focus:border-primary"
        />
      </div>

      {/* Clear button if has content */}
      {hasDialogue && (
        <button
          type="button"
          onClick={handleClear}
          disabled={isSaving}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Clear dialogue
        </button>
      )}
    </div>
  )
}
