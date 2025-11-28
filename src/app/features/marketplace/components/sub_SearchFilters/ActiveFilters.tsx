'use client'

import { Search, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface ActiveFiltersProps {
  query: string
  setQuery: (value: string) => void
  showFilters: boolean
  setShowFilters: (value: boolean) => void
  hasActiveFilters: boolean
  loading?: boolean
  onSearch: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

export function ActiveFilters({
  query,
  setQuery,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  loading,
  onSearch,
  onKeyDown,
}: ActiveFiltersProps) {
  return (
    <div className="flex gap-2">
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
  )
}
