'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import { User, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CharacterCard, Character } from '@/lib/types'

interface CharacterCardRendererProps {
  characterCard: CharacterCard
  character: Character
  className?: string
  showOverlay?: boolean
}

/**
 * Renders a character card by pulling data from the referenced character.
 * Uses character's name, appearance, and images with optional overrides from the card.
 */
export default function CharacterCardRenderer({
  characterCard,
  character,
  className,
  showOverlay = true,
}: CharacterCardRendererProps) {
  // Determine which image to show
  const imageUrl = useMemo(() => {
    if (characterCard.showAvatar && character.avatarUrl) {
      return character.avatarUrl
    }
    // Use the image at the specified index, or first available
    if (character.imageUrls.length > 0) {
      const index = Math.min(characterCard.imageIndex, character.imageUrls.length - 1)
      return character.imageUrls[index]
    }
    return null
  }, [characterCard.showAvatar, characterCard.imageIndex, character.avatarUrl, character.imageUrls])

  // Use override title or character name
  const title = characterCard.title || character.name

  // Use override content or character appearance
  const content = characterCard.content || character.appearance

  return (
    <div
      className={cn(
        "relative bg-card rounded-lg border-2 border-border overflow-hidden",
        "shadow-[4px_4px_0px_0px_hsl(var(--border))]",
        className
      )}
      data-testid="character-card-renderer"
    >
      {/* Character Image */}
      <div className="relative w-full aspect-square bg-muted">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={title}
              fill
              className={cn(
                "object-cover",
                characterCard.showAvatar && "object-contain bg-gradient-to-br from-muted to-muted/50"
              )}
              sizes="(max-width: 768px) 100vw, 384px"
            />
            {showOverlay && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <User className="w-16 h-16 opacity-40" />
            <p className="text-xs mt-2 font-medium">No image</p>
          </div>
        )}

        {/* Character name overlay at bottom */}
        {showOverlay && imageUrl && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-lg font-bold text-white drop-shadow-lg truncate">
              {title}
            </h3>
          </div>
        )}
      </div>

      {/* Character Info / Content */}
      <div className="p-3">
        {!showOverlay && (
          <h3 className="text-base font-bold text-foreground mb-1 truncate">
            {title}
          </h3>
        )}
        {content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {content}
          </p>
        )}
        {!content && (
          <p className="text-sm text-muted-foreground/60 italic">
            No description available
          </p>
        )}
      </div>

      {/* Character card indicator badge */}
      <div className="absolute top-2 right-2">
        <div
          className="px-2 py-1 bg-primary/90 rounded text-primary-foreground text-xs font-semibold flex items-center gap-1"
          title="Character Card"
        >
          <User className="w-3 h-3" />
          <span>Character</span>
        </div>
      </div>
    </div>
  )
}
