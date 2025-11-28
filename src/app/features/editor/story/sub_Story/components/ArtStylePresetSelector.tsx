'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Check, Palette, ChevronDown } from 'lucide-react'
import { ArtStyle } from '@/app/prompts/types'
import { ART_STYLES } from '@/app/prompts/artstyles'

interface ArtStylePresetSelectorProps {
  selectedStyleId: string | null
  onSelect: (styleId: string) => void
  disabled?: boolean
}

export function ArtStylePresetSelector({
  selectedStyleId,
  onSelect,
  disabled = false
}: ArtStylePresetSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const selectedStyle = ART_STYLES.find(s => s.id === selectedStyleId)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Art Style Preset
        </label>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          disabled={disabled}
        >
          {isExpanded ? 'Collapse' : 'Show all'}
          <ChevronDown className={cn(
            'w-3 h-3 transition-transform',
            isExpanded && 'rotate-180'
          )} />
        </button>
      </div>

      {/* Currently Selected Style - Image Card */}
      {selectedStyle && !isExpanded && (
        <div className="relative rounded-lg border-2 border-primary overflow-hidden">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={selectedStyle.imageUrl}
              alt={selectedStyle.label}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-semibold text-white text-sm">{selectedStyle.label}</p>
              <p className="text-xs text-white/80 line-clamp-1">{selectedStyle.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Style Grid with Image Cards */}
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
          {ART_STYLES.map((style) => (
            <StyleImageCard
              key={style.id}
              style={style}
              isSelected={style.id === selectedStyleId}
              onSelect={() => {
                onSelect(style.id)
                setIsExpanded(false)
              }}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StyleImageCard({
  style,
  isSelected,
  onSelect,
  disabled
}: {
  style: ArtStyle
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'group relative rounded-lg overflow-hidden border-2 transition-all',
        'hover:scale-[1.02] hover:shadow-lg',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        isSelected
          ? 'border-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.3)]'
          : 'border-border hover:border-primary/50'
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={style.imageUrl}
          alt={style.label}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 150px"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
            <Check className="w-3 h-3" />
          </div>
        )}
      </div>
      
      {/* Label below image */}
      <div className="bg-card p-2 text-center border-t border-border">
        <p className={cn(
          'font-medium text-xs truncate',
          isSelected ? 'text-primary' : 'text-foreground'
        )}>
          {style.label}
        </p>
      </div>
    </button>
  )
}
