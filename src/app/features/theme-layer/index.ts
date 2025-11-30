/**
 * Halloween Theme Layer Engine
 *
 * A comprehensive theme-layer architecture that provides:
 * - Toggleable Halloween overlays (fog, particles, vignette, spider webs, ghosts)
 * - Animated node skins for story graph
 * - Halloween sound effects (Web Audio API synthesis)
 * - Auto-generated spooky card templates
 * - Theme plugin API for third-party Halloween assets
 *
 * @example
 * ```tsx
 * import { ThemeLayerProvider, HalloweenOverlay, useThemeLayer } from '@/app/features/theme-layer'
 *
 * // Wrap your app with the provider
 * <ThemeLayerProvider>
 *   <HalloweenOverlay />
 *   <App />
 * </ThemeLayerProvider>
 *
 * // Use in components
 * const { playSound, getNodeSkin, toggleEffects } = useThemeLayer()
 * ```
 */

// Context and Provider
export { ThemeLayerProvider, useThemeLayer, useHalloweenLayer } from './ThemeLayerContext'

// Components
export { HalloweenOverlay } from './components/HalloweenOverlay'
export { ThemeLayerControls } from './components/ThemeLayerControls'
export { SpookyCardTemplates, SpookyTemplatesButton } from './components/SpookyCardTemplates'

// Hooks
export {
  useHalloweenNodeSkin,
  useHalloweenEdgeSkin,
  useHalloweenSounds,
  useHalloweenTheme,
} from './lib/useNodeSkins'

// Plugin API
export { createHalloweenPlugin, validatePlugin, examplePlugin } from './lib/pluginAPI'

// Sound Engine
export { playSynthSound, playSound, warmupSoundEngine, createAmbientLoop } from './lib/soundEngine'

// Types
export type {
  ThemeLayerContextType,
  ThemeLayerState,
  ThemeLayerActions,
  ThemeOverlay,
  OverlayProps,
  SoundEffect,
  SoundEffectType,
  NodeSkin,
  NodeSkinType,
  EdgeSkin,
  EdgeSkinType,
  CardTemplate,
  ThemePlugin,
  ThemeLayerPreferences,
  OverlayType,
} from './lib/types'

// Default Assets
export {
  defaultHalloweenOverlays,
  defaultHalloweenSounds,
  defaultHalloweenNodeSkins,
  defaultHalloweenEdgeSkins,
  defaultHalloweenCardTemplates,
  getDefaultHalloweenAssets,
} from './lib/defaultAssets'
