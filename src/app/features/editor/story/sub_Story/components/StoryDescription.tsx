'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'

export function StoryDescription() {
  const { storyStack, setStoryStack } = useEditor()
  const { success, error: showError } = useToast()

  const [description, setDescription] = useState(storyStack?.description || '')
  const [isSaving, setIsSaving] = useState(false)

  const hasChanges = description !== (storyStack?.description || '')

  const handleSave = useCallback(async () => {
    if (!storyStack || !hasChanges) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/stories/${storyStack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description || null })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save description')
      }

      const updatedStack = await response.json()
      setStoryStack(updatedStack)
      success('Description saved')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save description')
    } finally {
      setIsSaving(false)
    }
  }, [storyStack, description, hasChanges, setStoryStack, success, showError])

  if (!storyStack) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Story Description</h2>
          <p className="text-xs text-muted-foreground">
            A brief summary of your story
          </p>
        </div>
      </div>

      {/* Description Editor */}
      <div className="space-y-2">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your story in a few sentences..."
          className="min-h-[100px] text-sm resize-none"
          disabled={isSaving}
        />
        <p className="text-[10px] text-muted-foreground">
          This description will be shown in the story list and when sharing
        </p>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2">
        {hasChanges && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          size="sm"
          className="min-w-[80px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-3 h-3 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
