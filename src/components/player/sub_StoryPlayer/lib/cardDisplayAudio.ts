'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

// ============================================================================
// Audio Hook - Uses blob fetch for compatibility
// Handles browser autoplay restrictions by detecting user interaction
// ============================================================================

// Track if user has interacted with the page (enables autoplay)
let hasUserInteracted = false

// Setup global listener once to track user interaction
if (typeof window !== 'undefined') {
  const markInteracted = () => {
    hasUserInteracted = true
    // Remove listeners after first interaction
    document.removeEventListener('click', markInteracted)
    document.removeEventListener('keydown', markInteracted)
    document.removeEventListener('touchstart', markInteracted)
  }

  document.addEventListener('click', markInteracted, { once: true, capture: true })
  document.addEventListener('keydown', markInteracted, { once: true, capture: true })
  document.addEventListener('touchstart', markInteracted, { once: true, capture: true })
}

export function useAudioPlayer(audioUrl: string | null, autoplay: boolean, onAudioEnd?: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const currentUrlRef = useRef<string | null>(null)
  const pendingAutoplayRef = useRef<boolean>(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)

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

  // Function to attempt playing loaded audio
  const attemptPlay = useCallback(async () => {
    if (!audioRef.current) return false

    try {
      await audioRef.current.play()
      setAutoplayBlocked(false)
      pendingAutoplayRef.current = false
      return true
    } catch {
      // Autoplay blocked by browser
      setAutoplayBlocked(true)
      pendingAutoplayRef.current = true
      setIsLoading(false)
      return false
    }
  }, [])

  // Load and optionally autoplay when URL changes
  useEffect(() => {
    if (currentUrlRef.current === audioUrl) return

    // Cleanup previous audio
    cleanup()
    currentUrlRef.current = audioUrl
    setIsPlaying(false)
    setAutoplayBlocked(false)
    pendingAutoplayRef.current = false

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
          setAutoplayBlocked(false)
        }
        audio.onerror = () => {
          setIsPlaying(false)
          setIsLoading(false)
        }

        audio.src = blobUrl
        audio.muted = isMuted

        // Try to play
        const played = await attemptPlay()

        // If autoplay was blocked and user hasn't interacted yet,
        // set up listener to play once they do
        if (!played && !hasUserInteracted) {
          pendingAutoplayRef.current = true
        }
      } catch (err) {
        console.error('Audio load error:', err)
        setIsLoading(false)
      }
    }
  }, [audioUrl, autoplay, cleanup, isMuted, onAudioEnd, attemptPlay])

  // Listen for user interaction to resume blocked autoplay
  useEffect(() => {
    if (!autoplayBlocked || !pendingAutoplayRef.current) return

    const handleInteraction = async () => {
      hasUserInteracted = true
      if (pendingAutoplayRef.current && audioRef.current) {
        await attemptPlay()
      }
    }

    // Add listeners for user interaction
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [autoplayBlocked, attemptPlay])

  // Toggle playback
  const togglePlay = useCallback(async () => {
    if (!audioUrl) return

    // Mark as interacted since user clicked play
    hasUserInteracted = true
    pendingAutoplayRef.current = false
    setAutoplayBlocked(false)

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

  return { isPlaying, isLoading, isMuted, autoplayBlocked, togglePlay, toggleMute }
}
