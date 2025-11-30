/**
 * Theme Layer Engine Types
 *
 * This file defines the core types for the Halloween Theme Layer Engine.
 * The engine provides a plugin-based architecture for theme overlays,
 * animated node skins, sound effects, and auto-applied visual effects.
 */

import { ThemeName } from '@/lib/theme/theme-config'

/**
 * Theme layer overlay types
 */
export type OverlayType =
  | 'background'    // Full-screen background effects (fog, particles, vignette)
  | 'foreground'    // Foreground effects (floating elements, overlays)
  | 'ambient'       // Ambient effects (glow, shimmer)

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
 * Node skin types for different node states
 */
export type NodeSkinType =
  | 'default'         // Default node appearance
  | 'selected'        // Selected node
  | 'first'           // First/start node
  | 'dead-end'        // Dead end node
  | 'orphaned'        // Orphaned node
  | 'complete'        // Completed node

/**
 * Edge skin types
 */
export type EdgeSkinType =
  | 'default'         // Default edge appearance
  | 'highlighted'     // Highlighted edge
  | 'path'            // Edge on active path
  | 'animated'        // Animated edge

/**
 * Overlay configuration
 */
export interface ThemeOverlay {
  id: string
  type: OverlayType
  enabled: boolean
  intensity: number         // 0-1 intensity level
  zIndex: number
  component: React.ComponentType<OverlayProps>
}

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
 * Node skin configuration
 */
export interface NodeSkin {
  id: string
  type: NodeSkinType
  className: string         // CSS class to apply
  /** Additional inline styles */
  styles?: React.CSSProperties
  /** Animation class */
  animationClass?: string
  /** Icon override */
  icon?: React.ReactNode
}

/**
 * Edge skin configuration
 */
export interface EdgeSkin {
  id: string
  type: EdgeSkinType
  strokeColor: string
  strokeWidth: number
  animated: boolean
  dashArray?: string
  /** Glow effect */
  glowColor?: string
  glowIntensity?: number
}

/**
 * Card template for spooky pre-made cards
 */
export interface CardTemplate {
  id: string
  name: string
  description: string
  /** Preview image URL */
  previewUrl?: string
  /** Default title */
  title: string
  /** Default content */
  content: string
  /** Suggested image prompt */
  imagePrompt: string
  /** Theme tags */
  tags: string[]
}

/**
 * Theme plugin definition
 * Third-party plugins implement this interface to add custom assets
 */
export interface ThemePlugin {
  /** Unique plugin identifier */
  id: string
  /** Display name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin author */
  author?: string
  /** Plugin description */
  description?: string
  /** Target theme (e.g., 'halloween') */
  targetTheme: ThemeName
  /** Custom overlays */
  overlays?: ThemeOverlay[]
  /** Custom sound effects */
  sounds?: SoundEffect[]
  /** Custom node skins */
  nodeSkins?: NodeSkin[]
  /** Custom edge skins */
  edgeSkins?: EdgeSkin[]
  /** Card templates */
  cardTemplates?: CardTemplate[]
  /** Initialization function */
  init?: () => Promise<void>
  /** Cleanup function */
  destroy?: () => void
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
  /** Active overlays */
  activeOverlays: ThemeOverlay[]
  /** Active sound effects */
  activeSounds: SoundEffect[]
  /** Active node skins */
  activeNodeSkins: NodeSkin[]
  /** Active edge skins */
  activeEdgeSkins: EdgeSkin[]
  /** Available card templates */
  cardTemplates: CardTemplate[]
  /** Registered plugins */
  plugins: ThemePlugin[]
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
  /** Enable/disable specific overlay */
  setOverlayEnabled: (overlayId: string, enabled: boolean) => void
  /** Set overlay intensity */
  setOverlayIntensity: (overlayId: string, intensity: number) => void
  /** Play a sound effect */
  playSound: (type: SoundEffectType) => void
  /** Register a plugin */
  registerPlugin: (plugin: ThemePlugin) => Promise<void>
  /** Unregister a plugin */
  unregisterPlugin: (pluginId: string) => void
  /** Get node skin for type */
  getNodeSkin: (type: NodeSkinType) => NodeSkin | undefined
  /** Get edge skin for type */
  getEdgeSkin: (type: EdgeSkinType) => EdgeSkin | undefined
  /** Get card templates */
  getCardTemplates: () => CardTemplate[]
}

/**
 * Theme layer context type
 */
export interface ThemeLayerContextType extends ThemeLayerState, ThemeLayerActions {}

/**
 * Storage key for persisting theme layer preferences
 */
export const THEME_LAYER_STORAGE_KEY = 'halloween-theme-layer-prefs'

/**
 * Default theme layer preferences
 */
export interface ThemeLayerPreferences {
  effectsEnabled: boolean
  soundsEnabled: boolean
  intensity: number
  disabledOverlays: string[]
}
