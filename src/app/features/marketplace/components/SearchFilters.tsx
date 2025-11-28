'use client'

import { useState } from 'react'
import { MarketplaceSearchOptions, AssetType, AssetCategory, LicenseType } from '@/lib/types'
import { ActiveFilters } from './sub_SearchFilters/ActiveFilters'
import { FilterGroup } from './sub_SearchFilters/FilterGroup'
import { FilterOption } from './sub_SearchFilters/FilterOption'

interface SearchFiltersProps {
  onSearch: (options: MarketplaceSearchOptions) => void
  loading?: boolean
}

export function SearchFilters({ onSearch, loading }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [query, setQuery] = useState('')
  const [assetType, setAssetType] = useState<AssetType | ''>('')
  const [category, setCategory] = useState<AssetCategory | ''>('')
  const [licenseType, setLicenseType] = useState<LicenseType | ''>('')
  const [isFree, setIsFree] = useState<boolean | undefined>(undefined)
  const [sortBy, setSortBy] = useState<'downloads' | 'rating' | 'newest' | 'price'>('downloads')

  const handleSearch = () => {
    onSearch({
      query: query || undefined,
      assetType: assetType || undefined,
      category: category || undefined,
      licenseType: licenseType || undefined,
      isFree,
      sortBy,
      sortOrder: sortBy === 'price' ? 'asc' : 'desc',
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const clearFilters = () => {
    setQuery('')
    setAssetType('')
    setCategory('')
    setLicenseType('')
    setIsFree(undefined)
    setSortBy('downloads')
    onSearch({})
  }

  const hasActiveFilters = query || assetType || category || licenseType || isFree !== undefined

  return (
    <div className="space-y-4" data-testid="search-filters">
      {/* Search bar */}
      <ActiveFilters
        query={query}
        setQuery={setQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        hasActiveFilters={!!hasActiveFilters}
        loading={loading}
        onSearch={handleSearch}
        onKeyDown={handleKeyDown}
      />

      {/* Expanded filters */}
      {showFilters && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4" data-testid="filter-panel">
          <FilterGroup
            assetType={assetType}
            setAssetType={setAssetType}
            category={category}
            setCategory={setCategory}
            licenseType={licenseType}
            setLicenseType={setLicenseType}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />

          <FilterOption
            isFree={isFree}
            setIsFree={setIsFree}
            hasActiveFilters={!!hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </div>
      )}
    </div>
  )
}
