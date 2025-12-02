/**
 * Theme Layer Engine Types
 *
 * This file defines the core types for the Halloween Theme Layer Engine.
 * The engine provides sound effects and visual overlay effects.
 */

import { ThemeName } from '@/lib/theme/theme-config'

/**
 * Sound effect types available in the theme
 */
export type SoundEffectType =
  | 'node-click'      // When a node is clicked
  | 'node-drop'       // When a node is dropped
  | 'node-create'     // When a new node is created
  | 'node-delete'     // When a node is deleted
  | 'edge-connect'    // When edges are connected
  | 'theme-toggle'    // When theme is toggled
  | 'success'         // Success action
  | 'error'           // Error action
  | 'ambient'         // Background ambient sound

/**
 * Props passed to overlay components
 */
export interface OverlayProps {
  intensity: number
  isActive: boolean
}

/**
 * Sound effect configuration
 */
export interface SoundEffect {
  id: string
  type: SoundEffectType
  enabled: boolean
  volume: number            // 0-1 volume level
  /** Frequency for synthesized sounds */
  frequency?: number
  /** Duration in seconds */
  duration?: number
  /** URL for audio file (optional) */
  audioUrl?: string
}

/**
 * Theme layer state
 */
export interface ThemeLayerState {
  /** Current active theme */
  theme: ThemeName
  /** Whether theme effects are enabled */
  effectsEnabled: boolean
  /** Whether sound effects are enabled */
  soundsEnabled: boolean
  /** Global effect intensity (0-1) */
  intensity: number
}

/**
 * Theme layer context actions
 */
export interface ThemeLayerActions {
  /** Toggle effects on/off */
  toggleEffects: () => void
  /** Toggle sounds on/off */
  toggleSounds: () => void
  /** Set global intensity */
  setIntensity: (intensity: number) => void
  /** Play a sound effect */
  playSound: (type: SoundEffectType) => void
}

/**
 * Theme layer context type
 */
export interface ThemeLayerContextType extends ThemeLayerState, ThemeLayerActions {}

/**
 * Default theme layer preferences
 */
export interface ThemeLayerPreferences {
  effectsEnabled: boolean
  soundsEnabled: boolean
  intensity: number
}
