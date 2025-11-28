'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Palette, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { ArtStylePresetSelector } from './ArtStylePresetSelector'
import { ArtStyleExtractor } from './ArtStyleExtractor'
import { getEffectiveArtStylePrompt, getArtStyleDetails } from '../lib/artStyleService'

interface ArtStyleEditorProps {
  onSave?: () => void
}

export function ArtStyleEditor({ onSave }: ArtStyleEditorProps) {
  const { storyStack, setStoryStack } = useEditor()
  const { success, error: showError } = useToast()

  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>(
    storyStack?.artStyleSource === 'preset' ? 'preset' : 'custom'
  )

  // Local state for editing
  const [selectedStyleId, setSelectedStyleId] = useState(storyStack?.artStyleId || 'adventure_journal')
  const [customPrompt, setCustomPrompt] = useState(storyStack?.customArtStylePrompt || '')
  const [extractedImageUrl, setExtractedImageUrl] = useState(storyStack?.extractedStyleImageUrl || null)
  const [artStyleSource, setArtStyleSource] = useState<'preset' | 'custom' | 'extracted'>(
    storyStack?.artStyleSource || 'preset'
  )

  const handlePresetSelect = useCallback((styleId: string) => {
    setSelectedStyleId(styleId)
    setArtStyleSource('preset')
    setActiveTab('preset')
  }, [])

  const handleCustomPromptChange = useCallback((prompt: string) => {
    setCustomPrompt(prompt)
    setArtStyleSource('custom')
  }, [])

  const handleExtract = useCallback((imageUrl: string, prompt: string) => {
    setExtractedImageUrl(imageUrl)
    setCustomPrompt(prompt)
    setArtStyleSource('extracted')
  }, [])

  const handleClearCustom = useCallback(() => {
    setCustomPrompt('')
    setExtractedImageUrl(null)
    setArtStyleSource('preset')
    setActiveTab('preset')
  }, [])

  const handleSave = async () => {
    if (!storyStack) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/stories/${storyStack.id}/art-style`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artStyleId: activeTab === 'preset' ? selectedStyleId : null,
          customArtStylePrompt: activeTab === 'custom' ? customPrompt : null,
          artStyleSource: activeTab === 'preset' ? 'preset' : artStyleSource,
          extractedStyleImageUrl: activeTab === 'custom' && artStyleSource === 'extracted' ? extractedImageUrl : null
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save art style')
      }

      const updatedStack = await response.json()
      setStoryStack(updatedStack)
      success('Art style saved')
      onSave?.()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save art style')
    } finally {
      setIsSaving(false)
    }
  }

  if (!storyStack) return null

  const currentStyleDetails = getArtStyleDetails(storyStack)
  const hasChanges = 
    (activeTab === 'preset' && (selectedStyleId !== storyStack.artStyleId || storyStack.artStyleSource !== 'preset')) ||
    (activeTab === 'custom' && (customPrompt !== storyStack.customArtStylePrompt || artStyleSource !== storyStack.artStyleSource))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Palette className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Story Art Style</h2>
          <p className="text-xs text-muted-foreground">
            This style applies to all card images in your story
          </p>
        </div>
      </div>

      {/* Current Style Preview */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{currentStyleDetails.icon}</span>
          <div>
            <p className="font-medium text-sm">{currentStyleDetails.label}</p>
            <p className="text-xs text-muted-foreground">{currentStyleDetails.description}</p>
          </div>
        </div>
        {currentStyleDetails.prompt && (
          <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded border border-border line-clamp-3">
            {currentStyleDetails.prompt}
          </p>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('preset')}
          className={cn(
            'flex-1 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'preset'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Preset Styles
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={cn(
            'flex-1 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'custom'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Custom Style
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'preset' ? (
          <ArtStylePresetSelector
            selectedStyleId={selectedStyleId}
            onSelect={handlePresetSelect}
            disabled={isSaving}
          />
        ) : (
          <ArtStyleExtractor
            customPrompt={customPrompt}
            extractedImageUrl={extractedImageUrl}
            onExtract={handleExtract}
            onCustomPromptChange={handleCustomPromptChange}
            onClear={handleClearCustom}
            disabled={isSaving}
          />
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
        {hasChanges && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="min-w-[100px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save Style
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
