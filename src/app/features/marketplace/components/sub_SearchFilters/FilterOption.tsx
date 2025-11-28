'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface FilterOptionProps {
  isFree: boolean | undefined
  setIsFree: (value: boolean | undefined) => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function FilterOption({
  isFree,
  setIsFree,
  hasActiveFilters,
  onClearFilters,
}: FilterOptionProps) {
  return (
    <div className="flex items-center gap-4">
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
  )
}
