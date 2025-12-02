/**
 * Halloween Theme Layer Engine
 *
 * A theme-layer architecture that provides:
 * - Toggleable Halloween overlays (fog, particles, vignette, spider webs, ghosts)
 * - Halloween sound effects (Web Audio API synthesis)
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
 * const { playSound, toggleEffects } = useThemeLayer()
 * ```
 */

// Context and Provider
export { ThemeLayerProvider, useThemeLayer } from './ThemeLayerContext'

// Components
export { HalloweenOverlay } from './components/HalloweenOverlay'

// Sound Engine
export { playSynthSound, playSound, warmupSoundEngine, createAmbientLoop } from './lib/soundEngine'

// Types
export type {
  ThemeLayerContextType,
  ThemeLayerState,
  ThemeLayerActions,
  SoundEffect,
  SoundEffectType,
  OverlayProps,
  ThemeLayerPreferences,
} from './lib/types'

// Default Assets
export {
  defaultHalloweenSounds,
  getDefaultHalloweenAssets,
} from './lib/defaultAssets'
