'use client'

import { useState, useCallback } from 'react'
import { User, Image as ImageIcon, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CharacterCard, Character, UpdateCharacterCardInput } from '@/lib/types'
import CharacterCardRenderer from './CharacterCardRenderer'

interface CharacterCardEditorProps {
  characterCard: CharacterCard
  character: Character
  characters: Character[]
  onUpdate: (updates: UpdateCharacterCardInput) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
  isSaving?: boolean
}

export default function CharacterCardEditor({
  characterCard,
  character,
  characters,
  onUpdate,
  onDelete,
  onClose,
  isSaving = false,
}: CharacterCardEditorProps) {
  const [title, setTitle] = useState(characterCard.title || '')
  const [content, setContent] = useState(characterCard.content || '')
  const [imageIndex, setImageIndex] = useState(characterCard.imageIndex)
  const [showAvatar, setShowAvatar] = useState(characterCard.showAvatar)
  const [selectedCharacterId, setSelectedCharacterId] = useState(characterCard.characterId)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedCharacter = characters.find(c => c.id === selectedCharacterId) || character

  const handleSave = useCallback(async () => {
    await onUpdate({
      characterId: selectedCharacterId !== characterCard.characterId ? selectedCharacterId : undefined,
      title: title || null,
      content: content || null,
      imageIndex,
      showAvatar,
    })
  }, [onUpdate, selectedCharacterId, characterCard.characterId, title, content, imageIndex, showAvatar])

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this character card?')) return
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }, [onDelete])

  const maxImageIndex = selectedCharacter.imageUrls.length - 1

  return (
    <div className="flex flex-col h-full" data-testid="character-card-editor">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Edit Character Card</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="character-card-editor-close"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Editor Form */}
          <div className="space-y-4">
            {/* Character Selection */}
            <div className="space-y-2">
              <Label>Character</Label>
              <Select
                value={selectedCharacterId}
                onValueChange={setSelectedCharacterId}
              >
                <SelectTrigger data-testid="character-select">
                  <SelectValue placeholder="Select character" />
                </SelectTrigger>
                <SelectContent>
                  {characters.map(char => (
                    <SelectItem key={char.id} value={char.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{char.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title Override */}
            <div className="space-y-2">
              <Label htmlFor="title">Title Override</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedCharacter.name}
                data-testid="character-card-title-input"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use character name: "{selectedCharacter.name}"
              </p>
            </div>

            {/* Content Override */}
            <div className="space-y-2">
              <Label htmlFor="content">Content Override</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={selectedCharacter.appearance || 'Enter custom content...'}
                rows={4}
                data-testid="character-card-content-input"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use character appearance
              </p>
            </div>

            {/* Image Selection */}
            <div className="space-y-2">
              <Label>Image Display</Label>

              {/* Avatar Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Show Avatar</span>
                </div>
                <Switch
                  checked={showAvatar}
                  onCheckedChange={setShowAvatar}
                  disabled={!selectedCharacter.avatarUrl}
                  data-testid="show-avatar-switch"
                />
              </div>
              {!selectedCharacter.avatarUrl && (
                <p className="text-xs text-muted-foreground">
                  No avatar available for this character
                </p>
              )}

              {/* Image Index (only show if not using avatar) */}
              {!showAvatar && selectedCharacter.imageUrls.length > 0 && (
                <div className="space-y-2">
                  <Label>Character Image ({imageIndex + 1} of {selectedCharacter.imageUrls.length})</Label>
                  <div className="flex gap-2">
                    {selectedCharacter.imageUrls.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setImageIndex(idx)}
                        className={`w-16 h-16 rounded border-2 overflow-hidden transition-all ${
                          imageIndex === idx
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-border hover:border-primary/50'
                        }`}
                        data-testid={`image-select-${idx}`}
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

              {selectedCharacter.imageUrls.length === 0 && !showAvatar && (
                <p className="text-sm text-muted-foreground">
                  No images available for this character
                </p>
              )}
            </div>
          </div>

          {/* Right: Preview */}
          <div className="space-y-3">
            <Label>Preview</Label>
            <div className="max-w-xs">
              <CharacterCardRenderer
                characterCard={{
                  ...characterCard,
                  characterId: selectedCharacterId,
                  title: title || null,
                  content: content || null,
                  imageIndex,
                  showAvatar,
                }}
                character={selectedCharacter}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting || isSaving}
          data-testid="delete-character-card-btn"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            data-testid="save-character-card-btn"
          >
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  )
}
