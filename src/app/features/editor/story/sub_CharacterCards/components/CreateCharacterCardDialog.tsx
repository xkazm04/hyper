'use client'

import { useState, useCallback } from 'react'
import { User, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Character, CreateCharacterCardInput } from '@/lib/types'
import CharacterCardRenderer from './CharacterCardRenderer'

interface CreateCharacterCardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  characters: Character[]
  storyStackId: string
  onCreate: (input: CreateCharacterCardInput) => Promise<void>
}

export default function CreateCharacterCardDialog({
  open,
  onOpenChange,
  characters,
  storyStackId,
  onCreate,
}: CreateCharacterCardDialogProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')
  const [imageIndex, setImageIndex] = useState(0)
  const [showAvatar, setShowAvatar] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId)

  const handleCreate = useCallback(async () => {
    if (!selectedCharacterId) return

    setIsCreating(true)
    try {
      await onCreate({
        storyStackId,
        characterId: selectedCharacterId,
        imageIndex,
        showAvatar,
      })
      // Reset form and close
      setSelectedCharacterId('')
      setImageIndex(0)
      setShowAvatar(false)
      onOpenChange(false)
    } finally {
      setIsCreating(false)
    }
  }, [onCreate, storyStackId, selectedCharacterId, imageIndex, showAvatar, onOpenChange])

  const handleClose = () => {
    setSelectedCharacterId('')
    setImageIndex(0)
    setShowAvatar(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" data-testid="create-character-card-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Create Character Card
          </DialogTitle>
          <DialogDescription>
            Create a reusable card from an existing character. The card will automatically display
            the character's name, appearance, and images.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          {/* Left: Selection Form */}
          <div className="space-y-4">
            {/* Character Selection */}
            <div className="space-y-2">
              <Label>Select Character</Label>
              {characters.length > 0 ? (
                <Select
                  value={selectedCharacterId}
                  onValueChange={(value) => {
                    setSelectedCharacterId(value)
                    setImageIndex(0)
                    setShowAvatar(false)
                  }}
                >
                  <SelectTrigger data-testid="character-select">
                    <SelectValue placeholder="Choose a character..." />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map(char => (
                      <SelectItem key={char.id} value={char.id}>
                        <div className="flex items-center gap-2">
                          {char.avatarUrl ? (
                            <img
                              src={char.avatarUrl}
                              alt={char.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span>{char.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-4 rounded-lg border border-dashed border-border text-center">
                  <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No characters available. Create a character first.
                  </p>
                </div>
              )}
            </div>

            {/* Image Options (only show when character selected) */}
            {selectedCharacter && (
              <>
                {/* Avatar Toggle */}
                {selectedCharacter.avatarUrl && (
                  <div className="space-y-2">
                    <Label>Display Mode</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={!showAvatar ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAvatar(false)}
                        data-testid="show-full-image-btn"
                      >
                        Full Image
                      </Button>
                      <Button
                        type="button"
                        variant={showAvatar ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowAvatar(true)}
                        data-testid="show-avatar-btn"
                      >
                        Avatar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Image Selection */}
                {!showAvatar && selectedCharacter.imageUrls.length > 1 && (
                  <div className="space-y-2">
                    <Label>Select Image</Label>
                    <div className="flex gap-2 flex-wrap">
                      {selectedCharacter.imageUrls.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setImageIndex(idx)}
                          className={`w-14 h-14 rounded border-2 overflow-hidden transition-all ${
                            imageIndex === idx
                              ? 'border-primary ring-2 ring-primary/30'
                              : 'border-border hover:border-primary/50'
                          }`}
                          data-testid={`image-option-${idx}`}
                        >
                          <img
                            src={url}
                            alt={`Option ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            {selectedCharacter ? (
              <div className="max-w-xs">
                <CharacterCardRenderer
                  characterCard={{
                    id: 'preview',
                    storyStackId,
                    characterId: selectedCharacterId,
                    title: null,
                    content: null,
                    imageIndex,
                    showAvatar,
                    orderIndex: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }}
                  character={selectedCharacter}
                />
              </div>
            ) : (
              <div className="aspect-square max-w-xs rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                <div className="text-center text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Select a character to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedCharacterId || isCreating}
            data-testid="create-character-card-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isCreating ? 'Creating...' : 'Create Character Card'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
