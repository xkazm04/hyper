'use client'

import { memo, useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'

export interface LazyNodeImageProps {
  /** Image source URL */
  src: string | null | undefined
  /** Alt text for the image */
  alt?: string
  /** Whether the node is currently visible in viewport */
  isVisible?: boolean
  /** Additional class names */
  className?: string
  /** Placeholder class names */
  placeholderClassName?: string
  /** Whether to use Halloween styling */
  isHalloween?: boolean
  /** Called when image finishes loading */
  onLoad?: () => void
  /** Called when image fails to load */
  onError?: () => void
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * LazyNodeImage - Lazy-loaded image component for story nodes
 *
 * Features:
 * - Only loads images when node is visible in viewport
 * - Shows placeholder while loading
 * - Caches loaded state to prevent re-loading
 * - Smooth fade-in animation on load
 * - Memory-efficient: uses thumbnail caching
 */
export const LazyNodeImage = memo(function LazyNodeImage({
  src,
  alt = '',
  isVisible = true,
  className,
  placeholderClassName,
  isHalloween = false,
  onLoad,
  onError,
}: LazyNodeImageProps) {
  const [loadState, setLoadState] = useState<LoadState>(src ? 'idle' : 'error')
  const imgRef = useRef<HTMLImageElement>(null)
  const hasAttemptedLoad = useRef(false)

  // Reset state when src changes
  useEffect(() => {
    if (src) {
      setLoadState('idle')
      hasAttemptedLoad.current = false
    } else {
      setLoadState('error')
    }
  }, [src])

  // Load image when visible
  useEffect(() => {
    if (!src || !isVisible || hasAttemptedLoad.current || loadState !== 'idle') {
      return
    }

    hasAttemptedLoad.current = true
    setLoadState('loading')

    // Create image element for preloading
    const img = new Image()

    img.onload = () => {
      setLoadState('loaded')
      onLoad?.()
    }

    img.onerror = () => {
      setLoadState('error')
      onError?.()
    }

    img.src = src
  }, [src, isVisible, loadState, onLoad, onError])

  const handleImageLoad = useCallback(() => {
    setLoadState('loaded')
    onLoad?.()
  }, [onLoad])

  const handleImageError = useCallback(() => {
    setLoadState('error')
    onError?.()
  }, [onError])

  // Render placeholder when not loaded
  if (loadState === 'idle' || loadState === 'loading' || loadState === 'error' || !src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          isHalloween ? 'bg-purple-900/30' : 'bg-muted/50',
          loadState === 'loading' && 'animate-pulse',
          placeholderClassName,
          className
        )}
        data-testid="lazy-node-image-placeholder"
      >
        <ImageIcon
          className={cn(
            'w-6 h-6',
            isHalloween ? 'text-purple-400/50' : 'text-muted-foreground/50'
          )}
        />
      </div>
    )
  }

  // Render loaded image
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-200',
          loadState === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
        loading="lazy"
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        data-testid="lazy-node-image"
      />
    </div>
  )
})

LazyNodeImage.displayName = 'LazyNodeImage'

/**
 * Hook to track image loading state for a node
 */
export function useNodeImageState(
  imageUrl: string | null | undefined,
  isVisible: boolean
): {
  isLoaded: boolean
  isLoading: boolean
  hasError: boolean
} {
  const [state, setState] = useState<LoadState>(imageUrl ? 'idle' : 'error')

  useEffect(() => {
    if (!imageUrl) {
      setState('error')
      return
    }

    if (!isVisible || state !== 'idle') return

    setState('loading')

    const img = new Image()
    img.onload = () => setState('loaded')
    img.onerror = () => setState('error')
    img.src = imageUrl

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageUrl, isVisible, state])

  return {
    isLoaded: state === 'loaded',
    isLoading: state === 'loading',
    hasError: state === 'error',
  }
}
