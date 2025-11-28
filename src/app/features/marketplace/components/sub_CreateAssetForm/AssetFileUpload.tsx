'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AssetFileUploadProps {
  characterName: string
  setCharacterName: (value: string) => void
  characterAppearance: string
  setCharacterAppearance: (value: string) => void
  characterImageUrls: string[]
  setCharacterImageUrls: (value: string[]) => void
  characterAvatarUrl: string
  setCharacterAvatarUrl: (value: string) => void
}

export function AssetFileUpload({
  characterName,
  setCharacterName,
  characterAppearance,
  setCharacterAppearance,
  characterImageUrls,
  setCharacterImageUrls,
}: AssetFileUploadProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-medium">Character Details</h3>
      <div className="space-y-2">
        <Label htmlFor="charName">Character Name</Label>
        <Input
          id="charName"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
          placeholder="Character name"
          data-testid="character-name-input"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="charAppearance">Appearance Description</Label>
        <Textarea
          id="charAppearance"
          value={characterAppearance}
          onChange={(e) => setCharacterAppearance(e.target.value)}
          placeholder="Describe the character's appearance..."
          data-testid="character-appearance-input"
        />
      </div>
      <div className="space-y-2">
        <Label>Image URLs</Label>
        {characterImageUrls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => {
                const newUrls = [...characterImageUrls]
                newUrls[index] = e.target.value
                setCharacterImageUrls(newUrls)
              }}
              placeholder="https://..."
              data-testid={`image-url-input-${index}`}
            />
            {characterImageUrls.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCharacterImageUrls(characterImageUrls.filter((_, i) => i !== index))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        {characterImageUrls.length < 4 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCharacterImageUrls([...characterImageUrls, ''])}
            data-testid="add-image-url-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Image
          </Button>
        )}
      </div>
    </div>
  )
}
