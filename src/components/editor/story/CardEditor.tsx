'use client'

import { useState, useEffect } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { FileText, Network, Pencil, ImageIcon, Trash2, Code } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ChoiceEditor from './ChoiceEditor'
import StoryGraph from './StoryGraph'
import PromptComposer from './PromptComposer'
import ScriptQualityAssistant from './ScriptQualityAssistant'
import { useToast } from '@/lib/context/ToastContext'

type TabType = 'canvas' | 'graph'

export default function CardEditor() {
  const { currentCard, storyStack, storyCards, updateCard } = useEditor()
  const [activeTab, setActiveTab] = useState<TabType>('canvas')
  const [isSaving, setIsSaving] = useState(false)
  const { success, error: showError } = useToast()

  // Local state for editing
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editScript, setEditScript] = useState('')
  const [showScriptEditor, setShowScriptEditor] = useState(false)

  // Sync local state when card changes
  useEffect(() => {
    if (currentCard) {
      setEditTitle(currentCard.title || '')
      setEditContent(currentCard.content || '')
      setEditScript(currentCard.script || '')
    }
  }, [currentCard?.id])

  const handleImageSelect = async (imageUrl: string, prompt: string) => {
    if (!currentCard || !storyStack) return

    setIsSaving(true)
    try {
      // Update the card with the selected image
      const response = await fetch(
        `/api/stories/${storyStack.id}/cards/${currentCard.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl,
            imagePrompt: prompt,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save image to card')
      }

      const data = await response.json()
      updateCard(currentCard.id, data.storyCard)
      success('Image saved successfully')
    } catch (error) {
      console.error('Error saving image:', error)
      showError(error instanceof Error ? error.message : 'Failed to save image')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveImage = async () => {
    if (!currentCard || !storyStack) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStack.id}/cards/${currentCard.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: null,
            imagePrompt: null,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to remove image')
      }

      const data = await response.json()
      updateCard(currentCard.id, data.storyCard)
      success('Image removed')
    } catch (error) {
      console.error('Error removing image:', error)
      showError('Failed to remove image')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTitle = async () => {
    if (!currentCard || !storyStack) return
    if (editTitle === currentCard.title) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStack.id}/cards/${currentCard.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update title')
      }

      const data = await response.json()
      updateCard(currentCard.id, data.storyCard)
    } catch (error) {
      console.error('Error updating title:', error)
      showError('Failed to save title')
      setEditTitle(currentCard.title || '')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveContent = async () => {
    if (!currentCard || !storyStack) return
    if (editContent === currentCard.content) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStack.id}/cards/${currentCard.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update content')
      }

      const data = await response.json()
      updateCard(currentCard.id, data.storyCard)
    } catch (error) {
      console.error('Error updating content:', error)
      showError('Failed to save content')
      setEditContent(currentCard.content || '')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveScript = async () => {
    if (!currentCard || !storyStack) return
    if (editScript === currentCard.script) return

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStack.id}/cards/${currentCard.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: editScript }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update script')
      }

      const data = await response.json()
      updateCard(currentCard.id, data.storyCard)
      success('Script saved')
    } catch (error) {
      console.error('Error updating script:', error)
      showError('Failed to save script')
      setEditScript(currentCard.script || '')
    } finally {
      setIsSaving(false)
    }
  }

  const handleScriptUpdate = (newScript: string) => {
    setEditScript(newScript)
  }

  if (!currentCard) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Card Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a card from the list or create a new one to start editing
          </p>
        </div>
      </div>
    )
  }

  if (!storyStack) {
    return null
  }

  return (
    <div className="h-full flex flex-col bg-muted">
      {/* Tab Switcher */}
      <div className="border-b-2 border-border bg-card">
        <div className="flex">
          <button
            onClick={() => setActiveTab('canvas')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-r border-border',
              activeTab === 'canvas'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Pencil className="w-4 h-4" />
            <span>Canvas</span>
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              activeTab === 'graph'
                ? 'bg-primary/10 text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Network className="w-4 h-4" />
            <span>Story Graph</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'canvas' ? (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            {/* Card Details Editor */}
            <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6">
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="card-title" className="text-sm font-semibold">
                    Card Title
                  </Label>
                  <Input
                    id="card-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    placeholder="Enter card title..."
                    className="text-lg font-semibold"
                    disabled={isSaving}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="card-content" className="text-sm font-semibold">
                    Story Content
                  </Label>
                  <Textarea
                    id="card-content"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onBlur={handleSaveContent}
                    placeholder="Write the story content for this card..."
                    className="min-h-[200px] resize-y"
                    disabled={isSaving}
                  />
                  <p className="text-xs text-muted-foreground">
                    This text will be displayed to the player when they reach this card.
                  </p>
                </div>
              </div>
            </div>

            {/* Image Section */}
            <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6">
              <div className="space-y-4">
                {/* Current Image Preview */}
                {currentCard.imageUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Card Image</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleRemoveImage}
                        disabled={isSaving}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-border bg-muted">
                      <img
                        src={currentCard.imageUrl}
                        alt={currentCard.title || 'Card image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {currentCard.imagePrompt && (
                      <p className="text-xs text-muted-foreground italic">
                        Prompt: {currentCard.imagePrompt}
                      </p>
                    )}
                  </div>
                )}

                {/* Empty state when no image */}
                {!currentCard.imageUrl && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    <div>
                      <p className="text-sm font-medium">No image yet</p>
                      <p className="text-xs text-muted-foreground">
                        Use the prompt builder below to generate an image
                      </p>
                    </div>
                  </div>
                )}

                {/* Prompt Composer */}
                <PromptComposer
                  onImageSelect={handleImageSelect}
                />
              </div>
            </div>

            {/* Script Editor Section */}
            <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Card Script
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowScriptEditor(!showScriptEditor)}
                    data-testid="toggle-script-editor-btn"
                  >
                    {showScriptEditor ? 'Hide' : 'Show'} Editor
                  </Button>
                </div>

                {showScriptEditor && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Textarea
                        id="card-script"
                        value={editScript}
                        onChange={(e) => setEditScript(e.target.value)}
                        onBlur={handleSaveScript}
                        placeholder="// Write custom JavaScript code here...&#10;// This script runs when the card is displayed.&#10;&#10;console.log('Card loaded!');"
                        className="min-h-[150px] font-mono text-sm resize-y"
                        disabled={isSaving}
                        data-testid="card-script-input"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Custom JavaScript code that runs when this card is displayed.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveScript}
                          disabled={isSaving || editScript === currentCard.script}
                          data-testid="save-script-btn"
                        >
                          Save Script
                        </Button>
                      </div>
                    </div>

                    {/* Script Quality Assistant */}
                    <div className="border-t border-border pt-4">
                      <Label className="text-sm font-semibold mb-3 block">
                        AI Script Assistant
                      </Label>
                      <ScriptQualityAssistant
                        script={editScript}
                        onScriptUpdate={handleScriptUpdate}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}

                {!showScriptEditor && editScript && (
                  <p className="text-xs text-muted-foreground">
                    Script configured ({editScript.split('\n').length} lines)
                  </p>
                )}
              </div>
            </div>

            {/* Choice Editor */}
            <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6">
              <ChoiceEditor
                storyStackId={storyStack.id}
                currentCardId={currentCard.id}
                availableCards={storyCards}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <StoryGraph />
        </div>
      )}
    </div>
  )
}
