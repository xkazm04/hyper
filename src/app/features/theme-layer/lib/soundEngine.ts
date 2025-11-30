/**
 * Halloween Sound Engine
 *
 * Web Audio API-based sound synthesis for Halloween theme effects.
 * Generates spooky tones, chimes, and ambient sounds without audio files.
 */

import type { SoundEffect, SoundEffectType } from './types'

let audioContext: AudioContext | null = null

/**
 * Gets or creates the shared AudioContext
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      console.warn('[SoundEngine] Web Audio API not supported')
      return null
    }
  }

  return audioContext
}

/**
 * Pre-warm the audio context (call on user interaction)
 */
export function warmupSoundEngine(): void {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
}

/**
 * Check if sound should be muted (reduced motion preference)
 */
function shouldMuteSound(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Play a synthesized Halloween sound effect
 */
export function playSynthSound(sound: SoundEffect): void {
  if (shouldMuteSound() || !sound.enabled) return

  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const now = ctx.currentTime
  const frequency = sound.frequency ?? 440
  const duration = sound.duration ?? 0.3
  const volume = sound.volume ?? 0.3

  // Create audio nodes
  const oscillator1 = ctx.createOscillator()
  const oscillator2 = ctx.createOscillator()
  const gainNode = ctx.createGain()
  const filterNode = ctx.createBiquadFilter()

  // Configure filter for spooky effect
  filterNode.type = 'lowpass'
  filterNode.frequency.setValueAtTime(frequency * 3, now)
  filterNode.Q.setValueAtTime(1, now)

  // Configure oscillators based on sound type
  switch (sound.type) {
    case 'node-click':
      // Quick, high-pitched click
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency, now)
      oscillator1.frequency.exponentialRampToValueAtTime(frequency * 1.5, now + duration * 0.5)
      oscillator2.type = 'triangle'
      oscillator2.frequency.setValueAtTime(frequency * 1.5, now)
      break

    case 'node-drop':
      // Descending mysterious tone
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency * 1.5, now)
      oscillator1.frequency.exponentialRampToValueAtTime(frequency, now + duration)
      oscillator2.type = 'sawtooth'
      oscillator2.frequency.setValueAtTime(frequency * 0.5, now)
      oscillator2.frequency.exponentialRampToValueAtTime(frequency * 0.3, now + duration)
      break

    case 'node-create':
      // Rising mystical tone
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency * 0.8, now)
      oscillator1.frequency.exponentialRampToValueAtTime(frequency * 1.2, now + duration)
      oscillator2.type = 'triangle'
      oscillator2.frequency.setValueAtTime(frequency * 1.6, now)
      oscillator2.frequency.exponentialRampToValueAtTime(frequency * 2, now + duration)
      break

    case 'node-delete':
      // Low ominous descend
      oscillator1.type = 'sawtooth'
      oscillator1.frequency.setValueAtTime(frequency, now)
      oscillator1.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + duration)
      oscillator2.type = 'square'
      oscillator2.frequency.setValueAtTime(frequency * 0.25, now)
      filterNode.frequency.exponentialRampToValueAtTime(frequency, now + duration)
      break

    case 'edge-connect':
      // Chime-like connection sound
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency, now)
      oscillator1.frequency.setValueAtTime(frequency * 1.25, now + duration * 0.3)
      oscillator2.type = 'sine'
      oscillator2.frequency.setValueAtTime(frequency * 2, now)
      break

    case 'theme-toggle':
      // Mystical transition sweep
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency * 0.5, now)
      oscillator1.frequency.exponentialRampToValueAtTime(frequency * 2, now + duration * 0.5)
      oscillator1.frequency.exponentialRampToValueAtTime(frequency, now + duration)
      oscillator2.type = 'triangle'
      oscillator2.frequency.setValueAtTime(frequency * 0.25, now)
      oscillator2.frequency.exponentialRampToValueAtTime(frequency, now + duration)
      break

    case 'success':
      // Bright ascending tone
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency, now)
      oscillator1.frequency.setValueAtTime(frequency * 1.25, now + duration * 0.33)
      oscillator1.frequency.setValueAtTime(frequency * 1.5, now + duration * 0.66)
      oscillator2.type = 'triangle'
      oscillator2.frequency.setValueAtTime(frequency * 2, now)
      break

    case 'error':
      // Low warning buzz
      oscillator1.type = 'sawtooth'
      oscillator1.frequency.setValueAtTime(frequency, now)
      oscillator1.frequency.setValueAtTime(frequency * 0.9, now + duration * 0.25)
      oscillator1.frequency.setValueAtTime(frequency, now + duration * 0.5)
      oscillator1.frequency.setValueAtTime(frequency * 0.85, now + duration * 0.75)
      oscillator2.type = 'square'
      oscillator2.frequency.setValueAtTime(frequency * 0.5, now)
      filterNode.frequency.setValueAtTime(frequency * 2, now)
      break

    case 'ambient':
      // Slow, eerie ambient drone
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency * 0.5, now)
      oscillator2.type = 'triangle'
      oscillator2.frequency.setValueAtTime(frequency * 0.25, now)
      break

    default:
      oscillator1.type = 'sine'
      oscillator1.frequency.setValueAtTime(frequency, now)
      oscillator2.type = 'sine'
      oscillator2.frequency.setValueAtTime(frequency * 1.5, now)
  }

  // Configure envelope
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)           // Quick attack
  gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + duration * 0.3)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration)   // Decay

  // Connect audio graph
  oscillator1.connect(filterNode)
  oscillator2.connect(filterNode)
  filterNode.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Start and stop oscillators
  oscillator1.start(now)
  oscillator2.start(now)
  oscillator1.stop(now + duration + 0.1)
  oscillator2.stop(now + duration + 0.1)

  // Cleanup
  oscillator1.onended = () => {
    oscillator1.disconnect()
    oscillator2.disconnect()
    filterNode.disconnect()
    gainNode.disconnect()
  }
}

/**
 * Play a sound effect by type from the available sounds
 */
export function playSound(
  type: SoundEffectType,
  sounds: SoundEffect[],
  globalVolume: number = 1
): void {
  const sound = sounds.find(s => s.type === type && s.enabled)
  if (!sound) return

  // Apply global volume modifier
  const adjustedSound = {
    ...sound,
    volume: sound.volume * globalVolume,
  }

  if (sound.audioUrl) {
    // Play from audio file if provided
    playAudioFile(sound.audioUrl, adjustedSound.volume)
  } else {
    // Synthesize the sound
    playSynthSound(adjustedSound)
  }
}

/**
 * Play an audio file
 */
function playAudioFile(url: string, volume: number): void {
  if (shouldMuteSound()) return

  const ctx = getAudioContext()
  if (!ctx) return

  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      const source = ctx.createBufferSource()
      const gainNode = ctx.createGain()

      source.buffer = audioBuffer
      gainNode.gain.setValueAtTime(volume, ctx.currentTime)

      source.connect(gainNode)
      gainNode.connect(ctx.destination)

      source.start(0)

      source.onended = () => {
        source.disconnect()
        gainNode.disconnect()
      }
    })
    .catch(err => {
      console.warn('[SoundEngine] Failed to play audio file:', err)
    })
}

/**
 * Create an ambient sound loop
 */
export function createAmbientLoop(
  sounds: SoundEffect[],
  enabled: boolean
): (() => void) | null {
  if (!enabled || shouldMuteSound()) return null

  const ambientSound = sounds.find(s => s.type === 'ambient' && s.enabled)
  if (!ambientSound) return null

  let isPlaying = true
  let timeoutId: NodeJS.Timeout | null = null

  const playAmbient = () => {
    if (!isPlaying) return

    playSynthSound({
      ...ambientSound,
      volume: ambientSound.volume * 0.3, // Lower ambient volume
      duration: 2,
    })

    // Schedule next play with random interval
    const nextInterval = 5000 + Math.random() * 10000 // 5-15 seconds
    timeoutId = setTimeout(playAmbient, nextInterval)
  }

  // Start after a short delay
  timeoutId = setTimeout(playAmbient, 2000)

  // Return cleanup function
  return () => {
    isPlaying = false
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
