'use client'

import { useState, useCallback, useEffect } from 'react'
import { StoryCard } from '@/lib/types'
import { ScriptEditor } from '../../sub_HyperTalkLinter'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { updateCard } from '../lib/cardApi'

interface ScriptSectionProps {
  cardId: string
  storyStackId: string
  initialScript: string
  currentCard?: StoryCard
}

export function ScriptSection({
  cardId,
  storyStackId,
  initialScript,
  currentCard,
}: ScriptSectionProps) {
  const { updateCard: updateCardContext } = useEditor()
  const { error: showError, success } = useToast()
  const [script, setScript] = useState(initialScript)
  const [isSaving, setIsSaving] = useState(false)

  // Sync with external changes
  useEffect(() => {
    setScript(initialScript)
  }, [initialScript, cardId])

  // Handle script change
  const handleScriptChange = useCallback((newScript: string) => {
    setScript(newScript)
    // Update context immediately for UI reactivity
    updateCardContext(cardId, { script: newScript })
  }, [cardId, updateCardContext])

  // Handle save
  const handleSave = useCallback(async (scriptToSave: string) => {
    if (isSaving) return

    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { script: scriptToSave })
      updateCardContext(cardId, updated)
      success('Script saved')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save script')
      // Revert to initial on error
      setScript(initialScript)
    } finally {
      setIsSaving(false)
    }
  }, [storyStackId, cardId, updateCardContext, success, showError, initialScript, isSaving])

  // Handle navigation from script (for testing)
  const handleNavigate = useCallback((targetCardId: string) => {
    // In test mode, just show a toast notification
    success(`Script would navigate to card: ${targetCardId}`)
  }, [success])

  // Handle dialog from script (for testing)
  const handleDialog = useCallback((message: string, options?: { title?: string }) => {
    // In test mode, show a toast with the dialog message
    success(options?.title ? `${options.title}: ${message}` : message)
  }, [success])

  return (
    <div className="space-y-4" data-testid="script-section">
      <div className="text-sm text-muted-foreground">
        <p>
          Write HyperTalk-style scripts to add interactivity to your cards.
          Scripts are validated in real-time and errors will be shown inline.
        </p>
      </div>

      <ScriptEditor
        script={script}
        onScriptChange={handleScriptChange}
        onSave={handleSave}
        cardContext={{
          id: cardId,
          title: currentCard?.title || 'Untitled Card',
        }}
        disabled={isSaving}
        showTestRun={true}
        onNavigate={handleNavigate}
        onDialog={handleDialog}
      />
    </div>
  )
}
