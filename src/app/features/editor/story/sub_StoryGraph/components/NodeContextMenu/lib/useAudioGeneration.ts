'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { StoryCard } from '@/lib/types'
import { GenerationState } from './types'

// ============================================================================
// Audio Generation Hook
// ============================================================================

export function useAudioGeneration(
  card: StoryCard,
  storyStackId: string,
  onUpdate: (updates: Partial<StoryCard>) => void
) {
  const [state, setState] = useState<GenerationState>('idle')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  const hasAudio = !!card.audioUrl
  const hasContent = !!(card.content && card.content.trim().length > 0)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [])

  const generate = useCallback(async () => {
    if (!hasContent || state === 'loading') return

    setState('loading')
    setError(null)

    try {
      const response = await fetch('/api/ai/elevenlabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: card.content,
          storyStackId,
          cardId: card.id,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate audio')
      }

      onUpdate({ audioUrl: data.audioUrl })
      setState('success')

      // Reset success state after 2s
      setTimeout(() => setState('idle'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate audio')
      setState('error')
    }
  }, [card.content, card.id, storyStackId, hasContent, state, onUpdate])

  const togglePlayback = useCallback(async () => {
    if (!card.audioUrl) return

    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    setIsLoadingAudio(true)

    try {
      // Cleanup old audio
      if (audioRef.current) {
        audioRef.current.pause()
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }

      // Fetch and play
      const response = await fetch(card.audioUrl)
      if (!response.ok) throw new Error('Failed to fetch audio')

      const blob = await response.blob()
      const audioBlob = new Blob([blob], { type: 'audio/mpeg' })
      const blobUrl = URL.createObjectURL(audioBlob)
      blobUrlRef.current = blobUrl

      const audio = new Audio()
      audioRef.current = audio

      audio.onended = () => setIsPlaying(false)
      audio.onpause = () => setIsPlaying(false)
      audio.onplay = () => {
        setIsPlaying(true)
        setIsLoadingAudio(false)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        setIsLoadingAudio(false)
      }

      audio.src = blobUrl
      await audio.play()
    } catch (err) {
      console.error('Audio playback error:', err)
      setIsLoadingAudio(false)
    }
  }, [card.audioUrl, isPlaying])

  return {
    state,
    error,
    hasAudio,
    hasContent,
    isPlaying,
    isLoadingAudio,
    generate,
    togglePlayback,
  }
}
