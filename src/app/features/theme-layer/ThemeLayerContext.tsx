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
  ThemeLayerState,
  ThemeOverlay,
  SoundEffect,
  NodeSkin,
  EdgeSkin,
  CardTemplate,
  ThemePlugin,
  SoundEffectType,
  NodeSkinType,
  EdgeSkinType,
  ThemeLayerPreferences,
  THEME_LAYER_STORAGE_KEY,
} from './lib/types'
import {
  defaultHalloweenSounds,
  defaultHalloweenNodeSkins,
  defaultHalloweenEdgeSkins,
  defaultHalloweenCardTemplates,
} from './lib/defaultAssets'
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
    disabledOverlays: [],
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
 * - Toggleable overlays and effects
 * - Sound effect management
 * - Node/edge skin management
 * - Plugin registration system
 * - Card template management
 */
export function ThemeLayerProvider({ children }: ThemeLayerProviderProps) {
  const { theme } = useTheme()
  const isHalloween = theme === 'halloween'

  // Load initial preferences
  const [effectsEnabled, setEffectsEnabled] = useState(true)
  const [soundsEnabled, setSoundsEnabled] = useState(true)
  const [intensity, setIntensity] = useState(1)
  const [disabledOverlays, setDisabledOverlays] = useState<string[]>([])

  // Initialize from localStorage after mount
  useEffect(() => {
    const prefs = loadPreferences()
    setEffectsEnabled(prefs.effectsEnabled)
    setSoundsEnabled(prefs.soundsEnabled)
    setIntensity(prefs.intensity)
    setDisabledOverlays(prefs.disabledOverlays)
  }, [])

  // Save preferences when they change
  useEffect(() => {
    savePreferences({
      effectsEnabled,
      soundsEnabled,
      intensity,
      disabledOverlays,
    })
  }, [effectsEnabled, soundsEnabled, intensity, disabledOverlays])

  // Plugin and asset state
  const [plugins, setPlugins] = useState<ThemePlugin[]>([])
  const [overlays, setOverlays] = useState<ThemeOverlay[]>([])
  const [sounds, setSounds] = useState<SoundEffect[]>(defaultHalloweenSounds)
  const [nodeSkins, setNodeSkins] = useState<NodeSkin[]>(defaultHalloweenNodeSkins)
  const [edgeSkins, setEdgeSkins] = useState<EdgeSkin[]>(defaultHalloweenEdgeSkins)
  const [cardTemplates, setCardTemplates] = useState<CardTemplate[]>(defaultHalloweenCardTemplates)

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

  // Enable/disable specific overlay
  const setOverlayEnabled = useCallback((overlayId: string, enabled: boolean) => {
    setDisabledOverlays(prev => {
      if (enabled) {
        return prev.filter(id => id !== overlayId)
      } else {
        return prev.includes(overlayId) ? prev : [...prev, overlayId]
      }
    })
  }, [])

  // Set overlay intensity
  const setOverlayIntensity = useCallback((overlayId: string, overlayIntensity: number) => {
    setOverlays(prev =>
      prev.map(overlay =>
        overlay.id === overlayId
          ? { ...overlay, intensity: Math.max(0, Math.min(1, overlayIntensity)) }
          : overlay
      )
    )
  }, [])

  // Play a sound effect
  const handlePlaySound = useCallback((type: SoundEffectType) => {
    if (!isHalloween || !soundsEnabled || !effectsEnabled) return
    playSound(type, sounds, intensity)
  }, [isHalloween, soundsEnabled, effectsEnabled, sounds, intensity])

  // Register a plugin
  const registerPlugin = useCallback(async (plugin: ThemePlugin) => {
    // Check if plugin targets current theme
    if (plugin.targetTheme !== theme) {
      console.warn(`[ThemeLayer] Plugin ${plugin.id} targets ${plugin.targetTheme}, but current theme is ${theme}`)
      return
    }

    // Check for duplicate
    if (plugins.some(p => p.id === plugin.id)) {
      console.warn(`[ThemeLayer] Plugin ${plugin.id} already registered`)
      return
    }

    // Initialize plugin
    if (plugin.init) {
      try {
        await plugin.init()
      } catch (err) {
        console.error(`[ThemeLayer] Failed to initialize plugin ${plugin.id}:`, err)
        return
      }
    }

    // Register plugin
    setPlugins(prev => [...prev, plugin])

    // Merge plugin assets
    if (plugin.overlays) {
      setOverlays(prev => [...prev, ...plugin.overlays!])
    }
    if (plugin.sounds) {
      setSounds(prev => [...prev, ...plugin.sounds!])
    }
    if (plugin.nodeSkins) {
      setNodeSkins(prev => [...prev, ...plugin.nodeSkins!])
    }
    if (plugin.edgeSkins) {
      setEdgeSkins(prev => [...prev, ...plugin.edgeSkins!])
    }
    if (plugin.cardTemplates) {
      setCardTemplates(prev => [...prev, ...plugin.cardTemplates!])
    }

    console.log(`[ThemeLayer] Registered plugin: ${plugin.name} v${plugin.version}`)
  }, [theme, plugins])

  // Unregister a plugin
  const unregisterPlugin = useCallback((pluginId: string) => {
    const plugin = plugins.find(p => p.id === pluginId)
    if (!plugin) return

    // Call cleanup
    if (plugin.destroy) {
      plugin.destroy()
    }

    // Remove plugin
    setPlugins(prev => prev.filter(p => p.id !== pluginId))

    // Remove plugin assets
    if (plugin.overlays) {
      const overlayIds = plugin.overlays.map(o => o.id)
      setOverlays(prev => prev.filter(o => !overlayIds.includes(o.id)))
    }
    if (plugin.sounds) {
      const soundIds = plugin.sounds.map(s => s.id)
      setSounds(prev => prev.filter(s => !soundIds.includes(s.id)))
    }
    if (plugin.nodeSkins) {
      const skinIds = plugin.nodeSkins.map(s => s.id)
      setNodeSkins(prev => prev.filter(s => !skinIds.includes(s.id)))
    }
    if (plugin.edgeSkins) {
      const skinIds = plugin.edgeSkins.map(s => s.id)
      setEdgeSkins(prev => prev.filter(s => !skinIds.includes(s.id)))
    }
    if (plugin.cardTemplates) {
      const templateIds = plugin.cardTemplates.map(t => t.id)
      setCardTemplates(prev => prev.filter(t => !templateIds.includes(t.id)))
    }

    console.log(`[ThemeLayer] Unregistered plugin: ${plugin.name}`)
  }, [plugins])

  // Get node skin for type
  const getNodeSkin = useCallback((type: NodeSkinType): NodeSkin | undefined => {
    if (!isHalloween || !effectsEnabled) return undefined
    return nodeSkins.find(s => s.type === type)
  }, [isHalloween, effectsEnabled, nodeSkins])

  // Get edge skin for type
  const getEdgeSkin = useCallback((type: EdgeSkinType): EdgeSkin | undefined => {
    if (!isHalloween || !effectsEnabled) return undefined
    return edgeSkins.find(s => s.type === type)
  }, [isHalloween, effectsEnabled, edgeSkins])

  // Get card templates
  const getCardTemplates = useCallback((): CardTemplate[] => {
    if (!isHalloween) return []
    return cardTemplates
  }, [isHalloween, cardTemplates])

  // Compute active overlays
  const activeOverlays = useMemo(() => {
    if (!isHalloween || !effectsEnabled) return []
    return overlays
      .filter(o => o.enabled && !disabledOverlays.includes(o.id))
      .map(o => ({ ...o, intensity: o.intensity * intensity }))
  }, [isHalloween, effectsEnabled, overlays, disabledOverlays, intensity])

  // Compute active sounds
  const activeSounds = useMemo(() => {
    if (!isHalloween || !soundsEnabled || !effectsEnabled) return []
    return sounds.filter(s => s.enabled)
  }, [isHalloween, soundsEnabled, effectsEnabled, sounds])

  // Compute active node skins
  const activeNodeSkins = useMemo(() => {
    if (!isHalloween || !effectsEnabled) return []
    return nodeSkins
  }, [isHalloween, effectsEnabled, nodeSkins])

  // Compute active edge skins
  const activeEdgeSkins = useMemo(() => {
    if (!isHalloween || !effectsEnabled) return []
    return edgeSkins
  }, [isHalloween, effectsEnabled, edgeSkins])

  // Build context value
  const value = useMemo<ThemeLayerContextType>(() => ({
    theme,
    effectsEnabled,
    soundsEnabled,
    intensity,
    activeOverlays,
    activeSounds,
    activeNodeSkins,
    activeEdgeSkins,
    cardTemplates: isHalloween ? cardTemplates : [],
    plugins,
    toggleEffects,
    toggleSounds,
    setIntensity: handleSetIntensity,
    setOverlayEnabled,
    setOverlayIntensity,
    playSound: handlePlaySound,
    registerPlugin,
    unregisterPlugin,
    getNodeSkin,
    getEdgeSkin,
    getCardTemplates,
  }), [
    theme,
    effectsEnabled,
    soundsEnabled,
    intensity,
    activeOverlays,
    activeSounds,
    activeNodeSkins,
    activeEdgeSkins,
    cardTemplates,
    isHalloween,
    plugins,
    toggleEffects,
    toggleSounds,
    handleSetIntensity,
    setOverlayEnabled,
    setOverlayIntensity,
    handlePlaySound,
    registerPlugin,
    unregisterPlugin,
    getNodeSkin,
    getEdgeSkin,
    getCardTemplates,
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

/**
 * Hook to get Halloween-specific theme layer features
 * Returns null if not in Halloween theme
 */
export function useHalloweenLayer() {
  const context = useContext(ThemeLayerContext)
  if (context === undefined || context.theme !== 'halloween') {
    return null
  }
  return context
}
