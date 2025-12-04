'use client'

import { useState, useCallback } from 'react'
import { Palette } from 'lucide-react'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { ArtStylePresetSelector } from './ArtStylePresetSelector'
import { ArtStyleExtractor } from './ArtStyleExtractor'
import { SaveButton } from './shared'
import { getArtStyleDetails } from '../lib/artStyleService'
import { TabSwitcher, TabItem } from '@/components/ui/TabSwitcher'

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
          <p className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded border border-border whitespace-pre-wrap">
            {currentStyleDetails.prompt}
          </p>
        )}
      </div>

      {/* Tab Switcher */}
      <TabSwitcher
        tabs={[
          { id: 'preset', label: 'Preset Styles' },
          { id: 'custom', label: 'Custom Style' },
        ] as TabItem<'preset' | 'custom'>[]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
        size="sm"
      />

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
      <SaveButton
        onSave={handleSave}
        isSaving={isSaving}
        hasChanges={hasChanges}
        label="Save Style"
        savingLabel="Saving..."
      />
    </div>
  )
}
