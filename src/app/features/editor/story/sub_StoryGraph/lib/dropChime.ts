/**
 * Drop Chime - Web Audio API sound effect for node placement
 *
 * Generates a pleasant chime sound when a node is dropped in the graph.
 * Uses the Web Audio API for low-latency, lightweight audio synthesis.
 */

let audioContext: AudioContext | null = null

/**
 * Gets or creates the shared AudioContext
 * Lazily initialized to comply with browser autoplay policies
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      console.warn('Web Audio API not supported')
      return null
    }
  }

  return audioContext
}

interface ChimeOptions {
  /** Volume from 0 to 1 (default: 0.3) */
  volume?: number
  /** Whether to use halloween-themed sound */
  isHalloween?: boolean
}

/**
 * Plays a pleasant chime sound using Web Audio API
 * The sound is a synthesized tone with harmonics that creates a "ding" effect
 */
export function playDropChime(options: ChimeOptions = {}): void {
  const { volume = 0.3, isHalloween = false } = options

  // Check for reduced motion preference (applies to audio too)
  if (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  const ctx = getAudioContext()
  if (!ctx) return

  // Resume context if suspended (required by browsers)
  if (ctx.state === 'suspended') {
    ctx.resume()
  }

  const now = ctx.currentTime

  // Create oscillators for the chime effect
  const oscillator1 = ctx.createOscillator()
  const oscillator2 = ctx.createOscillator()
  const gainNode = ctx.createGain()

  // Base frequency (C5 = 523.25 Hz for normal, A4 = 440 Hz for halloween)
  const baseFreq = isHalloween ? 440 : 523.25

  // Sine wave for pure tone
  oscillator1.type = 'sine'
  oscillator1.frequency.setValueAtTime(baseFreq, now)
  oscillator1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1)

  // Higher harmonic for shimmer
  oscillator2.type = 'sine'
  oscillator2.frequency.setValueAtTime(baseFreq * 2, now)
  oscillator2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.08)

  // Envelope for quick attack, medium decay
  gainNode.gain.setValueAtTime(0, now)
  gainNode.gain.linearRampToValueAtTime(volume, now + 0.01)  // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(volume * 0.3, now + 0.1)
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3)  // Decay

  // Connect audio graph
  oscillator1.connect(gainNode)
  oscillator2.connect(gainNode)
  gainNode.connect(ctx.destination)

  // Start and stop oscillators
  oscillator1.start(now)
  oscillator2.start(now)
  oscillator1.stop(now + 0.35)
  oscillator2.stop(now + 0.35)

  // Cleanup
  oscillator1.onended = () => {
    oscillator1.disconnect()
    oscillator2.disconnect()
    gainNode.disconnect()
  }
}

/**
 * Pre-warms the audio context to avoid latency on first play
 * Should be called on user interaction before playing sounds
 */
export function warmupAudio(): void {
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }
}
