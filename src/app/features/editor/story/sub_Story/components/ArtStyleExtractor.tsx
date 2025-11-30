'use client'

import { useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Upload, Loader2, Sparkles, Image as ImageIcon, X, RefreshCw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ArtStyleExtractorProps {
  customPrompt: string | null
  extractedImageUrl: string | null
  onExtract: (imageUrl: string, prompt: string) => void
  onCustomPromptChange: (prompt: string) => void
  onClear: () => void
  disabled?: boolean
}

export function ArtStyleExtractor({
  customPrompt,
  extractedImageUrl,
  onExtract,
  onCustomPromptChange,
  onClear,
  disabled = false
}: ArtStyleExtractorProps) {
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(extractedImageUrl)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCopyToClipboard = async () => {
    if (!customPrompt) return
    try {
      await navigator.clipboard.writeText(customPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = customPrompt
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setError(null)
    setIsExtracting(true)

    try {
      // Convert to base64 for display
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string
        setUploadedImageUrl(base64Url)

        // Call API to extract art style
        const response = await fetch('/api/art-style/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: base64Url })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to extract art style')
        }

        const data = await response.json()
        onExtract(base64Url, data.prompt)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract art style')
      setUploadedImageUrl(null)
    } finally {
      setIsExtracting(false)
    }
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files?.[0]
    if (file) {
      // Create a fake event for reuse
      const fakeEvent = {
        target: { files: [file] }
      } as unknown as React.ChangeEvent<HTMLInputElement>
      await handleFileSelect(fakeEvent)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleClear = () => {
    setUploadedImageUrl(null)
    setError(null)
    onClear()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Custom Art Style
      </Label>

      {/* Image Upload Area */}
      {!uploadedImageUrl ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
            'hover:border-primary/50 hover:bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-destructive'
          )}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              {isExtracting ? (
                <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isExtracting ? 'Extracting art style...' : 'Upload an image'}
              </p>
              <p className="text-xs text-muted-foreground">
                Drop image here or click to browse
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Uploaded Image Preview */
        <div className="relative rounded-lg border-2 border-border overflow-hidden">
          <img
            src={uploadedImageUrl}
            alt="Uploaded style reference"
            className="w-full h-32 object-cover"
          />
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground"
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/80 text-xs font-medium">
            <ImageIcon className="w-3 h-3 inline mr-1" />
            Style Reference
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Custom Prompt Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">
            {uploadedImageUrl ? 'Extracted Style (editable)' : 'Or write custom style prompt'}
          </Label>
          <div className="flex items-center gap-1">
            {customPrompt && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  disabled={disabled}
                  className="h-6 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-green-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={disabled}
                  className="h-6 text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </>
            )}
          </div>
        </div>
        <Textarea
          value={customPrompt || ''}
          onChange={(e) => onCustomPromptChange(e.target.value)}
          placeholder="Describe the visual art style you want for all images in this story..."
          className="min-h-[270px] text-xs resize-none"
          disabled={disabled || isExtracting}
        />
        <p className="text-[10px] text-muted-foreground">
          This style will be applied to all card images in your story
        </p>
      </div>
    </div>
  )
}
