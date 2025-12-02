'use client'

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type {
  ThemeLayerContextType,
  SoundEffectType,
  ThemeLayerPreferences,
} from './lib/types'
import { defaultHalloweenSounds } from './lib/defaultAssets'
import { playSound, warmupSoundEngine, createAmbientLoop } from './lib/soundEngine'

const ThemeLayerContext = createContext<ThemeLayerContextType | undefined>(undefined)

/**
 * Load preferences from localStorage
 */
function loadPreferences(): ThemeLayerPreferences {
  const defaultPrefs: ThemeLayerPreferences = {
    effectsEnabled: true,
    soundsEnabled: true,
    intensity: 1,
  }

  if (typeof window === 'undefined') return defaultPrefs

  try {
    const stored = localStorage.getItem('halloween-theme-layer-prefs')
    if (stored) {
      return { ...defaultPrefs, ...JSON.parse(stored) }
    }
  } catch {
    console.warn('[ThemeLayer] Failed to load preferences')
  }

  return defaultPrefs
}

/**
 * Save preferences to localStorage
 */
function savePreferences(prefs: ThemeLayerPreferences): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('halloween-theme-layer-prefs', JSON.stringify(prefs))
  } catch {
    console.warn('[ThemeLayer] Failed to save preferences')
  }
}

interface ThemeLayerProviderProps {
  children: React.ReactNode
}

/**
 * ThemeLayerProvider
 *
 * Provides the theme layer engine context with:
 * - Toggleable effects
 * - Sound effect management
 */
export function ThemeLayerProvider({ children }: ThemeLayerProviderProps) {
  const { theme } = useTheme()
  const isHalloween = theme === 'halloween'

  // Load initial preferences
  const [effectsEnabled, setEffectsEnabled] = useState(true)
  const [soundsEnabled, setSoundsEnabled] = useState(true)
  const [intensity, setIntensity] = useState(1)

  // Initialize from localStorage after mount
  useEffect(() => {
    const prefs = loadPreferences()
    setEffectsEnabled(prefs.effectsEnabled)
    setSoundsEnabled(prefs.soundsEnabled)
    setIntensity(prefs.intensity)
  }, [])

  // Save preferences when they change
  useEffect(() => {
    savePreferences({
      effectsEnabled,
      soundsEnabled,
      intensity,
    })
  }, [effectsEnabled, soundsEnabled, intensity])

  // Sound state
  const [sounds] = useState(defaultHalloweenSounds)

  // Ambient sound cleanup ref
  const ambientCleanupRef = useRef<(() => void) | null>(null)

  // Setup ambient sounds when theme or sound settings change
  useEffect(() => {
    // Cleanup previous ambient loop
    if (ambientCleanupRef.current) {
      ambientCleanupRef.current()
      ambientCleanupRef.current = null
    }

    // Start new ambient loop if Halloween theme and sounds enabled
    if (isHalloween && soundsEnabled && effectsEnabled) {
      ambientCleanupRef.current = createAmbientLoop(sounds, true)
    }

    return () => {
      if (ambientCleanupRef.current) {
        ambientCleanupRef.current()
        ambientCleanupRef.current = null
      }
    }
  }, [isHalloween, soundsEnabled, effectsEnabled, sounds])

  // Warm up audio on first user interaction
  useEffect(() => {
    const warmup = () => {
      warmupSoundEngine()
      document.removeEventListener('click', warmup)
      document.removeEventListener('keydown', warmup)
    }

    document.addEventListener('click', warmup)
    document.addEventListener('keydown', warmup)

    return () => {
      document.removeEventListener('click', warmup)
      document.removeEventListener('keydown', warmup)
    }
  }, [])

  // Toggle effects
  const toggleEffects = useCallback(() => {
    setEffectsEnabled(prev => !prev)
  }, [])

  // Toggle sounds
  const toggleSounds = useCallback(() => {
    setSoundsEnabled(prev => !prev)
  }, [])

  // Set intensity
  const handleSetIntensity = useCallback((newIntensity: number) => {
    setIntensity(Math.max(0, Math.min(1, newIntensity)))
  }, [])

  // Play a sound effect
  const handlePlaySound = useCallback((type: SoundEffectType) => {
    if (!isHalloween || !soundsEnabled || !effectsEnabled) return
    playSound(type, sounds, intensity)
  }, [isHalloween, soundsEnabled, effectsEnabled, sounds, intensity])

  // Build context value
  const value = useMemo<ThemeLayerContextType>(() => ({
    theme,
    effectsEnabled,
    soundsEnabled,
    intensity,
    toggleEffects,
    toggleSounds,
    setIntensity: handleSetIntensity,
    playSound: handlePlaySound,
  }), [
    theme,
    effectsEnabled,
    soundsEnabled,
    intensity,
    toggleEffects,
    toggleSounds,
    handleSetIntensity,
    handlePlaySound,
  ])

  return (
    <ThemeLayerContext.Provider value={value}>
      {children}
    </ThemeLayerContext.Provider>
  )
}

/**
 * Hook to use the theme layer context
 */
export function useThemeLayer(): ThemeLayerContextType {
  const context = useContext(ThemeLayerContext)
  if (context === undefined) {
    throw new Error('useThemeLayer must be used within a ThemeLayerProvider')
  }
  return context
}
