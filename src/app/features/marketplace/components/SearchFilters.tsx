'use client'

import { useState } from 'react'
import { MarketplaceSearchOptions, AssetType, AssetCategory, LicenseType } from '@/lib/types'
import { Filters, SortByOption } from './Filters'

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
  const [sortBy, setSortBy] = useState<SortByOption>('downloads')

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

  const hasActiveFilters = !!(query || assetType || category || licenseType || isFree !== undefined)

  return (
    <div data-testid="search-filters">
      <Filters
        query={query}
        setQuery={setQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        loading={loading}
        onSearch={handleSearch}
        onKeyDown={handleKeyDown}
        assetType={assetType}
        setAssetType={setAssetType}
        category={category}
        setCategory={setCategory}
        licenseType={licenseType}
        setLicenseType={setLicenseType}
        sortBy={sortBy}
        setSortBy={setSortBy}
        isFree={isFree}
        setIsFree={setIsFree}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />
    </div>
  )
}
