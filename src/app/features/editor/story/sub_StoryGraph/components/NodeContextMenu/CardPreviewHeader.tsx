'use client'

import Image from 'next/image'
import { FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StoryCard } from '@/lib/types'

// ============================================================================
// Card Preview Header - Shows card image, title, and description
// ============================================================================

interface CardPreviewHeaderProps {
  card: StoryCard
  isHalloween?: boolean
}

export function CardPreviewHeader({ card, isHalloween }: CardPreviewHeaderProps) {
  const hasImage = !!card.imageUrl

  return (
    <div className={cn('border-b', isHalloween ? 'border-purple-500/30' : 'border-border')}>
      {/* Image Preview - taller for better visibility */}
      <div className="relative w-full h-44 bg-muted/30 overflow-hidden">
        {hasImage ? (
          <Image
            src={card.imageUrl!}
            alt={card.title || 'Card image'}
            fill
            className="object-cover"
            sizes="600px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground/50">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <span className="text-sm">No image</span>
            </div>
          </div>
        )}

        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-white text-xl leading-tight drop-shadow-lg truncate">
            {card.title || 'Untitled Card'}
          </h3>
        </div>
      </div>

      {/* Content preview - more lines visible */}
      <div className="px-4 py-3">
        <p
          className={cn(
            'text-sm leading-relaxed line-clamp-4',
            isHalloween ? 'text-purple-200/80' : 'text-muted-foreground'
          )}
        >
          {card.content || 'No content yet. Generate content to get started.'}
        </p>
      </div>
    </div>
  )
}
