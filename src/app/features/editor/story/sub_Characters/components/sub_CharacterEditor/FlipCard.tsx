'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

interface FlipCardProps {
  /** The content to display */
  children: ReactNode
  /** Whether the card is in edit mode (flipped) */
  isEditMode: boolean
  /** Additional CSS classes */
  className?: string
  /** Test ID for the component */
  'data-testid'?: string
}

/**
 * FlipCard provides a 3D Y-axis flip animation when transitioning
 * between view and edit modes. The card rotates 180 degrees,
 * scales up slightly, and casts a soft shadow during the transition.
 */
export function FlipCard({
  children,
  isEditMode,
  className = '',
  'data-testid': testId,
}: FlipCardProps) {
  return (
    <div
      className={`perspective-1000 ${className}`}
      style={{ perspective: '1000px' }}
      data-testid={testId}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isEditMode ? 'edit' : 'view'}
          initial={{
            rotateY: isEditMode ? -90 : 90,
            scale: 0.95,
            opacity: 0,
          }}
          animate={{
            rotateY: 0,
            scale: 1,
            opacity: 1,
          }}
          exit={{
            rotateY: isEditMode ? 90 : -90,
            scale: 0.95,
            opacity: 0,
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1] as const, // Custom ease for smooth flip
          }}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
          className="will-change-transform"
          data-testid={`${testId}-content`}
        >
          {/* Shadow layer that appears during animation */}
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)' }}
            animate={{
              boxShadow: isEditMode
                ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            transition={{ duration: 0.3 }}
          />
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/**
 * FlipCardContent wraps individual tab content with flip animation.
 * Used inside TabsContent to animate content transitions.
 */
interface FlipCardContentProps {
  /** The content to display */
  children: ReactNode
  /** Unique key for the content (usually the tab value) */
  contentKey: string
  /** Whether this content represents edit mode */
  isEditMode: boolean
  /** Additional CSS classes */
  className?: string
}

export function FlipCardContent({
  children,
  contentKey,
  isEditMode,
  className = '',
}: FlipCardContentProps) {
  return (
    <motion.div
      key={contentKey}
      initial={{
        rotateY: isEditMode ? -90 : 90,
        scale: 0.95,
        opacity: 0,
      }}
      animate={{
        rotateY: 0,
        scale: 1,
        opacity: 1,
        boxShadow: isEditMode
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
      exit={{
        rotateY: isEditMode ? 90 : -90,
        scale: 0.95,
        opacity: 0,
      }}
      transition={{
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as const,
      }}
      style={{
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
      className={`will-change-transform ${className}`}
      data-testid={`flip-card-${contentKey}`}
    >
      {children}
    </motion.div>
  )
}
