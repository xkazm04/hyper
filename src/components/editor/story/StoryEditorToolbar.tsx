'use client'

import { useEditor } from '@/contexts/EditorContext'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Plus, Play, Upload, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

interface StoryEditorToolbarProps {
  onAddCard: () => void
  onPreview: () => void
  onPublish: () => void
}

export default function StoryEditorToolbar({
  onAddCard,
  onPreview,
  onPublish,
}: StoryEditorToolbarProps) {
  const { storyStack, isSaving } = useEditor()

  if (!storyStack) {
    return null
  }

  return (
    <div className="min-h-16 bg-background border-b-2 border-border px-2 sm:px-4 py-2 sm:py-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
      {/* Left Section - Back & Story Name */}
      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <Link href="/dashboard">
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-muted touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>
        <div className="hidden sm:block border-l-2 border-border h-8" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-lg font-bold tracking-tight truncate">{storyStack.name}</h1>
            {storyStack.isPublished && (
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-[hsl(var(--green-100))] text-[hsl(var(--green-800))] border border-[hsl(var(--green-500))] rounded shrink-0">
                <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Published</span>
              </span>
            )}
          </div>
          {storyStack.description && (
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{storyStack.description}</p>
          )}
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
        {isSaving && (
          <span className="text-xs text-muted-foreground mr-1 sm:mr-2 hidden sm:inline">Saving...</span>
        )}
        
        <ThemeToggle />
        
        <Button
          size="sm"
          variant="outline"
          onClick={onAddCard}
          className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all touch-manipulation text-xs sm:text-sm"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Card</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onPreview}
          disabled={!storyStack.isPublished}
          className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-xs sm:text-sm"
        >
          <Play className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
          <span className="hidden sm:inline">Preview</span>
        </Button>

        <Button
          size="sm"
          onClick={onPublish}
          disabled={isSaving}
          className={`border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all touch-manipulation text-xs sm:text-sm ${
            storyStack.isPublished
              ? 'bg-[hsl(var(--green-500))] text-primary-foreground hover:bg-[hsl(var(--green-600))]'
              : 'bg-[hsl(var(--blue-500))] text-primary-foreground hover:bg-[hsl(var(--blue-600))]'
          }`}
        >
          {storyStack.isPublished ? (
            <>
              <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Published</span>
            </>
          ) : (
            <>
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
              <span className="hidden sm:inline">Publish</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
