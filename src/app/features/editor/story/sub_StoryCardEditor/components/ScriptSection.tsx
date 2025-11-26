'use client'

import { useState, useEffect, useCallback } from 'react'
import { Code, Play, AlertTriangle } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAutoSave } from '../lib/useAutoSave'
import { updateCard } from '../lib/cardApi'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import ScriptQualityAssistant from '../../ScriptQualityAssistant'

interface ScriptSectionProps {
  cardId: string
  storyStackId: string
  initialScript: string
}

export function ScriptSection({
  cardId,
  storyStackId,
  initialScript,
}: ScriptSectionProps) {
  const { updateCard: updateCardContext } = useEditor()
  const { success, error: showError } = useToast()

  const [script, setScript] = useState(initialScript)
  const [isSaving, setIsSaving] = useState(false)

  // Sync with props when card changes
  useEffect(() => {
    setScript(initialScript)
  }, [cardId, initialScript])

  const saveScript = useCallback(async () => {
    if (script === initialScript) return

    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { script })
      updateCardContext(cardId, updated)
      success('Script saved')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save script')
      setScript(initialScript)
    } finally {
      setIsSaving(false)
    }
  }, [script, initialScript, storyStackId, cardId, updateCardContext, success, showError])

  const { scheduleSave } = useAutoSave({
    delay: 1000,
    onSave: saveScript,
  })

  const handleScriptChange = (value: string) => {
    setScript(value)
    scheduleSave()
  }

  const handleScriptUpdate = (newScript: string) => {
    setScript(newScript)
    scheduleSave()
  }

  const hasScript = script && script.trim().length > 0
  const lineCount = script.split('\n').length

  return (
    <div className="space-y-6">
      {/* Script Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-primary" />
          <Label className="text-sm font-semibold">Card Script</Label>
          {hasScript && (
            <span className="text-xs text-muted-foreground">
              ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
            </span>
          )}
        </div>
        {isSaving && (
          <span className="text-xs text-muted-foreground">Saving...</span>
        )}
      </div>

      {/* Script Warning */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 dark:text-amber-200">
          <p className="font-medium">Advanced Feature</p>
          <p className="mt-0.5 opacity-80">
            Scripts run when the card is displayed. Use with caution.
          </p>
        </div>
      </div>

      {/* Script Editor */}
      <div className="space-y-2">
        <Textarea
          value={script}
          onChange={(e) => handleScriptChange(e.target.value)}
          onBlur={saveScript}
          placeholder={`// JavaScript code that runs when this card is displayed
// Example: Play a sound, update game state, etc.

console.log('Card loaded!');`}
          className="min-h-[200px] font-mono text-sm bg-[#1e1e1e] text-[#d4d4d4]
                     border-2 border-border resize-y
                     focus:border-primary focus:ring-1 focus:ring-primary/20
                     placeholder:text-gray-500"
          disabled={isSaving}
          data-testid="card-script-input"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            JavaScript code executed when this card is displayed
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={saveScript}
            disabled={isSaving || script === initialScript}
            className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                       hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                       hover:-translate-x-px hover:-translate-y-px transition-all"
            data-testid="save-script-btn"
          >
            <Play className="w-3.5 h-3.5 mr-1.5" />
            Save Script
          </Button>
        </div>
      </div>

      {/* AI Script Assistant */}
      <div className="border-t border-border pt-6">
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
          AI Script Assistant
        </Label>
        <ScriptQualityAssistant
          script={script}
          onScriptUpdate={handleScriptUpdate}
          disabled={isSaving}
        />
      </div>
    </div>
  )
}
