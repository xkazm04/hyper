'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Loader2, Check, ImageIcon, Sparkles, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { getEffectiveArtStylePrompt } from '../lib/artStyleService'
import { deleteGenerations } from '@/lib/services/sketchCleanup'

interface GeneratedCover {
  url: string
  id?: string
  generationId?: string
}

export function DescriptionTab() {
  const { storyStack, setStoryStack } = useEditor()
  const { success, error: showError } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Form state
  const [name, setName] = useState(storyStack?.name || '')
  const [description, setDescription] = useState(storyStack?.description || '')
  const [isSaving, setIsSaving] = useState(false)

  // Text generation state
  const [isGeneratingText, setIsGeneratingText] = useState(false)

  // Cover image generation state
  const [isGeneratingCover, setIsGeneratingCover] = useState(false)
  const [generatedCovers, setGeneratedCovers] = useState<GeneratedCover[]>([])
  const [selectedCoverIndex, setSelectedCoverIndex] = useState<number | null>(null)
  const [generationIds, setGenerationIds] = useState<string[]>([])

  // Check if art style is configured
  const hasArtStyle = !!(storyStack?.artStyleId || storyStack?.customArtStylePrompt)

  // Sync local state when storyStack changes from external sources
  useEffect(() => {
    if (storyStack) {
      setName(storyStack.name || '')
      setDescription(storyStack.description || '')
    }
  }, [storyStack?.id]) // Only sync on stack ID change, not every update

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [description])

  const hasChanges =
    name !== (storyStack?.name || '') ||
    description !== (storyStack?.description || '')

  // Optimistic save for name and description
  const handleSave = useCallback(async () => {
    if (!storyStack || !hasChanges) return

    if (!name.trim()) {
      showError('Story name is required')
      return
    }

    // Optimistic update - immediately update UI
    const previousStack = { ...storyStack }
    setStoryStack({
      ...storyStack,
      name: name.trim(),
      description: description || null,
      updatedAt: new Date().toISOString(),
    })

    setIsSaving(true)
    try {
      const response = await fetch(`/api/stories/${storyStack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description || null
        })
      })

      if (!response.ok) {
        // Rollback on error
        setStoryStack(previousStack)
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      success('Story details saved')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [storyStack, name, description, hasChanges, setStoryStack, success, showError])

  // Generate name and description using LLM
  const handleGenerateText = useCallback(async () => {
    setIsGeneratingText(true)
    try {
      const response = await fetch('/api/ai/generate-story-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'both',
          userInput: description || name || undefined,
          currentName: name || undefined,
          currentDescription: description || undefined,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate')
      }

      const data = await response.json()

      if (data.name) setName(data.name)
      if (data.description) setDescription(data.description)

      success('Story details generated')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate story details')
    } finally {
      setIsGeneratingText(false)
    }
  }, [name, description, success, showError])

  // Generate cover images
  const handleGenerateCover = useCallback(async () => {
    if (!storyStack || !hasArtStyle) return

    // Cleanup previous generations
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }

    setIsGeneratingCover(true)
    setGeneratedCovers([])
    setSelectedCoverIndex(null)
    setGenerationIds([])

    try {
      // Get art style and story concept
      const artStylePrompt = getEffectiveArtStylePrompt(storyStack)
      const storyConcept = description || storyStack.description || name || storyStack.name || 'An adventure story'

      // Step 1: Use LLM to compose an optimized cover prompt
      const composeResponse = await fetch('/api/ai/compose-cover-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyConcept,
          artStyle: artStylePrompt,
        })
      })

      if (!composeResponse.ok) {
        const data = await composeResponse.json()
        throw new Error(data.error || 'Failed to compose cover prompt')
      }

      const { prompt: coverPrompt } = await composeResponse.json()

      // Step 2: Generate 4 image variants using the LLM-composed prompt
      const newGenerationIds: string[] = []

      const promises = Array.from({ length: 4 }).map(async (_, index) => {
        const variation = index === 0 ? '' : ` Variation ${index + 1}.`

        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: coverPrompt + variation,
            numImages: 1,
            width: 1024,
            height: 1024, // 1:1 ratio for Lucide Origin model
            model: 'lucide_origin',
          })
        })

        if (!response.ok) {
          console.error(`Failed to generate cover ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]

        if (image) {
          if (data.generationId) {
            newGenerationIds.push(data.generationId)
          }
          return {
            url: image.url,
            id: image.id,
            generationId: data.generationId,
          } as GeneratedCover
        }
        return null
      })

      const results = await Promise.all(promises)
      const validCovers = results.filter((c): c is GeneratedCover => c !== null)

      if (validCovers.length === 0) {
        throw new Error('Failed to generate any cover images')
      }

      setGenerationIds(newGenerationIds)
      setGeneratedCovers(validCovers)

    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate cover images')
    } finally {
      setIsGeneratingCover(false)
    }
  }, [storyStack, hasArtStyle, description, name, generationIds, showError])

  // Clear generated covers
  const handleClearCovers = useCallback(() => {
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }
    setGeneratedCovers([])
    setSelectedCoverIndex(null)
    setGenerationIds([])
  }, [generationIds])

  // Set selected cover as the story cover
  const handleSetCover = useCallback(async () => {
    if (!storyStack || selectedCoverIndex === null || !generatedCovers[selectedCoverIndex]) return

    const selectedCover = generatedCovers[selectedCoverIndex]

    // Optimistic update
    const previousStack = { ...storyStack }
    setStoryStack({
      ...storyStack,
      coverImageUrl: selectedCover.url,
      updatedAt: new Date().toISOString(),
    })

    try {
      // Delete unused generations
      const unusedGenerationIds = generationIds.filter(
        id => id !== selectedCover.generationId
      )
      if (unusedGenerationIds.length > 0) {
        deleteGenerations(unusedGenerationIds)
      }

      // Save to database
      const response = await fetch(`/api/stories/${storyStack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_image_url: selectedCover.url
        })
      })

      if (!response.ok) {
        setStoryStack(previousStack)
        const data = await response.json()
        throw new Error(data.error || 'Failed to save cover')
      }

      setGeneratedCovers([])
      setSelectedCoverIndex(null)
      setGenerationIds([])
      success('Cover image saved')

    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save cover image')
    }
  }, [storyStack, selectedCoverIndex, generatedCovers, generationIds, setStoryStack, success, showError])

  // Remove current cover
  const handleRemoveCover = useCallback(async () => {
    if (!storyStack || !storyStack.coverImageUrl) return

    const previousStack = { ...storyStack }
    setStoryStack({
      ...storyStack,
      coverImageUrl: null,
      updatedAt: new Date().toISOString(),
    })

    try {
      const response = await fetch(`/api/stories/${storyStack.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cover_image_url: null
        })
      })

      if (!response.ok) {
        setStoryStack(previousStack)
        throw new Error('Failed to remove cover')
      }

      success('Cover image removed')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove cover image')
    }
  }, [storyStack, setStoryStack, success, showError])

  if (!storyStack) return null

  const isLoading = isSaving || isGeneratingText || isGeneratingCover

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Story Details</h2>
          <p className="text-xs text-muted-foreground">
            Basic information about your story
          </p>
        </div>
      </div>

      {/* Story Name */}
      <div className="space-y-2">
        <Label htmlFor="story-name" className="text-sm font-medium">
          Story Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="story-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter story name..."
          className="text-sm"
          disabled={isLoading}
          data-testid="story-name-input"
        />
        <p className="text-[10px] text-muted-foreground">
          The title of your story shown in the dashboard and when shared
        </p>
      </div>

      {/* Story Description */}
      <div className="space-y-2">
        <Label htmlFor="story-description" className="text-sm font-medium">
          Description
        </Label>
        <textarea
          ref={textareaRef}
          id="story-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your story in a few sentences..."
          className={cn(
            'w-full min-h-[100px] px-3 py-2 text-sm rounded-md',
            'bg-background border border-input',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-none overflow-hidden'
          )}
          disabled={isLoading}
          data-testid="story-description-input"
        />
        <p className="text-[10px] text-muted-foreground">
          A brief summary shown in the story list and when sharing
        </p>
      </div>

      {/* Generate Text Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerateText}
        disabled={isLoading}
        className="w-full"
        data-testid="generate-text-btn"
      >
        {isGeneratingText ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Name & Description with AI
          </>
        )}
      </Button>

      {/* Cover Image Section */}
      <div className="space-y-3 pt-4 border-t border-border">
        <Label className="text-sm font-medium">Cover Image</Label>

        {/* Current Cover or Placeholder */}
        {storyStack.coverImageUrl ? (
          <div className="relative group aspect-square max-w-[300px] mx-auto">
            <img
              src={storyStack.coverImageUrl}
              alt="Story cover"
              className="w-full h-full object-cover rounded-lg border border-border"
            />
            <button
              onClick={handleRemoveCover}
              disabled={isLoading}
              className={cn(
                'absolute top-2 right-2 p-1.5 rounded-full',
                'bg-destructive/80 text-destructive-foreground',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                'hover:bg-destructive'
              )}
              title="Remove cover"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : generatedCovers.length === 0 ? (
          <div
            className={cn(
              'aspect-square max-w-[300px] mx-auto rounded-lg border-2 border-dashed border-border',
              'flex flex-col items-center justify-center gap-2',
              'bg-muted/30 text-muted-foreground'
            )}
          >
            <ImageIcon className="w-10 h-10 opacity-30" />
            {hasArtStyle ? (
              <>
                <p className="text-xs">No cover image set</p>
                <p className="text-[10px] opacity-70">
                  Generate a cover using your story's art style
                </p>
              </>
            ) : (
              <>
                <p className="text-xs">Art style required</p>
                <p className="text-[10px] opacity-70">
                  Set an art style in the Art Style tab to generate covers
                </p>
              </>
            )}
          </div>
        ) : null}

        {/* Generated Covers Grid */}
        {generatedCovers.length > 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {generatedCovers.map((cover, index) => (
                <button
                  key={cover.id || index}
                  onClick={() => setSelectedCoverIndex(index)}
                  disabled={isLoading}
                  className={cn(
                    'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                    selectedCoverIndex === index
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <img
                    src={cover.url}
                    alt={`Cover option ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedCoverIndex === index && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-10 h-10 text-primary" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Cover Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCovers}
                disabled={isLoading}
                className="flex-1"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
              <Button
                size="sm"
                onClick={handleSetCover}
                disabled={isLoading || selectedCoverIndex === null}
                className="flex-1"
              >
                <Check className="w-3 h-3 mr-1" />
                Use Selected
              </Button>
            </div>
          </div>
        )}

        {/* Generate Cover Button */}
        {generatedCovers.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateCover}
            disabled={isLoading || !hasArtStyle}
            className="w-full"
            data-testid="generate-cover-btn"
          >
            {isGeneratingCover ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating covers...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Cover Images
              </>
            )}
          </Button>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
        {hasChanges && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
        <Button
          onClick={handleSave}
          disabled={isLoading || !hasChanges}
          size="sm"
          className="min-w-[80px]"
          data-testid="story-save-btn"
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
