'use client'

import React, { forwardRef, ElementType } from 'react'
import { cn } from '@/lib/utils'
import { CardAnimationType, getAnimationClass, needsGroupWrapper } from './config'

export interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The type of card animation to apply */
  animationType?: CardAnimationType
  /** Whether to wrap children in a group for group-hover animations */
  asGroup?: boolean
  /** Element to render as (default: div) */
  as?: ElementType
  /** Test ID for automated testing */
  'data-testid'?: string
}

/**
 * AnimatedCard - A wrapper component that applies card-type-specific
 * micro-animations on hover and focus.
 *
 * Usage:
 * ```tsx
 * <AnimatedCard animationType="story">
 *   <CardContent>...</CardContent>
 * </AnimatedCard>
 * ```
 */
const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      animationType = 'default',
      asGroup,
      as: Component = 'div',
      className,
      children,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    const animationClass = getAnimationClass(animationType)
    const shouldUseGroup = asGroup ?? needsGroupWrapper(animationType)

    const combinedClassName = cn(
      shouldUseGroup && 'group',
      animationClass,
      className
    )

    const Element = Component

    return (
      <Element
        ref={ref}
        className={combinedClassName}
        data-testid={testId}
        {...props}
      >
        {children}
      </Element>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'

export default AnimatedCard
