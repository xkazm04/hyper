'use client'

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditableFieldProps {
  /** Current value */
  value: string
  /** Placeholder when empty */
  placeholder?: string
  /** Called when value is saved */
  onSave: (value: string) => void | Promise<void>
  /** Whether saving is in progress */
  isSaving?: boolean
  /** Whether the field is disabled */
  disabled?: boolean
  /** Field type - single line or multiline */
  type?: 'text' | 'textarea'
  /** Custom class for view mode text */
  viewClassName?: string
  /** Custom class for edit mode input */
  editClassName?: string
  /** Minimum height for textarea (applies to both modes for consistency) */
  minHeight?: string
  /** Label shown above the field */
  label?: string
  /** Whether to show the field label in view mode */
  showLabelInView?: boolean
  /** Test ID for the component */
  testId?: string
}

/**
 * EditableField - A view-first editable component with consistent sizing
 *
 * Key UX improvements:
 * - Consistent height between view and edit modes (no layout shift)
 * - Better visual hierarchy with subtle background
 * - Action buttons positioned outside content area (bottom-right)
 * - Keyboard shortcuts: Enter (text) or Ctrl+Enter (textarea) to save, Escape to cancel
 */
export function EditableField({
  value,
  placeholder = 'Click to add...',
  onSave,
  isSaving = false,
  disabled = false,
  type = 'text',
  viewClassName,
  editClassName,
  minHeight = '120px',
  label,
  showLabelInView = false,
  testId,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync edit value when external value changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value)
    }
  }, [value, isEditing])

  // Focus input when entering edit mode and auto-size textarea
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Move cursor to end
      const len = editValue.length
      inputRef.current.setSelectionRange(len, len)
      // Auto-size textarea to match content
      if (type === 'textarea') {
        const textarea = inputRef.current as HTMLTextAreaElement
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.max(textarea.scrollHeight, parseInt(minHeight))}px`
      }
    }
  }, [isEditing, type, minHeight])

  const handleEdit = useCallback(() => {
    if (disabled || isSaving) return
    setEditValue(value)
    setIsEditing(true)
  }, [disabled, isSaving, value])

  const handleSave = useCallback(async () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue !== value) {
      await onSave(trimmedValue)
    }
    setIsEditing(false)
  }, [editValue, value, onSave])

  const handleCancel = useCallback(() => {
    setEditValue(value)
    setIsEditing(false)
  }, [value])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    } else if (e.key === 'Enter' && type === 'text') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Enter' && e.ctrlKey && type === 'textarea') {
      e.preventDefault()
      handleSave()
    }
  }, [handleCancel, handleSave, type])

  const isTextarea = type === 'textarea'
  const isEmpty = !value.trim()

  // Common container styles for consistent height
  const containerStyles = isTextarea ? { minHeight } : undefined

  // View Mode
  if (!isEditing) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'group relative rounded-lg transition-all duration-150 cursor-pointer',
          // Subtle background for better readability
          'bg-muted/30 hover:bg-muted/50',
          // Border to define the area
          'border border-transparent hover:border-border/50',
          disabled && 'cursor-not-allowed opacity-60'
        )}
        style={containerStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleEdit}
        data-testid={testId}
      >
        {/* Label in view mode */}
        {showLabelInView && label && (
          <div className="px-3 pt-2 pb-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              {label}
            </span>
          </div>
        )}

        {/* Content with consistent padding */}
        <div
          className={cn(
            'px-3 py-2.5',
            isTextarea && 'pb-8', // Extra bottom padding for action area
            isEmpty && 'text-muted-foreground/50 italic',
            viewClassName
          )}
        >
          {isEmpty ? placeholder : value}
        </div>

        {/* Edit hint - bottom right, shows on hover */}
        {!disabled && (
          <div
            className={cn(
              'absolute right-2 bottom-2 flex items-center gap-1.5',
              'text-xs text-muted-foreground',
              'transition-opacity duration-150',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Pencil className="w-3 h-3" />
                <span>Click to edit</span>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  // Edit Mode - maintains same container dimensions
  return (
    <div
      ref={containerRef}
      className="relative rounded-lg bg-background border-2 border-primary shadow-sm"
      style={containerStyles}
    >
      {/* Label in edit mode */}
      {label && (
        <div className="px-3 pt-2 pb-1 flex items-center justify-between border-b border-border/30">
          <span className="text-xs font-medium text-foreground">{label}</span>
          {isSaving && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving...
            </span>
          )}
        </div>
      )}

      {/* Input/Textarea - fills the container with auto-grow */}
      {isTextarea ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            // Auto-grow textarea to match content
            const target = e.target
            target.style.height = 'auto'
            target.style.height = `${Math.max(target.scrollHeight, parseInt(minHeight))}px`
          }}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder={placeholder}
          className={cn(
            'w-full bg-transparent px-3 py-2.5 pb-10', // Extra bottom padding for buttons
            'focus:outline-none resize-none',
            'disabled:opacity-50',
            'text-foreground placeholder:text-muted-foreground/50',
            editClassName
          )}
          style={{ minHeight }}
          data-testid={testId ? `${testId}-input` : undefined}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder={placeholder}
          className={cn(
            'w-full bg-transparent px-3 py-2.5',
            'focus:outline-none',
            'disabled:opacity-50',
            'text-foreground placeholder:text-muted-foreground/50',
            editClassName
          )}
          data-testid={testId ? `${testId}-input` : undefined}
        />
      )}

      {/* Action buttons - bottom right, outside content flow */}
      <div className="absolute right-2 bottom-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md p-0.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'transition-colors disabled:opacity-50'
          )}
          aria-label="Save"
        >
          <Check className="w-3 h-3" />
          <span>Save</span>
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs',
            'text-muted-foreground hover:text-foreground hover:bg-muted',
            'transition-colors disabled:opacity-50'
          )}
          aria-label="Cancel"
        >
          <X className="w-3 h-3" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="absolute left-3 bottom-2 text-[10px] text-muted-foreground/60">
        {isTextarea ? 'Ctrl+Enter to save • Esc to cancel' : 'Enter to save • Esc to cancel'}
      </div>
    </div>
  )
}
