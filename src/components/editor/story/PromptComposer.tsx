'use client'

import { useState, useMemo } from 'react'
import { Wand2, Copy, Check, RotateCcw, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  PROMPT_COLUMNS,
  PromptDimension,
  PromptOption,
  dimensionOptions,
  composePrompt,
} from '@/lib/promptComposer'

interface GeneratedImage {
  url: string
  width: number
  height: number
}

interface PromptComposerProps {
  onImageSelect?: (imageUrl: string, prompt: string) => void
  isGenerating?: boolean
}

interface SelectionState {
  style?: PromptOption
  setting?: PromptOption
  mood?: PromptOption
}

export default function PromptComposer({
  onImageSelect,
  isGenerating: externalGenerating = false,
}: PromptComposerProps) {
  const [selections, setSelections] = useState<SelectionState>({})
  const [copied, setCopied] = useState(false)
  const [expandedColumn, setExpandedColumn] = useState<PromptDimension | null>('style')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = (dimension: PromptDimension, option: PromptOption) => {
    setSelections((prev) => {
      // Toggle selection
      const isSelected = prev[dimension]?.id === option.id
      const next = isSelected
        ? { ...prev, [dimension]: undefined }
        : { ...prev, [dimension]: option }

      return next
    })
    // Clear previous images when changing selections
    setGeneratedImages([])
    setSelectedImageIndex(null)
    setError(null)
  }

  const handleClear = () => {
    setSelections({})
    setGeneratedImages([])
    setSelectedImageIndex(null)
    setError(null)
  }

  const handleCopyPrompt = async () => {
    const prompt = composePrompt(selections)
    if (prompt) {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleGenerate = async () => {
    const prompt = composePrompt(selections)
    if (!prompt) return

    setIsGenerating(true)
    setError(null)
    setGeneratedImages([])
    setSelectedImageIndex(null)

    try {
      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          numImages: 2,
          width: 512,
          height: 512,
          provider: 'bria',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const data = await response.json()
      setGeneratedImages(data.images || [])
    } catch (err) {
      console.error('Error generating images:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate images')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectImage = (index: number) => {
    setSelectedImageIndex(index)
  }

  const handleConfirmSelection = () => {
    if (selectedImageIndex !== null && generatedImages[selectedImageIndex]) {
      const selectedImage = generatedImages[selectedImageIndex]
      const prompt = composePrompt(selections)
      onImageSelect?.(selectedImage.url, prompt)
      // Clear state after selection
      setGeneratedImages([])
      setSelectedImageIndex(null)
    }
  }

  const finalPrompt = useMemo(() => composePrompt(selections), [selections])
  const hasSelections = Object.values(selections).some(Boolean)

  const toggleColumn = (columnId: PromptDimension) => {
    setExpandedColumn(prev => prev === columnId ? null : columnId)
  }

  const loading = isGenerating || externalGenerating

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary/10 border-2 border-border flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-bold">Image Prompt Builder</h4>
            <p className="text-xs text-muted-foreground">Select options to compose a prompt</p>
          </div>
        </div>

        {hasSelections && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="text-xs"
            disabled={loading}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Columns */}
      <div className="space-y-2">
        {PROMPT_COLUMNS.map((column) => {
          const options = dimensionOptions[column.id]
          const selected = selections[column.id]
          const isExpanded = expandedColumn === column.id

          return (
            <div
              key={column.id}
              className="border-2 border-border rounded-lg bg-card overflow-hidden"
            >
              {/* Column Header */}
              <button
                onClick={() => toggleColumn(column.id)}
                className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                disabled={loading}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{column.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold">{column.label}</div>
                    {selected && (
                      <div className="text-xs text-primary flex items-center gap-1">
                        <span>{selected.icon}</span>
                        <span>{selected.label}</span>
                      </div>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Options Grid */}
              {isExpanded && (
                <div className="border-t border-border p-2 bg-muted/30">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {options.map((option) => {
                      const isSelected = selected?.id === option.id

                      return (
                        <button
                          key={option.id}
                          onClick={() => handleSelect(column.id, option)}
                          disabled={loading}
                          className={cn(
                            'flex flex-col items-center gap-1 p-2 rounded border-2 transition-all text-center',
                            'hover:bg-muted active:scale-[0.98]',
                            isSelected
                              ? 'bg-primary/10 border-primary shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                              : 'border-border hover:border-border/80',
                            loading && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span className="text-lg">{option.icon}</span>
                          <span className="text-[10px] font-medium leading-tight">
                            {option.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Generated Images Grid */}
      {generatedImages.length > 0 && (
        <div className="border-2 border-border rounded-lg bg-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Select an Image
            </span>
            <span className="text-xs text-muted-foreground">
              {generatedImages.length} generated
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {generatedImages.map((image, index) => (
              <button
                key={index}
                onClick={() => handleSelectImage(index)}
                className={cn(
                  'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                  'hover:opacity-90 active:scale-[0.98]',
                  selectedImageIndex === index
                    ? 'border-primary shadow-[3px_3px_0px_0px_hsl(var(--primary))]'
                    : 'border-border hover:border-border/80'
                )}
              >
                <img
                  src={image.url}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedImageIndex === index && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Confirm Selection Button */}
          {selectedImageIndex !== null && (
            <Button
              onClick={handleConfirmSelection}
              className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
            >
              <Check className="w-4 h-4 mr-2" />
              Use Selected Image
            </Button>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="border-2 border-destructive/50 rounded-lg bg-destructive/10 p-3">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Prompt Preview */}
      {hasSelections && generatedImages.length === 0 && (
        <div className="border-2 border-border rounded-lg bg-muted/50 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Generated Prompt
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyPrompt}
              className="h-6 text-xs"
              disabled={loading}
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-foreground leading-relaxed line-clamp-4">
            {finalPrompt.substring(0, 300)}
            {finalPrompt.length > 300 ? '...' : ''}
          </p>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !finalPrompt}
            className="w-full border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Images
              </>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!hasSelections && (
        <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground">
            Select options above to build your image prompt
          </p>
        </div>
      )}
    </div>
  )
}
