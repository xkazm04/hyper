'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface SearchFilterProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchFilter({ value, onChange, placeholder = 'Search stories...' }: SearchFilterProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 border-2 border-gray-300 focus:border-black"
        data-testid="search-stories-input"
      />
    </div>
  )
}
