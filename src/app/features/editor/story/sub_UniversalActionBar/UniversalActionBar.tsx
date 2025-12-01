'use client'

import { useCallback } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { useUndoRedoContext } from '@/app/features/editor/undo-redo'
import { Button } from '@/components/ui/button'
import { SyncStatus } from '@/components/ui/SyncStatus'
import {
  Eye,
  Upload,
  Undo2,
  Redo2,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UniversalActionBarProps {
  onPreview: () => void
  onPublish: () => void
  className?: string
}

export function UniversalActionBar({
  onPreview,
  onPublish,
  className,
}: UniversalActionBarProps) {
  const { storyStack, isSaving } = useEditor()
  const { canUndo, canRedo, undo, redo } = useUndoRedoContext()

  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo()
    }
  }, [canUndo, undo])

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo()
    }
  }, [canRedo, redo])

  // Get save status display based on isSaving state
  const getSaveStatusDisplay = () => {
    if (isSaving) {
      return {
        icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
        label: 'Saving...',
        className: 'text-muted-foreground',
      }
    }
    // Default: idle/auto-saved state
    return {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: 'Auto-saved',
      className: 'text-muted-foreground',
    }
  }

  const statusDisplay = getSaveStatusDisplay()

  if (!storyStack) {
    return null
  }

  return (
    <div
      className={cn(
        // Sticky positioning
        'sticky top-0 z-40',
        // Layout
        'flex items-center justify-between gap-2 sm:gap-4',
        'h-12 px-3 sm:px-4',
        // Visual styling - subtle background with drop shadow
        'bg-card/95 backdrop-blur-sm',
        'border-b border-border',
        'shadow-[0_2px_8px_-2px_hsl(var(--border)/0.5)]',
        className
      )}
      data-testid="universal-action-bar"
    >
      {/* Left Section - Save Status & Sync */}
      <div className="flex items-center gap-3">
        {/* Save Status Indicator */}
        <div
          className={cn(
            'flex items-center gap-1.5 text-xs font-medium',
            statusDisplay.className
          )}
          data-testid="action-bar-save-status"
        >
          {statusDisplay.icon}
          <span className="hidden sm:inline">{statusDisplay.label}</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-border" />

        {/* Sync Status */}
        <SyncStatus />
      </div>

      {/* Center Section - Core Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Undo/Redo Group */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            className={cn(
              'h-8 w-8 p-0 rounded-md',
              'hover:bg-muted transition-colors',
              !canUndo && 'opacity-40 cursor-not-allowed'
            )}
            title="Undo (Ctrl+Z)"
            data-testid="action-bar-undo-btn"
          >
            <Undo2 className="w-4 h-4" />
            <span className="sr-only">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            className={cn(
              'h-8 w-8 p-0 rounded-md',
              'hover:bg-muted transition-colors',
              !canRedo && 'opacity-40 cursor-not-allowed'
            )}
            title="Redo (Ctrl+Y)"
            data-testid="action-bar-redo-btn"
          >
            <Redo2 className="w-4 h-4" />
            <span className="sr-only">Redo</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-5 w-px bg-border mx-1" />

        {/* Preview Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreview}
          disabled={!storyStack.isPublished}
          className={cn(
            'h-8 px-2 sm:px-3 gap-1.5',
            'hover:bg-muted transition-colors',
            !storyStack.isPublished && 'opacity-40 cursor-not-allowed'
          )}
          title={storyStack.isPublished ? 'Preview published story' : 'Publish to enable preview'}
          data-testid="action-bar-preview-btn"
        >
          <Eye className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Preview</span>
        </Button>

        {/* Publish Button */}
        <Button
          size="sm"
          onClick={onPublish}
          disabled={isSaving}
          className={cn(
            'h-8 px-2 sm:px-3 gap-1.5',
            'border border-border',
            'shadow-[2px_2px_0px_0px_hsl(var(--border))]',
            'hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]',
            'hover:-translate-x-px hover:-translate-y-px',
            'transition-all duration-150',
            storyStack.isPublished
              ? 'bg-[hsl(var(--green-500))] text-primary-foreground hover:bg-[hsl(var(--green-600))]'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
          data-testid="action-bar-publish-btn"
        >
          {storyStack.isPublished ? (
            <>
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Published</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-medium">Publish</span>
            </>
          )}
        </Button>
      </div>

      {/* Right Section - Empty for balance (or future additions) */}
      <div className="w-24 hidden sm:block" />
    </div>
  )
}
