'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  User, 
  ImageIcon, 
  Upload, 
  Loader2, 
  Sparkles, 
  X, 
  RefreshCw,
  FileText
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Character } from '@/lib/types'

interface DetailSectionProps {
  character: Character
  storyStackId: string
  isSaving: boolean
  onUpdateCharacter: (updates: Partial<Character>) => Promise<void>
}

export function DetailSection({
  character,
  storyStackId,
  isSaving,
  onUpdateCharacter,
}: DetailSectionProps) {
  const [editName, setEditName] = useState('')
  const [editAppearance, setEditAppearance] = useState('')
  
  // Character Extractor state
  const [isExtracting, setIsExtracting] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync local state when character changes
  useEffect(() => {
    setEditName(character.name || '')
    setEditAppearance(character.appearance || '')
  }, [character.id])

  const handleSaveName = async () => {
    if (editName === character.name) return
    await onUpdateCharacter({ name: editName })
  }

  const handleSaveAppearance = async () => {
    if (editAppearance === character.appearance) return
    await onUpdateCharacter({ appearance: editAppearance })
  }

  const hasImages = character.imageUrls && character.imageUrls.length > 0
  const hasAvatar = !!character.avatarUrl
  const totalImages = character.imageUrls?.length || 0

  /**
   * Handle file selection for character description extraction
   */
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setExtractionError('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setExtractionError('Image must be less than 10MB')
      return
    }

    setExtractionError(null)
    setIsExtracting(true)

    try {
      // Convert to base64 for display and API
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64Url = e.target?.result as string
        setUploadedImageUrl(base64Url)

        // Call API to extract character description
        const response = await fetch('/api/character/extract-description', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: base64Url })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to extract character description')
        }

        const data = await response.json()
        
        // Prefill the appearance field with extracted description
        setEditAppearance(data.description)
        setIsExtracting(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : 'Failed to extract character description')
      setUploadedImageUrl(null)
      setIsExtracting(false)
    }
  }

  /**
   * Handle extracting from existing character image
   */
  const handleExtractFromExisting = async (imageUrl: string) => {
    setExtractionError(null)
    setIsExtracting(true)
    setUploadedImageUrl(imageUrl)

    try {
      const response = await fetch('/api/character/extract-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to extract character description')
      }

      const data = await response.json()
      setEditAppearance(data.description)
    } catch (err) {
      setExtractionError(err instanceof Error ? err.message : 'Failed to extract character description')
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
    setExtractionError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Character Details Editor */}
      <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6">
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="character-name" className="text-sm font-semibold">
              Character Name
            </Label>
            <Input
              id="character-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              placeholder="Enter character name..."
              className="text-lg font-semibold"
              disabled={isSaving}
              data-testid="character-name-input"
            />
          </div>

          {/* Appearance Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="character-appearance" className="text-sm font-semibold">
                Appearance Description
              </Label>
              <span className="text-xs text-muted-foreground">
                {editAppearance.length} characters
              </span>
            </div>
            <Textarea
              id="character-appearance"
              value={editAppearance}
              onChange={(e) => setEditAppearance(e.target.value)}
              onBlur={handleSaveAppearance}
              placeholder="Describe the character's appearance..."
              className="min-h-[200px] resize-y"
              disabled={isSaving}
              data-testid="character-appearance-input"
            />
            <p className="text-xs text-muted-foreground">
              Describe how this character looks. This will help generate consistent imagery.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
            <span>
              <ImageIcon className="w-4 h-4 inline mr-1" />
              {totalImages}/10 images
            </span>
            <span>
              <User className="w-4 h-4 inline mr-1" />
              {hasAvatar ? 'Avatar set' : 'No avatar'}
            </span>
          </div>
        </div>
      </div>

      {/* Character Description Extractor */}
      <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6 space-y-4">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Character Extractor
        </Label>
        <p className="text-xs text-muted-foreground">
          Upload an image or use an existing character image to automatically extract appearance details.
        </p>

        {/* Image Upload Area */}
        {!uploadedImageUrl ? (
          <div className="space-y-3">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
                'hover:border-primary/50 hover:bg-primary/5',
                isSaving && 'opacity-50 cursor-not-allowed',
                extractionError && 'border-destructive'
              )}
              onClick={() => !isSaving && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isSaving}
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
                    {isExtracting ? 'Extracting character details...' : 'Upload an image'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Drop image here or click to browse
                  </p>
                </div>
              </div>
            </div>

            {/* Extract from existing images */}
            {hasImages && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  Or extract from existing character images:
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {character.imageUrls.map((url, index) => (
                    <button
                      key={index}
                      onClick={() => handleExtractFromExisting(url)}
                      disabled={isSaving || isExtracting}
                      className={cn(
                        'flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all',
                        'hover:border-primary/50 hover:ring-2 hover:ring-primary/20',
                        'border-border',
                        (isSaving || isExtracting) && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <img
                        src={url}
                        alt={`Extract from image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Uploaded Image Preview */
          <div className="space-y-3">
            <div className="relative rounded-lg border-2 border-border overflow-hidden">
              <img
                src={uploadedImageUrl}
                alt="Source image for extraction"
                className="w-full h-32 object-cover"
              />
              <button
                onClick={handleClearExtraction}
                className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground"
                disabled={isSaving || isExtracting}
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/80 text-xs font-medium flex items-center gap-1">
                {isExtracting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    <FileText className="w-3 h-3" />
                    Source Image
                  </>
                )}
              </div>
            </div>
            
            {!isExtracting && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearExtraction}
                  className="flex-1"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Another
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveAppearance}
                  disabled={isSaving || editAppearance === character.appearance}
                  className="flex-1"
                >
                  Save Description
                </Button>
              </div>
            )}
          </div>
        )}

        {extractionError && (
          <p className="text-xs text-destructive">{extractionError}</p>
        )}
      </div>
    </div>
  )
}
