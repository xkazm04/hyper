'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Character } from '@/lib/types'

interface CharacterImagesGalleryProps {
  character: Character
  loading: boolean
  onRemoveImage: (index: number) => Promise<void>
}

interface ImageCardProps {
  src: string
  alt: string
  index: number
  loading: boolean
  onRemove: () => void
  isNew?: boolean
}

function ImageCard({
  src,
  alt,
  index,
  loading,
  onRemove,
  isNew = false,
}: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showNewAnimation, setShowNewAnimation] = useState(isNew)
  const imageRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px', threshold: 0.1 }
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Clear new animation after it plays
  useEffect(() => {
    if (showNewAnimation) {
      const timer = setTimeout(() => setShowNewAnimation(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [showNewAnimation])

  return (
    <div
      ref={imageRef}
      className={cn(
        'relative aspect-[2/3] rounded-lg overflow-hidden border-2 border-border group',
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:border-primary/50',
        // Fade-in and scale animation for new images
        showNewAnimation && 'animate-in fade-in-0 zoom-in-95 duration-500'
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      data-testid={`character-image-${index}`}
    >
      {/* Loading skeleton */}
      <div
        className={cn(
          'absolute inset-0 bg-muted/50 animate-pulse',
          'transition-opacity duration-500 ease-out',
          isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-muted/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-muted-foreground/50 animate-spin" />
        </div>
      </div>

      {/* Image */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'w-full h-full object-cover',
            'transition-all duration-300 ease-out',
            isLoaded ? 'opacity-100' : 'opacity-0',
            isHovering && 'scale-105'
          )}
        />
      )}

      {/* Hover overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent',
          'transition-opacity duration-200',
          isHovering ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        disabled={loading}
        className={cn(
          'absolute top-2 right-2 p-2 rounded-lg',
          'bg-destructive text-destructive-foreground',
          'opacity-0 group-hover:opacity-100',
          'transition-all duration-200 ease-out',
          'hover:scale-110 active:scale-95',
          'focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Delete image"
        data-testid={`delete-image-btn-${index}`}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Image number badge */}
      <div
        className={cn(
          'absolute bottom-2 left-2 px-2 py-1 rounded-md',
          'bg-black/70 backdrop-blur-sm',
          'transition-all duration-200',
          isHovering ? 'opacity-100' : 'opacity-80'
        )}
      >
        <span className="text-xs text-white font-semibold">#{index + 1}</span>
      </div>
    </div>
  )
}

interface EmptySlotProps {
  index: number
}

function EmptySlot({ index }: EmptySlotProps) {
  return (
    <div
      className={cn(
        'aspect-[2/3] rounded-lg',
        'border-2 border-dashed border-border',
        'bg-muted/20',
        'flex items-center justify-center',
        'transition-colors duration-200'
      )}
      data-testid={`empty-slot-${index}`}
    >
      <Plus className="w-8 h-8 text-muted-foreground/40" />
    </div>
  )
}

const MAX_IMAGES = 10

export function MasonryGallery({
  character,
  loading,
  onRemoveImage,
}: CharacterImagesGalleryProps) {
  const currentImageCount = character.imageUrls?.length || 0

  // Track previously known URLs to detect new ones
  const previousUrlsRef = useRef<Set<string>>(new Set())

  // Determine which images are new (not seen before)
  const newImageIndices = useMemo(() => {
    const newIndices = new Set<number>()
    const currentUrls = character.imageUrls || []

    currentUrls.forEach((url, index) => {
      if (!previousUrlsRef.current.has(url)) {
        newIndices.add(index)
      }
    })

    // Update the ref with current URLs after computing new indices
    // Use a timeout to avoid updating during render
    setTimeout(() => {
      previousUrlsRef.current = new Set(currentUrls)
    }, 0)

    return newIndices
  }, [character.imageUrls])

  // Show gallery when there is at least 1 image
  if (currentImageCount === 0) return null

  // Calculate empty slots - show up to 5 empty slots, but not more than remaining capacity
  const remainingCapacity = MAX_IMAGES - currentImageCount
  const emptySlots = Math.min(remainingCapacity, 5)

  return (
    <div
      className="bg-card rounded-lg border-2 border-border p-4"
      data-testid="character-images-gallery"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">
          Character Images ({currentImageCount}/{MAX_IMAGES})
        </h3>
        {currentImageCount >= 5 && (
          <span className="text-xs text-green-600 dark:text-green-400">
            Ready for AI training
          </span>
        )}
      </div>

      {/* Grid with consistent 2:3 aspect ratio cards - 5 columns for 10 images */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {character.imageUrls.map((url, index) => (
          <ImageCard
            key={`image-${url}-${index}`}
            src={url}
            alt={`${character.name} - Image ${index + 1}`}
            index={index}
            loading={loading}
            onRemove={() => onRemoveImage(index)}
            isNew={newImageIndices.has(index)}
          />
        ))}

        {/* Empty slots to show remaining capacity (max 5 shown) */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <EmptySlot key={`empty-${index}`} index={currentImageCount + index} />
        ))}
      </div>
    </div>
  )
}
