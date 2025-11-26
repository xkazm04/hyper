'use client'

import { useState, useEffect } from 'react'
import { User, ImageIcon, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Character } from '@/lib/types'

interface PreviewSectionProps {
  character: Character
  storyStackId: string
  isSaving: boolean
  onUpdateCharacter: (updates: Partial<Character>) => Promise<void>
}

export function PreviewSection({
  character,
  storyStackId,
  isSaving,
  onUpdateCharacter,
}: PreviewSectionProps) {
  const [editName, setEditName] = useState('')
  const [editAppearance, setEditAppearance] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Sync local state when character changes
  useEffect(() => {
    setEditName(character.name || '')
    setEditAppearance(character.appearance || '')
    setCurrentImageIndex(0)
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

  const goToPrevImage = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1))
  }

  const goToNextImage = () => {
    setCurrentImageIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0))
  }

  return (
    <div className="space-y-6">
      {/* Character Preview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Image Preview */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Character Images</Label>
          {hasImages ? (
            <div className="space-y-2">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-border bg-muted">
                <img
                  src={character.imageUrls[currentImageIndex]}
                  alt={`${character.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Image Navigation */}
                {totalImages > 1 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={goToPrevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {/* Image Counter */}
                <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded text-xs font-medium">
                  {currentImageIndex + 1} / {totalImages}
                </div>
              </div>
              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {character.imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                      index === currentImageIndex
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="aspect-[3/4] flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-border">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No images yet</p>
                <p className="text-xs text-muted-foreground">
                  Use the Image Generator tab to create character images
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Avatar Preview */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Avatar</Label>
          {hasAvatar ? (
            <div className="space-y-2">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-border bg-muted mx-auto">
                <img
                  src={character.avatarUrl!}
                  alt={`${character.name} avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
              {character.avatarPrompt && (
                <p className="text-xs text-muted-foreground italic text-center">
                  {character.avatarPrompt.substring(0, 50)}...
                </p>
              )}
            </div>
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-muted/50 rounded-lg border-2 border-dashed border-border mx-auto">
              <div className="text-center">
                <User className="w-8 h-8 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No avatar</p>
              </div>
            </div>
          )}
        </div>
      </div>

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
            <Label htmlFor="character-appearance" className="text-sm font-semibold">
              Appearance Description
            </Label>
            <Textarea
              id="character-appearance"
              value={editAppearance}
              onChange={(e) => setEditAppearance(e.target.value)}
              onBlur={handleSaveAppearance}
              placeholder="Describe the character's appearance..."
              className="min-h-[150px] resize-y"
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
              {totalImages}/4 images
            </span>
            <span>
              <User className="w-4 h-4 inline mr-1" />
              {hasAvatar ? 'Avatar set' : 'No avatar'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
