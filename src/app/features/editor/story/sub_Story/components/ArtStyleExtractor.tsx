'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUploadArea } from './shared'

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
  const [isHalloweenTheme, setIsHalloweenTheme] = useState(false)

  // Check for halloween theme class on document
  useEffect(() => {
    const checkTheme = () => {
      setIsHalloweenTheme(document.documentElement.classList.contains('halloween'))
    }
    checkTheme()

    // Watch for class changes on html element
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    return () => observer.disconnect()
  }, [])

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

  const handleFileSelect = useCallback(async (file: File) => {
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
        setIsExtracting(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract art style')
      setUploadedImageUrl(null)
      setIsExtracting(false)
    }
  }, [onExtract])

  const handleClear = useCallback(() => {
    setUploadedImageUrl(null)
    setError(null)
    onClear()
  }, [onClear])

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4" />
        Custom Art Style
      </Label>

      {/* Image Upload Area */}
      <ImageUploadArea
        onFileSelect={handleFileSelect}
        isLoading={isExtracting}
        disabled={disabled}
        error={error}
        uploadedImageUrl={uploadedImageUrl}
        onClear={handleClear}
        uploadLabel={isExtracting ? 'Extracting art style...' : 'Upload an image'}
        uploadHint="Drop image here or click to browse"
        previewLabel="Style Reference"
      />

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
        <div className="relative">
          {/* Halloween theme skull background */}
          {isHalloweenTheme && (
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.03] bg-no-repeat bg-center bg-contain z-0"
              style={{ backgroundImage: 'url(/decorative/skull.svg)' }}
              aria-hidden="true"
            />
          )}
          <Textarea
            value={customPrompt || ''}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Describe the visual art style you want for all images in this story..."
            className={cn(
              'min-h-[270px] text-xs resize-none relative z-10',
              isHalloweenTheme && 'bg-transparent'
            )}
            disabled={disabled || isExtracting}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">
          This style will be applied to all card images in your story
        </p>
      </div>
    </div>
  )
}
