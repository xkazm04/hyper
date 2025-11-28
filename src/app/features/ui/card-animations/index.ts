/**
 * Card Animations Module
 *
 * Provides type-specific micro-animations for cards to add personality on hover/focus.
 * Implements subtle effects that make the UI feel more responsive and engaging.
 *
 * Available animation types:
 * - story: Glow pulse for dashboard story cards
 * - image: Thumbnail zoom for image cards
 * - text: Typing indicator for text content
 * - graph: Border pulse for graph nodes
 * - choice: Bounce for choice buttons
 * - nav: Slide hint for navigation items
 * - preview: Float effect for previews
 * - badge: Sparkle for status badges
 * - progress: Shimmer for progress bars
 * - icon: Wiggle for action icons
 * - stack: Lift for stacked cards
 */

export { default as AnimatedCard } from './AnimatedCard'
export type { AnimatedCardProps } from './AnimatedCard'

export {
  cardAnimations,
  getAnimationClass,
  getAnimationConfig,
  needsGroupWrapper,
} from './config'
export type { CardAnimationType, CardAnimationConfig } from './config'
