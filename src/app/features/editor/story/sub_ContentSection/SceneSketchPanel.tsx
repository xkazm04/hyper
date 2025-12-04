'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import {
  Sparkles,
  Loader2,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RefreshCw,
  Upload,
  FileText,
  X,
  Pencil,
  BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/EditorContext'
import { getEffectiveArtStylePrompt } from '../sub_Story/lib/artStyleService'
import { MOOD_OPTIONS, type PromptOption } from '@/app/prompts'
import { deleteGenerations } from '@/lib/services/sketchCleanup'
import { ImageAdjustmentPanel } from './ImageAdjustmentPanel'
import { ImageInsertPanel } from './ImageInsertPanel'

// Character limits for user input
const MAX_PROMPT_LENGTH = 1500
const MIN_PROMPT_LENGTH = 100

// Fixed sizing for widescreen scenes: 1184x672
const SCENE_WIDTH = 1184
const SCENE_HEIGHT = 672

interface GeneratedImage {
  url: string
  width: number
  height: number
  prompt?: string
  generationId?: string
  imageId?: string
}

interface SceneSketchPanelProps {
  /** Story content for generating image description */
  storyContent: string
  /** Current saved image URL */
  imageUrl: string | null
  /** Current saved image prompt */
  imagePrompt: string | null
  /** Callback when image is selected */
  onImageSelect: (imageUrl: string, prompt: string) => void
  /** Callback when image is removed */
  onRemoveImage: () => void
  /** Whether saving is in progress */
  isSaving: boolean
}

type SketchMode = 'custom' | 'narrative'

/**
 * SceneSketchPanel - Compact image generation panel
 *
 * Two modes for sketching scenes:
 * 1. Custom Prompt - User enters their own description (100-1500 chars)
 * 2. From Narrative - Auto-generates description from story content and sketches directly
 *
 * Features:
 * - Art style from story stack (extracted/preset)
 * - Optional mood enhancement
 * - Phoenix 1.0 model always
 * - Fixed 1184x672 widescreen sizing
 */
export function SceneSketchPanel({
  storyContent,
  imageUrl,
  imagePrompt,
  onImageSelect,
  onRemoveImage,
  isSaving,
}: SceneSketchPanelProps) {
  const { storyStack } = useEditor()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // State
  const [sketchMode, setSketchMode] = useState<SketchMode>('custom')
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedMood, setSelectedMood] = useState<PromptOption | null>(null)
  const [moodExpanded, setMoodExpanded] = useState(false)
  const [extractorExpanded, setExtractorExpanded] = useState(false)
  const [sketches, setSketches] = useState<GeneratedImage[]>([])
  const [selectedSketchIndex, setSelectedSketchIndex] = useState<number | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationIds, setGenerationIds] = useState<string[]>([])
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)

  // Get art style prompt from story stack
  const artStylePrompt = useMemo(() => {
    if (!storyStack) return ''
    return getEffectiveArtStylePrompt(storyStack)
  }, [storyStack])

  // Validation for custom prompt mode
  const customPromptLength = customPrompt.trim().length
  const isCustomPromptValid = customPromptLength >= MIN_PROMPT_LENGTH && customPromptLength <= MAX_PROMPT_LENGTH
  const isCustomPromptTooShort = customPromptLength > 0 && customPromptLength < MIN_PROMPT_LENGTH
  const isCustomPromptTooLong = customPromptLength > MAX_PROMPT_LENGTH

  // Validation for narrative mode - needs story content
  const hasStoryContent = (storyContent?.trim()?.length || 0) > 20

  /**
   * Handle file selection for content extraction
   * Extracts scene description and populates custom prompt
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setError(null)
    setIsExtracting(true)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string
        setUploadedImageUrl(base64Url)

        // Call API to extract scene breakdown
        const response = await fetch('/api/ai/scene-breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: base64Url })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to extract scene description')
        }

        const data = await response.json()

        // Populate custom prompt with extracted description (truncate to max length)
        if (data.breakdown) {
          const truncated = data.breakdown.slice(0, MAX_PROMPT_LENGTH)
          setCustomPrompt(truncated)
          setSketchMode('custom')
        }

        setIsExtracting(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract scene description')
      setUploadedImageUrl(null)
      setIsExtracting(false)
    }
  }

  /**
   * Handle extracting from current scene image
   * Populates custom prompt
   */
  const handleExtractFromCurrent = async () => {
    if (!imageUrl) return

    setError(null)
    setIsExtracting(true)
    setUploadedImageUrl(imageUrl)

    try {
      const response = await fetch('/api/ai/scene-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to extract scene description')
      }

      const data = await response.json()

      // Populate custom prompt with extracted description (truncate to max length)
      if (data.breakdown) {
        const truncated = data.breakdown.slice(0, MAX_PROMPT_LENGTH)
        setCustomPrompt(truncated)
        setSketchMode('custom')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract scene description')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>
      await handleFileSelect(fakeEvent)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleClearExtraction = () => {
    setUploadedImageUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Generate sketches from custom prompt (user input mode)
   */
  const handleSketchFromCustomPrompt = useCallback(async () => {
    if (!isCustomPromptValid) return

    setIsGenerating(true)
    setError(null)
    setSketches([])
    setSelectedSketchIndex(null)

    try {
      // Step 1: Generate image prompt from custom description
      const promptResponse = await fetch('/api/ai/scene-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentDescription: customPrompt.trim(),
          artStylePrompt: artStylePrompt || undefined,
          moodPrompt: selectedMood?.prompt || undefined
        })
      })

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json()
        throw new Error(errorData.error || 'Failed to generate image prompt')
      }

      const promptData = await promptResponse.json()
      const imagePromptText = promptData.prompt

      if (!imagePromptText) {
        throw new Error('No image prompt generated')
      }

      // Step 2: Generate variations of the image prompt
      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePromptText, count: 3 })
      })

      if (!variationResponse.ok) {
        const errorData = await variationResponse.json()
        throw new Error(errorData.error || 'Failed to generate prompt variations')
      }

      const variationData = await variationResponse.json()
      const variations = variationData.variations || [{ variation: imagePromptText }]

      // Step 3: Generate images with Phoenix 1.0 at widescreen size
      const sketchPromises = variations.slice(0, 3).map(async (variation: { variation: string }, index: number) => {
        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: variation.variation,
            numImages: 1,
            width: SCENE_WIDTH,
            height: SCENE_HEIGHT,
            provider: 'leonardo',
            model: 'phoenix_1.0'
          })
        })

        if (!response.ok) {
          console.error(`Failed to generate sketch ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]
        return image ? {
          ...image,
          prompt: variation.variation,
          generationId: data.generationId,
          imageId: image.id
        } as GeneratedImage : null
      })

      const results = await Promise.all(sketchPromises)
      const validSketches = results.filter((s): s is GeneratedImage => s !== null)

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any sketches')
      }

      setSketches(validSketches)
      const ids = validSketches.map(s => s.generationId).filter((id): id is string => !!id)
      setGenerationIds(ids)
    } catch (err) {
      console.error('Error generating sketches:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate sketches')
    } finally {
      setIsGenerating(false)
    }
  }, [customPrompt, isCustomPromptValid, artStylePrompt, selectedMood])

  /**
   * Generate sketches directly from story narrative
   * Creates image description in background with LLM, then sketches immediately
   */
  const handleSketchFromNarrative = useCallback(async () => {
    if (!hasStoryContent) return

    setIsGenerating(true)
    setError(null)
    setSketches([])
    setSelectedSketchIndex(null)

    try {
      // Step 1: Generate image description from story content (max 1500 chars)
      const descriptionResponse = await fetch('/api/ai/image-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyContent,
          artStylePrompt: artStylePrompt || undefined,
          maxLength: MAX_PROMPT_LENGTH,
        }),
      })

      if (!descriptionResponse.ok) {
        const errorData = await descriptionResponse.json()
        throw new Error(errorData.error || 'Failed to generate image description')
      }

      const descriptionData = await descriptionResponse.json()
      let imageDescription = descriptionData.description || ''

      // Truncate if still over limit
      if (imageDescription.length > MAX_PROMPT_LENGTH) {
        imageDescription = imageDescription.slice(0, MAX_PROMPT_LENGTH)
      }

      if (!imageDescription) {
        throw new Error('No image description generated from narrative')
      }

      // Step 2: Generate image prompt from description
      const promptResponse = await fetch('/api/ai/scene-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentDescription: imageDescription,
          artStylePrompt: artStylePrompt || undefined,
          moodPrompt: selectedMood?.prompt || undefined
        })
      })

      if (!promptResponse.ok) {
        const errorData = await promptResponse.json()
        throw new Error(errorData.error || 'Failed to generate image prompt')
      }

      const promptData = await promptResponse.json()
      const imagePromptText = promptData.prompt

      if (!imagePromptText) {
        throw new Error('No image prompt generated')
      }

      // Step 3: Generate variations of the image prompt
      const variationResponse = await fetch('/api/ai/prompt-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePromptText, count: 3 })
      })

      if (!variationResponse.ok) {
        const errorData = await variationResponse.json()
        throw new Error(errorData.error || 'Failed to generate prompt variations')
      }

      const variationData = await variationResponse.json()
      const variations = variationData.variations || [{ variation: imagePromptText }]

      // Step 4: Generate images with Phoenix 1.0 at widescreen size
      const sketchPromises = variations.slice(0, 3).map(async (variation: { variation: string }, index: number) => {
        const response = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: variation.variation,
            numImages: 1,
            width: SCENE_WIDTH,
            height: SCENE_HEIGHT,
            provider: 'leonardo',
            model: 'phoenix_1.0'
          })
        })

        if (!response.ok) {
          console.error(`Failed to generate sketch ${index + 1}`)
          return null
        }

        const data = await response.json()
        const image = data.images?.[0]
        return image ? {
          ...image,
          prompt: variation.variation,
          generationId: data.generationId,
          imageId: image.id
        } as GeneratedImage : null
      })

      const results = await Promise.all(sketchPromises)
      const validSketches = results.filter((s): s is GeneratedImage => s !== null)

      if (validSketches.length === 0) {
        throw new Error('Failed to generate any sketches')
      }

      setSketches(validSketches)
      const ids = validSketches.map(s => s.generationId).filter((id): id is string => !!id)
      setGenerationIds(ids)
    } catch (err) {
      console.error('Error generating sketches from narrative:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate sketches')
    } finally {
      setIsGenerating(false)
    }
  }, [storyContent, hasStoryContent, artStylePrompt, selectedMood])

  // Select and use a sketch
  const handleUseSketch = useCallback(() => {
    if (selectedSketchIndex === null || !sketches[selectedSketchIndex]) return

    const sketch = sketches[selectedSketchIndex]
    onImageSelect(sketch.url, sketch.prompt || '')

    // Cleanup unused generations
    const selectedGenerationId = sketch.generationId
    const unusedIds = generationIds.filter(id => id !== selectedGenerationId)
    if (unusedIds.length > 0) {
      deleteGenerations(unusedIds)
    }

    // Reset state
    setSketches([])
    setSelectedSketchIndex(null)
    setGenerationIds([])
  }, [selectedSketchIndex, sketches, onImageSelect, generationIds])

  // Start over - discard sketches
  const handleStartOver = useCallback(() => {
    if (generationIds.length > 0) {
      deleteGenerations(generationIds)
    }
    setSketches([])
    setSelectedSketchIndex(null)
    setGenerationIds([])
  }, [generationIds])

  return (
    <div className="space-y-4">
      {/* Current Image Display */}
      {imageUrl && (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">Current Scene</Label>
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemoveImage}
                disabled={isSaving}
                className="h-6 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Remove
              </Button>
            </div>

            <div className="relative rounded-lg overflow-hidden border-2 border-border bg-muted">
              <div className="aspect-[16/9]">
                <img
                  src={imageUrl}
                  alt="Scene image"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {imagePrompt && (
              <p className="text-[10px] text-muted-foreground italic line-clamp-2">
                {imagePrompt}
              </p>
            )}
          </div>

          {/* Image Adjustment Panel - Bria AI */}
          <ImageAdjustmentPanel
            imageUrl={imageUrl}
            onImageUpdate={(newUrl) => onImageSelect(newUrl, imagePrompt || '')}
            disabled={isSaving}
          />

          {/* Image Insert Panel - Gemini AI Character Insertion */}
          <ImageInsertPanel
            imageUrl={imageUrl}
            onImageUpdate={(newUrl) => onImageSelect(newUrl, imagePrompt || '')}
            disabled={isSaving}
          />
        </div>
      )}

      {/* Sketch Generation Section */}
      {sketches.length === 0 && (
        <div className="space-y-3">
          {/* Mode Selector - Two buttons side by side */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSketchMode('custom')}
              disabled={isGenerating || isExtracting}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all',
                sketchMode === 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
              )}
            >
              <Pencil className="w-3.5 h-3.5" />
              Custom Prompt
            </button>
            <button
              onClick={() => setSketchMode('narrative')}
              disabled={isGenerating || isExtracting}
              className={cn(
                'flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all',
                sketchMode === 'narrative'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              From Narrative
            </button>
          </div>

          {/* Custom Prompt Mode */}
          {sketchMode === 'custom' && (
            <div className="space-y-3">
              {/* Content Extractor Section */}
              <div className="space-y-2">
                <button
                  onClick={() => setExtractorExpanded(!extractorExpanded)}
                  className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isGenerating || isExtracting}
                >
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Extract from Image</span>
                  </span>
                  {extractorExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {extractorExpanded && (
                  <div className="space-y-2 p-2 bg-muted/50 rounded-lg border border-border">
                    {!uploadedImageUrl ? (
                      <>
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          className={cn(
                            'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
                            'hover:border-primary/50 hover:bg-primary/5',
                            isExtracting && 'opacity-50 cursor-not-allowed'
                          )}
                          onClick={() => !isExtracting && fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isExtracting}
                          />
                          <div className="flex flex-col items-center gap-1.5">
                            {isExtracting ? (
                              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                            ) : (
                              <Upload className="w-5 h-5 text-muted-foreground" />
                            )}
                            <p className="text-[10px] text-muted-foreground">
                              {isExtracting ? 'Extracting...' : 'Drop image or click to upload'}
                            </p>
                          </div>
                        </div>

                        {/* Extract from current image */}
                        {imageUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExtractFromCurrent}
                            disabled={isExtracting}
                            className="w-full h-7 text-[10px]"
                          >
                            <Sparkles className="w-3 h-3 mr-1" />
                            Extract from Current Scene
                          </Button>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative rounded-lg border border-border overflow-hidden">
                          <img
                            src={uploadedImageUrl}
                            alt="Source for extraction"
                            className="w-full h-20 object-cover"
                          />
                          <button
                            onClick={handleClearExtraction}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 hover:bg-background"
                            disabled={isExtracting}
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {isExtracting && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 animate-spin" />
                            </div>
                          )}
                        </div>
                        {!isExtracting && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleClearExtraction}
                            className="w-full h-6 text-[10px]"
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Try Another Image
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Custom Prompt Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Scene Description
                  </Label>
                  <span className={cn(
                    'text-[10px]',
                    isCustomPromptTooLong ? 'text-destructive' :
                    isCustomPromptTooShort ? 'text-amber-500' : 'text-muted-foreground'
                  )}>
                    {customPromptLength}/{MAX_PROMPT_LENGTH}
                  </span>
                </div>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value.length <= MAX_PROMPT_LENGTH) {
                      setCustomPrompt(value)
                    }
                  }}
                  placeholder="Describe the visual scene you want to generate (100-1500 characters)..."
                  disabled={isGenerating || isSaving || isExtracting}
                  className={cn(
                    'min-h-[100px] text-xs resize-none',
                    isExtracting && 'opacity-50',
                    isCustomPromptTooLong && 'border-destructive',
                    isCustomPromptTooShort && 'border-amber-500'
                  )}
                />
                {isCustomPromptTooShort && (
                  <p className="text-[10px] text-amber-500">
                    Minimum {MIN_PROMPT_LENGTH} characters required ({MIN_PROMPT_LENGTH - customPromptLength} more needed)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Narrative Mode */}
          {sketchMode === 'narrative' && (
            <div className="space-y-2 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">Auto-generate from story</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                This mode automatically creates an image description from your story content and sketches the scene directly.
                No manual input needed.
              </p>
              {!hasStoryContent && (
                <p className="text-[10px] text-amber-500">
                  Add story content to use this mode
                </p>
              )}
              {hasStoryContent && (
                <p className="text-[10px] text-green-600">
                  ✓ Story content ready ({storyContent.trim().length} chars)
                </p>
              )}
            </div>
          )}

          {/* Mood Selector (Optional) */}
          <div className="space-y-2">
            <button
              onClick={() => setMoodExpanded(!moodExpanded)}
              className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              disabled={isGenerating}
            >
              <span className="flex items-center gap-1.5">
                <span>✨</span>
                <span>Mood (optional)</span>
                {selectedMood && (
                  <span className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px]">
                    {selectedMood.label}
                  </span>
                )}
              </span>
              {moodExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {moodExpanded && (
              <div className="grid grid-cols-2 gap-1.5 p-2 bg-muted/50 rounded-lg border border-border">
                {MOOD_OPTIONS.map((mood) => {
                  const isSelected = selectedMood?.id === mood.id
                  return (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(isSelected ? null : mood)}
                      disabled={isGenerating}
                      className={cn(
                        "flex items-center gap-1.5 px-2 py-1.5 text-[10px] rounded-md transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border hover:border-primary/50"
                      )}
                    >
                      <span>{mood.icon}</span>
                      <span className="truncate">{mood.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-2 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-[10px] text-destructive">{error}</p>
            </div>
          )}

          {/* Single Sketch Button - behavior depends on selected mode */}
          <Button
            onClick={sketchMode === 'custom' ? handleSketchFromCustomPrompt : handleSketchFromNarrative}
            disabled={
              isGenerating ||
              isSaving ||
              isExtracting ||
              (sketchMode === 'custom' && !isCustomPromptValid) ||
              (sketchMode === 'narrative' && !hasStoryContent)
            }
            className="w-full h-9 text-xs border-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Sketching...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Sketch Image
              </>
            )}
          </Button>

          {/* Helpful hints based on mode */}
          {sketchMode === 'custom' && !isCustomPromptValid && customPromptLength === 0 && (
            <p className="text-[10px] text-muted-foreground text-center">
              Describe your scene or extract from an image above
            </p>
          )}
        </div>
      )}

      {/* Sketches Column Layout */}
      {sketches.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Select a Sketch</Label>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleStartOver}
              disabled={isGenerating}
              className="h-6 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Start Over
            </Button>
          </div>

          {/* Column layout for larger sketch previews */}
          <div className="flex flex-col gap-3">
            {sketches.map((sketch, index) => {
              const isSelected = selectedSketchIndex === index
              return (
                <button
                  key={index}
                  onClick={() => setSelectedSketchIndex(index)}
                  className={cn(
                    "relative rounded-lg overflow-hidden border-2 transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="aspect-[16/9]">
                    <img
                      src={sketch.url}
                      alt={`Sketch ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <Check className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black/70 rounded px-2 py-1">
                    <span className="text-xs text-white font-medium">Option {index + 1}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Use Selected Sketch */}
          {selectedSketchIndex !== null && (
            <Button
              onClick={handleUseSketch}
              disabled={isSaving}
              className="w-full h-10 text-sm border-2"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Use Selected Sketch
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
