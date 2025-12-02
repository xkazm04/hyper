'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StyleImageCardProps {
  imageUrl: string
  label: string
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
  className?: string
}

export function StyleImageCard({
  imageUrl,
  label,
  isSelected,
  onSelect,
  disabled = false,
  className
}: StyleImageCardProps) {
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
          : 'border-border hover:border-primary/50',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={imageUrl}
          alt={label}
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
          {label}
        </p>
      </div>
    </button>
  )
}
