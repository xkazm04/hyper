/**
 * Default Halloween Theme Assets
 *
 * This file contains the built-in Halloween theme assets including
 * overlays, sound effects, node skins, edge skins, and card templates.
 */

import type {
  ThemeOverlay,
  SoundEffect,
  NodeSkin,
  EdgeSkin,
  CardTemplate,
} from './types'

/**
 * Default Halloween overlays
 */
export const defaultHalloweenOverlays: Omit<ThemeOverlay, 'component'>[] = [
  {
    id: 'fog-layer',
    type: 'background',
    enabled: true,
    intensity: 0.6,
    zIndex: 1,
  },
  {
    id: 'floating-particles',
    type: 'background',
    enabled: true,
    intensity: 0.5,
    zIndex: 2,
  },
  {
    id: 'vignette',
    type: 'ambient',
    enabled: true,
    intensity: 0.7,
    zIndex: 3,
  },
  {
    id: 'spider-web',
    type: 'foreground',
    enabled: true,
    intensity: 0.4,
    zIndex: 4,
  },
  {
    id: 'floating-ghosts',
    type: 'foreground',
    enabled: true,
    intensity: 0.3,
    zIndex: 5,
  },
  {
    id: 'candle-glow',
    type: 'ambient',
    enabled: true,
    intensity: 0.5,
    zIndex: 6,
  },
]

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
 * Default Halloween node skins
 */
export const defaultHalloweenNodeSkins: NodeSkin[] = [
  {
    id: 'halloween-default',
    type: 'default',
    className: 'halloween-ghost-float halloween-corner-decoration',
    animationClass: 'animate-halloween-node-pulse',
  },
  {
    id: 'halloween-selected',
    type: 'selected',
    className: 'halloween-node-selected halloween-candle-flicker',
    animationClass: 'animate-halloween-accent-glow',
    styles: {
      boxShadow: '0 0 20px 4px hsl(25, 95%, 53% / 0.3), 0 0 40px 8px hsl(270, 70%, 60% / 0.15)',
    },
  },
  {
    id: 'halloween-first',
    type: 'first',
    className: 'halloween-portal-border halloween-pumpkin-glow',
    animationClass: 'animate-halloween-accent-glow',
  },
  {
    id: 'halloween-dead-end',
    type: 'dead-end',
    className: 'halloween-tombstone-border halloween-crack-hover',
    animationClass: 'animate-halloween-bob',
  },
  {
    id: 'halloween-orphaned',
    type: 'orphaned',
    className: 'halloween-fog-overlay halloween-skeleton-rattle',
    animationClass: 'animate-halloween-float-slow',
  },
  {
    id: 'halloween-complete',
    type: 'complete',
    className: 'halloween-bat-silhouette halloween-pumpkin-glow',
    animationClass: 'animate-halloween-twinkle',
  },
]

/**
 * Default Halloween edge skins
 */
export const defaultHalloweenEdgeSkins: EdgeSkin[] = [
  {
    id: 'halloween-default',
    type: 'default',
    strokeColor: 'hsl(270, 40%, 45%)',
    strokeWidth: 2,
    animated: false,
    glowColor: 'hsl(270, 70%, 60%)',
    glowIntensity: 0.3,
  },
  {
    id: 'halloween-highlighted',
    type: 'highlighted',
    strokeColor: 'hsl(25, 95%, 53%)',
    strokeWidth: 3,
    animated: true,
    glowColor: 'hsl(25, 95%, 53%)',
    glowIntensity: 0.5,
    dashArray: '5 5',
  },
  {
    id: 'halloween-path',
    type: 'path',
    strokeColor: 'hsl(270, 70%, 60%)',
    strokeWidth: 3,
    animated: true,
    glowColor: 'hsl(270, 80%, 65%)',
    glowIntensity: 0.6,
  },
  {
    id: 'halloween-animated',
    type: 'animated',
    strokeColor: 'hsl(280, 60%, 55%)',
    strokeWidth: 2,
    animated: true,
    dashArray: '8 4',
    glowColor: 'hsl(280, 70%, 60%)',
    glowIntensity: 0.4,
  },
]

/**
 * Default Halloween card templates
 */
export const defaultHalloweenCardTemplates: CardTemplate[] = [
  {
    id: 'haunted-mansion-entrance',
    name: 'Haunted Mansion Entrance',
    description: 'The beginning of a spooky adventure in a haunted mansion',
    title: 'The Haunted Mansion',
    content: 'You stand before an ancient Victorian mansion, its windows dark as empty eye sockets. A cold wind whispers through dead trees, carrying the faint sound of creaking floorboards from within. The iron gate groans as you push it open...',
    imagePrompt: 'Victorian haunted mansion at night, full moon, dead trees, iron gate, gothic horror style, misty atmosphere, orange and purple lighting',
    tags: ['horror', 'mansion', 'start'],
  },
  {
    id: 'dark-forest-path',
    name: 'Dark Forest Path',
    description: 'A mysterious path through a dark, enchanted forest',
    title: 'The Whispering Woods',
    content: 'Gnarled trees twist overhead, their branches reaching like skeletal fingers. Strange lights flicker between the trunks, and you hear whispers that seem to come from everywhere and nowhere. Two paths diverge ahead...',
    imagePrompt: 'Dark enchanted forest path, twisted trees, glowing wisps, fog, mysterious lights, fantasy horror style, purple and green lighting',
    tags: ['forest', 'mystery', 'choice'],
  },
  {
    id: 'graveyard-encounter',
    name: 'Graveyard Encounter',
    description: 'A tense moment in an old cemetery',
    title: 'Among the Tombstones',
    content: 'Ancient tombstones lean at odd angles, their inscriptions worn by centuries of rain. A figure moves between the graves, cloaked in shadow. As it turns toward you, two hollow eyes glow with an unearthly light...',
    imagePrompt: 'Old cemetery at night, ancient tombstones, cloaked ghostly figure, glowing eyes, full moon, gothic horror, mist rising from ground',
    tags: ['graveyard', 'ghost', 'encounter'],
  },
  {
    id: 'witch-cottage',
    name: 'Witch\'s Cottage',
    description: 'A discovery of a witch\'s hidden home',
    title: 'The Cottage in the Clearing',
    content: 'In a moonlit clearing stands a crooked cottage, smoke curling from its chimney. Strange herbs hang from the eaves, and a cauldron bubbles by the door. Through the window, you glimpse shelves of peculiar jars and a figure stirring something that glows...',
    imagePrompt: 'Witch cottage in forest clearing, crooked house, bubbling cauldron, hanging herbs, glowing potions, full moon, magical atmosphere',
    tags: ['witch', 'magic', 'cottage'],
  },
  {
    id: 'cursed-mirror',
    name: 'The Cursed Mirror',
    description: 'An encounter with a mysterious cursed mirror',
    title: 'Reflection of Darkness',
    content: 'An ornate mirror stands in the dusty room, its frame crawling with carved serpents. Your reflection stares back at you, but something is wrong—it moves independently, a sinister smile spreading across its face...',
    imagePrompt: 'Ornate cursed mirror, dark reflection with sinister smile, dusty Victorian room, candlelight, serpent-carved frame, horror atmosphere',
    tags: ['curse', 'mirror', 'supernatural'],
  },
  {
    id: 'vampire-ballroom',
    name: 'Vampire\'s Ballroom',
    description: 'A grand ballroom filled with undead dancers',
    title: 'The Eternal Dance',
    content: 'Ghostly music fills the grand ballroom as pale figures waltz in endless circles. Their eyes gleam crimson in the candlelight, and you notice none of them cast reflections. The host approaches with a silver goblet and a knowing smile...',
    imagePrompt: 'Gothic ballroom, vampire dancers waltzing, crimson eyes, crystal chandeliers, no reflections in mirrors, dark elegant atmosphere',
    tags: ['vampire', 'ballroom', 'undead'],
  },
  {
    id: 'pumpkin-patch',
    name: 'The Living Pumpkin Patch',
    description: 'A field of jack-o-lanterns that are more than they seem',
    title: 'Fields of Orange Fire',
    content: 'Hundreds of jack-o-lanterns spread across the field, their carved faces flickering with inner flame. As you walk among them, you notice their expressions changing, following your movement. Then one of them speaks...',
    imagePrompt: 'Massive pumpkin patch at night, hundreds of carved jack-o-lanterns with glowing faces, misty field, orange glow, Halloween atmosphere',
    tags: ['pumpkin', 'halloween', 'supernatural'],
  },
  {
    id: 'skeleton-crypt',
    name: 'The Skeleton King\'s Crypt',
    description: 'The final resting place of an ancient ruler',
    title: 'Bones of the King',
    content: 'Ancient bones arranged in ceremonial patterns cover the walls. In the center, upon a throne of skulls, sits the Skeleton King, crown still perched on his hollow head. As you enter, his jaw creaks open to speak...',
    imagePrompt: 'Underground crypt, skeleton king on bone throne, crown, ceremonial bone patterns, ancient tomb, eerie green and purple lighting',
    tags: ['skeleton', 'crypt', 'boss', 'end'],
  },
]

/**
 * Get all default Halloween assets
 */
export function getDefaultHalloweenAssets() {
  return {
    overlays: defaultHalloweenOverlays,
    sounds: defaultHalloweenSounds,
    nodeSkins: defaultHalloweenNodeSkins,
    edgeSkins: defaultHalloweenEdgeSkins,
    cardTemplates: defaultHalloweenCardTemplates,
  }
}
