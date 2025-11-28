/**
 * Card Animation Configuration
 *
 * Maps card types to their specific hover/focus animation classes.
 * Each card type has a unique micro-effect that enhances personality
 * without being distracting.
 */

export type CardAnimationType =
  | 'story'      // Dashboard story cards - glow pulse
  | 'image'      // Cards with images - thumbnail zoom
  | 'text'       // Text/content cards - typing indicator
  | 'graph'      // Graph nodes - border pulse
  | 'choice'     // Choice buttons - subtle bounce
  | 'nav'        // Navigation cards - slide hint
  | 'preview'    // Preview cards - float effect
  | 'badge'      // Status badges - sparkle effect
  | 'progress'   // Progress indicators - shimmer
  | 'icon'       // Action icons - wiggle
  | 'stack'      // Stacked cards - lift effect
  | 'default'    // Default subtle animation

export interface CardAnimationConfig {
  /** CSS class to apply for the animation */
  className: string
  /** Description of the animation effect */
  description: string
  /** Whether the animation requires a parent group class */
  requiresGroup?: boolean
}

/**
 * Animation configuration map
 * Each entry maps a card type to its animation settings
 */
export const cardAnimations: Record<CardAnimationType, CardAnimationConfig> = {
  story: {
    className: 'animate-story-card-hover',
    description: 'Gentle glow pulse effect',
  },
  image: {
    className: 'animate-image-zoom',
    description: 'Subtle zoom on hover',
  },
  text: {
    className: 'animate-typing-indicator',
    description: 'Typing cursor indicator',
    requiresGroup: true,
  },
  graph: {
    className: 'animate-node-pulse',
    description: 'Border color pulse',
  },
  choice: {
    className: 'animate-choice-hover',
    description: 'Subtle bounce effect',
  },
  nav: {
    className: 'animate-nav-card',
    description: 'Slide right hint',
  },
  preview: {
    className: 'animate-preview-float',
    description: 'Gentle floating effect',
  },
  badge: {
    className: 'animate-badge-sparkle',
    description: 'Sparkle glow effect',
  },
  progress: {
    className: 'animate-progress-shimmer',
    description: 'Shimmer fill effect',
    requiresGroup: true,
  },
  icon: {
    className: 'animate-icon-wiggle',
    description: 'Subtle rotation wiggle',
  },
  stack: {
    className: 'animate-stack-lift',
    description: 'Lift and tilt effect',
  },
  default: {
    className: '',
    description: 'No special animation',
  },
}

/**
 * Get animation class for a specific card type
 */
export function getAnimationClass(type: CardAnimationType): string {
  return cardAnimations[type]?.className || ''
}

/**
 * Get animation config for a specific card type
 */
export function getAnimationConfig(type: CardAnimationType): CardAnimationConfig {
  return cardAnimations[type] || cardAnimations.default
}

/**
 * Helper to determine if animation needs group wrapper
 */
export function needsGroupWrapper(type: CardAnimationType): boolean {
  return cardAnimations[type]?.requiresGroup || false
}
