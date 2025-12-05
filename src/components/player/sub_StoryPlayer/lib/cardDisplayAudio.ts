'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

// ============================================================================
// Audio Hook - Uses blob fetch for compatibility
// ============================================================================

export function useAudioPlayer(audioUrl: string | null, autoplay: boolean, onAudioEnd?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Cleanup function
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  // Load and optionally autoplay when URL changes
  useEffect(() => {
    if (currentUrlRef.current === audioUrl) return

    // Cleanup previous audio
    cleanup()
    currentUrlRef.current = audioUrl
    setIsPlaying(false)

    if (!audioUrl) return

    // If autoplay, load immediately
    if (autoplay) {
      loadAndPlay()
    }

    async function loadAndPlay() {
      if (!audioUrl) return

      setIsLoading(true)
      try {
        const response = await fetch(audioUrl)
        if (!response.ok) throw new Error('Failed to fetch audio')

        const blob = await response.blob()
        const audioBlob = new Blob([blob], { type: 'audio/mpeg' })
        const blobUrl = URL.createObjectURL(audioBlob)
        blobUrlRef.current = blobUrl

        const audio = new Audio()
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
          onAudioEnd?.()
        }
        audio.onpause = () => setIsPlaying(false)
        audio.onplay = () => {
          setIsPlaying(true)
          setIsLoading(false)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          setIsLoading(false)
        }

        audio.src = blobUrl
        audio.muted = isMuted

        // Try to play
        try {
          await audio.play()
        } catch {
          // Autoplay blocked by browser
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Audio load error:', err)
        setIsLoading(false)
      }
    }
  }, [audioUrl, autoplay, cleanup, isMuted, onAudioEnd])

  // Toggle playback
  const togglePlay = useCallback(async () => {
    if (!audioUrl) return

    // If already playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      return
    }

    // If audio not loaded yet, load and play
    if (!audioRef.current || !blobUrlRef.current) {
      setIsLoading(true)
      try {
        const response = await fetch(audioUrl)
        if (!response.ok) throw new Error('Failed to fetch audio')

        const blob = await response.blob()
        const audioBlob = new Blob([blob], { type: 'audio/mpeg' })
        const blobUrl = URL.createObjectURL(audioBlob)

        // Cleanup old blob URL
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
        }
        blobUrlRef.current = blobUrl

        const audio = new Audio()
        audioRef.current = audio

        audio.onended = () => {
          setIsPlaying(false)
          onAudioEnd?.()
        }
        audio.onpause = () => setIsPlaying(false)
        audio.onplay = () => {
          setIsPlaying(true)
          setIsLoading(false)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          setIsLoading(false)
        }

        audio.src = blobUrl
        audio.muted = isMuted
        await audio.play()
      } catch (err) {
        console.error('Audio play error:', err)
        setIsLoading(false)
      }
    } else {
      // Audio loaded, just play
      try {
        await audioRef.current.play()
      } catch (err) {
        console.error('Audio play error:', err)
      }
    }
  }, [audioUrl, isPlaying, isMuted, onAudioEnd])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted
    }
    setIsMuted(prev => !prev)
  }, [])

  return { isPlaying, isLoading, isMuted, togglePlay, toggleMute }
}
