'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AssetType, AssetCategory } from '@/lib/types'

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'character', label: 'Character' },
  { value: 'prompt_template', label: 'Prompt Template' },
  { value: 'avatar_set', label: 'Avatar Set' },
  { value: 'character_pack', label: 'Character Pack' },
  { value: 'story_template', label: 'Story Template' },
]

const categories: { value: AssetCategory; label: string }[] = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'modern', label: 'Modern' },
  { value: 'historical', label: 'Historical' },
  { value: 'horror', label: 'Horror' },
  { value: 'anime', label: 'Anime' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'other', label: 'Other' },
]

interface AssetMetadataFormProps {
  name: string
  setName: (value: string) => void
  description: string
  setDescription: (value: string) => void
  assetType: AssetType
  setAssetType: (value: AssetType) => void
  category: AssetCategory
  setCategory: (value: AssetCategory) => void
  thumbnailUrl: string
  setThumbnailUrl: (value: string) => void
  tags: string[]
  setTags: (value: string[]) => void
  tagInput: string
  setTagInput: (value: string) => void
}

export function AssetMetadataForm({
  name,
  setName,
  description,
  setDescription,
  assetType,
  setAssetType,
  category,
  setCategory,
  thumbnailUrl,
  setThumbnailUrl,
  tags,
  setTags,
  tagInput,
  setTagInput,
}: AssetMetadataFormProps) {
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Asset Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Amazing Character"
          required
          data-testid="asset-name-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your asset..."
          required
          data-testid="asset-description-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Asset Type *</Label>
          <Select
            value={assetType}
            onValueChange={(v) => setAssetType(v as AssetType)}
          >
            <SelectTrigger data-testid="asset-type-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as AssetCategory)}
          >
            <SelectTrigger data-testid="category-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail URL</Label>
        <Input
          id="thumbnail"
          value={thumbnailUrl}
          onChange={(e) => setThumbnailUrl(e.target.value)}
          placeholder="https://..."
          data-testid="thumbnail-url-input"
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Add a tag..."
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            data-testid="tag-input"
          />
          <Button type="button" variant="outline" onClick={addTag} data-testid="add-tag-btn">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                  data-testid={`remove-tag-${tag}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
