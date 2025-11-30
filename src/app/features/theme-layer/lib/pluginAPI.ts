/**
 * Theme Plugin API
 *
 * This module provides utilities for creating and registering
 * third-party Halloween theme plugins.
 */

import type {
  ThemePlugin,
  ThemeOverlay,
  SoundEffect,
  NodeSkin,
  EdgeSkin,
  CardTemplate,
  OverlayProps,
} from './types'

/**
 * Plugin builder for creating Halloween theme plugins
 */
export interface PluginBuilder {
  /** Set plugin metadata */
  setMeta(meta: { name: string; version: string; author?: string; description?: string }): PluginBuilder
  /** Add overlay */
  addOverlay(overlay: Omit<ThemeOverlay, 'component'> & { component: React.ComponentType<OverlayProps> }): PluginBuilder
  /** Add sound effect */
  addSound(sound: SoundEffect): PluginBuilder
  /** Add node skin */
  addNodeSkin(skin: NodeSkin): PluginBuilder
  /** Add edge skin */
  addEdgeSkin(skin: EdgeSkin): PluginBuilder
  /** Add card template */
  addCardTemplate(template: CardTemplate): PluginBuilder
  /** Set initialization function */
  onInit(fn: () => Promise<void>): PluginBuilder
  /** Set cleanup function */
  onDestroy(fn: () => void): PluginBuilder
  /** Build the plugin */
  build(): ThemePlugin
}

/**
 * Create a new Halloween theme plugin
 *
 * @example
 * ```typescript
 * const myPlugin = createHalloweenPlugin('my-plugin')
 *   .setMeta({
 *     name: 'My Halloween Plugin',
 *     version: '1.0.0',
 *     author: 'Your Name',
 *   })
 *   .addSound({
 *     id: 'custom-spooky-sound',
 *     type: 'node-click',
 *     enabled: true,
 *     volume: 0.3,
 *     frequency: 200,
 *     duration: 0.5,
 *   })
 *   .addCardTemplate({
 *     id: 'custom-template',
 *     name: 'Custom Spooky Scene',
 *     description: 'A custom scary scene',
 *     title: 'The Dark Room',
 *     content: 'You enter a dark room...',
 *     imagePrompt: 'Dark room, horror style',
 *     tags: ['custom', 'dark'],
 *   })
 *   .build()
 *
 * // Register the plugin
 * themeLayer.registerPlugin(myPlugin)
 * ```
 */
export function createHalloweenPlugin(id: string): PluginBuilder {
  const plugin: ThemePlugin = {
    id,
    name: id,
    version: '1.0.0',
    targetTheme: 'halloween',
    overlays: [],
    sounds: [],
    nodeSkins: [],
    edgeSkins: [],
    cardTemplates: [],
  }

  const builder: PluginBuilder = {
    setMeta(meta) {
      plugin.name = meta.name
      plugin.version = meta.version
      plugin.author = meta.author
      plugin.description = meta.description
      return builder
    },

    addOverlay(overlay) {
      plugin.overlays = plugin.overlays || []
      plugin.overlays.push(overlay as ThemeOverlay)
      return builder
    },

    addSound(sound) {
      plugin.sounds = plugin.sounds || []
      plugin.sounds.push(sound)
      return builder
    },

    addNodeSkin(skin) {
      plugin.nodeSkins = plugin.nodeSkins || []
      plugin.nodeSkins.push(skin)
      return builder
    },

    addEdgeSkin(skin) {
      plugin.edgeSkins = plugin.edgeSkins || []
      plugin.edgeSkins.push(skin)
      return builder
    },

    addCardTemplate(template) {
      plugin.cardTemplates = plugin.cardTemplates || []
      plugin.cardTemplates.push(template)
      return builder
    },

    onInit(fn) {
      plugin.init = fn
      return builder
    },

    onDestroy(fn) {
      plugin.destroy = fn
      return builder
    },

    build() {
      return plugin
    },
  }

  return builder
}

/**
 * Validate a theme plugin before registration
 */
export function validatePlugin(plugin: ThemePlugin): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!plugin.id || typeof plugin.id !== 'string') {
    errors.push('Plugin must have a valid id')
  }

  if (!plugin.name || typeof plugin.name !== 'string') {
    errors.push('Plugin must have a valid name')
  }

  if (!plugin.version || typeof plugin.version !== 'string') {
    errors.push('Plugin must have a valid version')
  }

  if (plugin.targetTheme !== 'halloween' && plugin.targetTheme !== 'light') {
    errors.push('Plugin targetTheme must be "halloween" or "light"')
  }

  // Validate sounds
  if (plugin.sounds) {
    plugin.sounds.forEach((sound, i) => {
      if (!sound.id) errors.push(`Sound ${i} missing id`)
      if (!sound.type) errors.push(`Sound ${i} missing type`)
    })
  }

  // Validate node skins
  if (plugin.nodeSkins) {
    plugin.nodeSkins.forEach((skin, i) => {
      if (!skin.id) errors.push(`NodeSkin ${i} missing id`)
      if (!skin.type) errors.push(`NodeSkin ${i} missing type`)
      if (!skin.className) errors.push(`NodeSkin ${i} missing className`)
    })
  }

  // Validate edge skins
  if (plugin.edgeSkins) {
    plugin.edgeSkins.forEach((skin, i) => {
      if (!skin.id) errors.push(`EdgeSkin ${i} missing id`)
      if (!skin.type) errors.push(`EdgeSkin ${i} missing type`)
    })
  }

  // Validate card templates
  if (plugin.cardTemplates) {
    plugin.cardTemplates.forEach((template, i) => {
      if (!template.id) errors.push(`CardTemplate ${i} missing id`)
      if (!template.name) errors.push(`CardTemplate ${i} missing name`)
      if (!template.title) errors.push(`CardTemplate ${i} missing title`)
      if (!template.content) errors.push(`CardTemplate ${i} missing content`)
    })
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Example plugin demonstrating the plugin API
 */
export const examplePlugin = createHalloweenPlugin('example-halloween-plugin')
  .setMeta({
    name: 'Example Halloween Plugin',
    version: '1.0.0',
    author: 'HyperCard Team',
    description: 'An example plugin demonstrating the theme plugin API',
  })
  .addSound({
    id: 'example-creepy-whisper',
    type: 'ambient',
    enabled: true,
    volume: 0.1,
    frequency: 150,
    duration: 3,
  })
  .addCardTemplate({
    id: 'example-dark-castle',
    name: 'The Dark Castle',
    description: 'A foreboding castle on a stormy night',
    title: 'Castle of Shadows',
    content: 'Lightning illuminates the ancient castle perched on the cliff. Its towers reach toward the churning sky like grasping fingers. The drawbridge is down, an invitation... or a trap.',
    imagePrompt: 'Gothic castle on cliff, lightning storm, dark clouds, medieval fantasy horror, dramatic lighting',
    tags: ['castle', 'storm', 'gothic'],
  })
  .onInit(async () => {
    console.log('[ExamplePlugin] Initialized!')
  })
  .onDestroy(() => {
    console.log('[ExamplePlugin] Destroyed!')
  })
  .build()
