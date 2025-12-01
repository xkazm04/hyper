'use client'

import { useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { GripVertical, ChevronLeft, ChevronRight } from 'lucide-react'

interface ResizableSplitterProps {
  /** Whether currently dragging */
  isDragging: boolean
  /** Start drag handler */
  onDragStart: (clientX: number) => void
  /** Drag move handler */
  onDrag: (clientX: number) => void
  /** End drag handler */
  onDragEnd: () => void
  /** Whether collapsed to icon mode */
  isCollapsed?: boolean
  /** Callback when collapsed state toggle is requested */
  onToggleCollapse?: () => void
}

export function ResizableSplitter({
  isDragging,
  onDragStart,
  onDrag,
  onDragEnd,
  isCollapsed = false,
  onToggleCollapse,
}: ResizableSplitterProps) {
  // Spring animation for visual feedback
  const scale = useMotionValue(1)
  const springScale = useSpring(scale, {
    stiffness: 400,
    damping: 30,
  })

  // Handle mouse/touch events
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      scale.set(1.1)
      onDragStart(e.clientX)
    },
    [onDragStart, scale]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      e.preventDefault()
      onDrag(e.clientX)
    },
    [isDragging, onDrag]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      scale.set(1)
      onDragEnd()
    },
    [onDragEnd, scale]
  )

  // Add global event listeners during drag for better UX
  useEffect(() => {
    if (!isDragging) return

    const handleGlobalMove = (e: PointerEvent) => {
      onDrag(e.clientX)
    }

    const handleGlobalUp = () => {
      scale.set(1)
      onDragEnd()
    }

    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'

    window.addEventListener('pointermove', handleGlobalMove)
    window.addEventListener('pointerup', handleGlobalUp)

    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      window.removeEventListener('pointermove', handleGlobalMove)
      window.removeEventListener('pointerup', handleGlobalUp)
    }
  }, [isDragging, onDrag, onDragEnd, scale])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToggleCollapse?.()
      }
    },
    [onToggleCollapse]
  )

  // Collapsed state: show thin icon bar
  if (isCollapsed) {
    return (
      <motion.div
        className="flex-shrink-0 w-6 flex flex-col items-center justify-center bg-muted/30 border-x border-border cursor-pointer"
        onClick={onToggleCollapse}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Expand panel splitter"
        data-testid="splitter-collapsed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronRight className="w-3 h-3 text-muted-foreground" />
      </motion.div>
    )
  }

  return (
    <motion.div
      className={`
        flex-shrink-0 w-3 flex flex-col items-center justify-center
        bg-muted/30 border-x border-border
        cursor-col-resize select-none touch-none
        transition-colors duration-150
        hover:bg-primary/10 hover:border-primary/30
        ${isDragging ? 'bg-primary/20 border-primary/50' : ''}
      `}
      style={{ scale: springScale }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel splitter"
      aria-valuenow={50}
      tabIndex={0}
      data-testid="splitter-handle"
      whileHover={{ backgroundColor: 'rgba(var(--primary-rgb), 0.1)' }}
    >
      <motion.div
        className="flex flex-col gap-0.5"
        animate={{
          opacity: isDragging ? 1 : 0.5,
        }}
        transition={{ duration: 0.1 }}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground" />
      </motion.div>

      {/* Visual feedback line */}
      <motion.div
        className="absolute inset-y-0 w-0.5 bg-primary/50 pointer-events-none"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{
          opacity: isDragging ? 1 : 0,
          scaleY: isDragging ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
      />
    </motion.div>
  )
}

// Export additional collapsed toggle button for use in narrow layouts
export function SplitterToggleButton({
  isPreviewVisible,
  onToggle,
}: {
  isPreviewVisible: boolean
  onToggle: () => void
}) {
  return (
    <motion.button
      className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground bg-muted/50 rounded border border-border hover:border-primary/30 transition-colors"
      onClick={onToggle}
      aria-label={isPreviewVisible ? 'Hide preview' : 'Show preview'}
      data-testid="splitter-toggle-btn"
      whileTap={{ scale: 0.95 }}
    >
      {isPreviewVisible ? (
        <>
          <ChevronLeft className="w-3 h-3" />
          <span>Options</span>
        </>
      ) : (
        <>
          <span>Preview</span>
          <ChevronRight className="w-3 h-3" />
        </>
      )}
    </motion.button>
  )
}
