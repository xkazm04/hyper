'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AssetType, AssetCategory, LicenseType } from '@/lib/types'

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'character', label: 'Characters' },
  { value: 'prompt_template', label: 'Prompt Templates' },
  { value: 'avatar_set', label: 'Avatar Sets' },
  { value: 'character_pack', label: 'Character Packs' },
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

const licenseTypes: { value: LicenseType; label: string }[] = [
  { value: 'free', label: 'Free' },
  { value: 'attribution', label: 'Attribution Required' },
  { value: 'non-commercial', label: 'Non-Commercial' },
  { value: 'commercial', label: 'Commercial' },
]

const sortOptions = [
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price', label: 'Price' },
]

interface FilterGroupProps {
  assetType: AssetType | ''
  setAssetType: (value: AssetType | '') => void
  category: AssetCategory | ''
  setCategory: (value: AssetCategory | '') => void
  licenseType: LicenseType | ''
  setLicenseType: (value: LicenseType | '') => void
  sortBy: 'downloads' | 'rating' | 'newest' | 'price'
  setSortBy: (value: 'downloads' | 'rating' | 'newest' | 'price') => void
}

export function FilterGroup({
  assetType,
  setAssetType,
  category,
  setCategory,
  licenseType,
  setLicenseType,
  sortBy,
  setSortBy,
}: FilterGroupProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Asset Type */}
      <div className="space-y-2">
        <Label>Asset Type</Label>
        <Select
          value={assetType}
          onValueChange={(v) => setAssetType(v as AssetType | '')}
        >
          <SelectTrigger data-testid="asset-type-select">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {assetTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as AssetCategory | '')}
        >
          <SelectTrigger data-testid="category-select">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* License Type */}
      <div className="space-y-2">
        <Label>License</Label>
        <Select
          value={licenseType}
          onValueChange={(v) => setLicenseType(v as LicenseType | '')}
        >
          <SelectTrigger data-testid="license-select">
            <SelectValue placeholder="All licenses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All licenses</SelectItem>
            {licenseTypes.map((license) => (
              <SelectItem key={license.value} value={license.value}>
                {license.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sort By */}
      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={sortBy}
          onValueChange={(v) => setSortBy(v as typeof sortBy)}
        >
          <SelectTrigger data-testid="sort-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
