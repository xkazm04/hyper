'use client'

import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AssetType, AssetCategory, LicenseType } from '@/lib/types'

// Filter option data
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

export type SortByOption = 'downloads' | 'rating' | 'newest' | 'price'

export interface FiltersProps {
  // Search bar
  query: string
  setQuery: (value: string) => void
  showFilters: boolean
  setShowFilters: (value: boolean) => void
  loading?: boolean
  onSearch: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  // Filter dropdowns
  assetType: AssetType | ''
  setAssetType: (value: AssetType | '') => void
  category: AssetCategory | ''
  setCategory: (value: AssetCategory | '') => void
  licenseType: LicenseType | ''
  setLicenseType: (value: LicenseType | '') => void
  sortBy: SortByOption
  setSortBy: (value: SortByOption) => void
  // Price filter
  isFree: boolean | undefined
  setIsFree: (value: boolean | undefined) => void
  // Clear functionality
  hasActiveFilters: boolean
  onClearFilters: () => void
}

/**
 * Consolidated Filters component for marketplace search.
 * Combines search bar, filter dropdowns, price toggle, and clear functionality.
 */
export function Filters({
  query,
  setQuery,
  showFilters,
  setShowFilters,
  loading,
  onSearch,
  onKeyDown,
  assetType,
  setAssetType,
  category,
  setCategory,
  licenseType,
  setLicenseType,
  sortBy,
  setSortBy,
  isFree,
  setIsFree,
  hasActiveFilters,
  onClearFilters,
}: FiltersProps) {
  return (
    <div className="space-y-4" data-testid="filters-container">
      {/* Search bar section */}
      <div className="flex gap-2" data-testid="search-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search characters, templates, packs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="pl-9"
            data-testid="search-input"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          data-testid="toggle-filters-btn"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Active
            </Badge>
          )}
        </Button>
        <Button onClick={onSearch} disabled={loading} data-testid="search-btn">
          Search
        </Button>
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4" data-testid="filter-panel">
          {/* Filter dropdowns grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="filter-dropdowns">
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
                onValueChange={(v) => setSortBy(v as SortByOption)}
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

          {/* Price filter and clear button */}
          <div className="flex items-center gap-4" data-testid="price-filter">
            <Label>Price:</Label>
            <div className="flex gap-2">
              <Button
                variant={isFree === undefined ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsFree(undefined)}
                data-testid="price-all-btn"
              >
                All
              </Button>
              <Button
                variant={isFree === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsFree(true)}
                data-testid="price-free-btn"
              >
                Free Only
              </Button>
              <Button
                variant={isFree === false ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsFree(false)}
                data-testid="price-paid-btn"
              >
                Paid
              </Button>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="ml-auto"
                data-testid="clear-filters-btn"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
