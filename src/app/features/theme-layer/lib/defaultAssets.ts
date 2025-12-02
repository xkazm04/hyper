/**
 * Default Halloween Theme Assets
 *
 * This file contains the built-in Halloween theme assets including
 * sound effects.
 */

import type { SoundEffect } from './types'

/**
 * Default Halloween sound effects using Web Audio API synthesis
 */
export const defaultHalloweenSounds: SoundEffect[] = [
  {
    id: 'halloween-node-click',
    type: 'node-click',
    enabled: true,
    volume: 0.25,
    frequency: 440,      // A4 - spooky tone
    duration: 0.15,
  },
  {
    id: 'halloween-node-drop',
    type: 'node-drop',
    enabled: true,
    volume: 0.3,
    frequency: 330,      // E4 - lower mysterious tone
    duration: 0.35,
  },
  {
    id: 'halloween-node-create',
    type: 'node-create',
    enabled: true,
    volume: 0.3,
    frequency: 523,      // C5 - rising tone
    duration: 0.4,
  },
  {
    id: 'halloween-node-delete',
    type: 'node-delete',
    enabled: true,
    volume: 0.25,
    frequency: 220,      // A3 - descending ominous tone
    duration: 0.3,
  },
  {
    id: 'halloween-edge-connect',
    type: 'edge-connect',
    enabled: true,
    volume: 0.2,
    frequency: 392,      // G4 - connection chime
    duration: 0.25,
  },
  {
    id: 'halloween-theme-toggle',
    type: 'theme-toggle',
    enabled: true,
    volume: 0.35,
    frequency: 294,      // D4 - mystical transition
    duration: 0.5,
  },
  {
    id: 'halloween-success',
    type: 'success',
    enabled: true,
    volume: 0.3,
    frequency: 659,      // E5 - bright success
    duration: 0.3,
  },
  {
    id: 'halloween-error',
    type: 'error',
    enabled: true,
    volume: 0.25,
    frequency: 175,      // F3 - low warning
    duration: 0.4,
  },
]

/**
 * Get all default Halloween assets
 */
export function getDefaultHalloweenAssets() {
  return {
    sounds: defaultHalloweenSounds,
  }
}
