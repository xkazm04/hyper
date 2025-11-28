'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Undo2, Redo2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HistoryEntry } from '../lib/types'

interface UndoRedoToastProps {
  action: HistoryEntry | null
  onJumpToState?: () => void
  onDismiss?: () => void
  duration?: number
}

export function UndoRedoToast({
  action,
  onJumpToState,
  onDismiss,
  duration = 4000,
}: UndoRedoToastProps) {
  const [visible, setVisible] = useState(false)
  const [currentAction, setCurrentAction] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    if (action && action.id !== currentAction?.id) {
      setCurrentAction(action)
      setVisible(true)

      const timer = setTimeout(() => {
        setVisible(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [action, currentAction?.id, duration])

  const handleDismiss = () => {
    setVisible(false)
    onDismiss?.()
  }

  const handleJump = () => {
    onJumpToState?.()
    setVisible(false)
  }

  const isUndo = currentAction?.actionLabel.startsWith('Undo:')
  const isRedo = currentAction?.actionLabel.startsWith('Redo:')
  const Icon = isRedo ? Redo2 : Undo2

  return (
    <AnimatePresence>
      {visible && currentAction && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]',
            'flex items-center gap-3 px-4 py-3 rounded-lg',
            'bg-card border-2 border-border shadow-theme',
            'min-w-[280px] max-w-[400px]'
          )}
          role="status"
          aria-live="polite"
          data-testid="undo-redo-toast"
        >
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
              isUndo && 'bg-yellow-100 text-yellow-700',
              isRedo && 'bg-blue-100 text-blue-700',
              !isUndo && !isRedo && 'bg-primary/10 text-primary'
            )}
            data-testid="undo-redo-toast-icon"
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate" data-testid="undo-redo-toast-label">
              {currentAction.actionLabel}
            </p>
            {currentAction.affectedCardTitle && (
              <p className="text-xs text-muted-foreground truncate" data-testid="undo-redo-toast-card-title">
                {currentAction.affectedCardTitle}
              </p>
            )}
          </div>

          {/* Card Preview Thumbnail */}
          {currentAction.affectedCardImageUrl && (
            <div
              className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden border border-border bg-muted"
              data-testid="undo-redo-toast-thumbnail"
            >
              <img
                src={currentAction.affectedCardImageUrl}
                alt={currentAction.affectedCardTitle || 'Card preview'}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Jump Button */}
          {onJumpToState && (
            <button
              onClick={handleJump}
              className={cn(
                'flex-shrink-0 px-2 py-1 text-xs font-medium rounded',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
              )}
              data-testid="undo-redo-toast-jump-btn"
            >
              View
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className={cn(
              'flex-shrink-0 p-1 rounded-md',
              'text-muted-foreground hover:text-foreground',
              'hover:bg-muted transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring'
            )}
            aria-label="Dismiss notification"
            data-testid="undo-redo-toast-close-btn"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
