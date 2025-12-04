'use client'

import { useCallback, useEffect, useState, useMemo, memo } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { useEditor } from '@/contexts/EditorContext'
import { Button } from '@/components/ui/button'
import { Trash2, X, ImageIcon, Type, FileText, GitBranch } from 'lucide-react'
import { LazyNodeImage } from './LazyNodeImage'

export interface NodePreviewPanelProps {
  nodeId: string
  /** Screen position (x = right edge of node, y = top of node) */
  nodePosition: { x: number; y: number } | null
  /** @deprecated No longer used - kept for API compatibility */
  containerRect?: DOMRect | null
  /** @deprecated No longer used - kept for API compatibility */
  onEdit?: (cardId: string) => void
  onDelete: (cardId: string) => void
  onClose: () => void
  /** @deprecated No longer used - kept for API compatibility */
  onGoToSetup?: (cardId: string) => void
}

/**
 * NodePreviewPanel - Floating preview panel for story nodes
 *
 * Displays card details on hover/selection:
 * - Title
 * - Image thumbnail
 * - Content snippet
 * - Delete button
 *
 * Rendered via React portal to avoid clipping issues.
 */
export const NodePreviewPanel = memo(function NodePreviewPanel({
  nodeId,
  nodePosition,
  onDelete,
  onClose,
}: NodePreviewPanelProps) {
  const { theme } = useTheme()
  const { storyCards, choices } = useEditor()
  const isHalloween = theme === 'halloween'
  const [isDeleting, setIsDeleting] = useState(false)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null)

  // Find the card data
  const card = storyCards.find(c => c.id === nodeId)

  // Get choice count for this card
  const cardChoices = choices.filter(c => c.storyCardId === nodeId)

  // Check if other cards have choices pointing to this card (predecessors)
  // If so, deletion should be prevented to maintain graph integrity
  const predecessorCount = useMemo(() => {
    return choices.filter(c => c.targetCardId === nodeId).length
  }, [choices, nodeId])

  const canDelete = predecessorCount === 0

  // Create portal container on mount
  useEffect(() => {
    setPortalContainer(document.body)
  }, [])

  const handleDelete = useCallback(async () => {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await onDelete(nodeId)
      onClose()
    } finally {
      setIsDeleting(false)
    }
  }, [nodeId, onDelete, onClose, isDeleting])

  // Don't render if no card data or position
  if (!card || !nodePosition || !portalContainer) {
    return null
  }

  // Calculate panel position (to the right of the node, within viewport)
  const panelWidth = 280
  const panelOffset = 12
  const nodeWidth = 140 // StoryNode width

  // nodePosition is already in screen coordinates (from getBoundingClientRect)
  // nodePosition.x is the right edge of the node
  const screenX = nodePosition.x + panelOffset
  const screenY = nodePosition.y

  // Clamp to viewport bounds
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const panelHeight = 280 // Approximate height (reduced since we removed buttons)

  let finalX = screenX
  let finalY = screenY

  // If panel would go off right edge, show on left side of node
  if (finalX + panelWidth > viewportWidth - 16) {
    finalX = nodePosition.x - nodeWidth - panelWidth - panelOffset
  }

  // Keep within vertical bounds
  if (finalY + panelHeight > viewportHeight - 16) {
    finalY = viewportHeight - panelHeight - 16
  }
  if (finalY < 16) {
    finalY = 16
  }

  // Truncate content for preview
  const contentPreview = card.content
    ? card.content.length > 150
      ? card.content.slice(0, 150) + '...'
      : card.content
    : null

  const hasTitle = Boolean(card.title && card.title.trim())
  const hasContent = Boolean(card.content && card.content.trim())
  const hasImage = Boolean(card.imageUrl)
  const hasChoices = cardChoices.length > 0

  const panelContent = (
    <div
      className={cn(
        'fixed w-[280px] rounded-xl border-2 shadow-2xl overflow-hidden',
        'animate-in fade-in-0 zoom-in-95 duration-150',
        isHalloween
          ? 'bg-card border-orange-500/30 backdrop-blur-md'
          : 'bg-card border-border backdrop-blur-md'
      )}
      style={{
        left: finalX,
        top: finalY,
        pointerEvents: 'auto',
        zIndex: 99999, // Extremely high z-index to ensure always on top
        isolation: 'isolate', // Create new stacking context
      }}
      data-testid="node-preview-panel"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={cn(
          'absolute top-2 right-2 z-10 p-1 rounded-full transition-colors',
          isHalloween
            ? 'hover:bg-orange-500/20 text-orange-400'
            : 'hover:bg-muted text-muted-foreground'
        )}
        data-testid="node-preview-close-btn"
        aria-label="Close preview"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Image thumbnail with lazy loading */}
      <div className="relative h-32 w-full overflow-hidden">
        <LazyNodeImage
          src={card.imageUrl}
          alt={card.title || 'Card image'}
          isVisible={true}
          isHalloween={isHalloween}
          className="w-full h-full"
          placeholderClassName="h-32"
        />
        {card.imageUrl && (
          <div className={cn(
            'absolute inset-0 bg-gradient-to-t from-card to-transparent pointer-events-none'
          )} />
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Title */}
        <div>
          <h3 className={cn(
            'font-semibold text-sm leading-tight line-clamp-2',
            isHalloween ? 'text-orange-100' : 'text-foreground'
          )} data-testid="node-preview-title">
            {card.title || 'Untitled Card'}
          </h3>
        </div>

        {/* Content snippet */}
        {contentPreview && (
          <p className={cn(
            'text-xs leading-relaxed line-clamp-3',
            isHalloween ? 'text-purple-200/80' : 'text-muted-foreground'
          )} data-testid="node-preview-content">
            {contentPreview}
          </p>
        )}

        {/* Completion indicators */}
        <div className="flex items-center gap-2">
          <CompletionBadge
            done={hasTitle}
            label="Title"
            icon={Type}
            isHalloween={isHalloween}
          />
          <CompletionBadge
            done={hasContent}
            label="Content"
            icon={FileText}
            isHalloween={isHalloween}
          />
          <CompletionBadge
            done={hasImage}
            label="Image"
            icon={ImageIcon}
            isHalloween={isHalloween}
          />
          <CompletionBadge
            done={hasChoices}
            label={`${cardChoices.length} choice${cardChoices.length !== 1 ? 's' : ''}`}
            icon={GitBranch}
            isHalloween={isHalloween}
          />
        </div>

        {/* Delete button */}
        <div className="pt-2 border-t border-border/50">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              'w-full h-8 justify-start',
              canDelete
                ? 'text-red-500 hover:text-red-600 hover:bg-red-500/10'
                : 'text-muted-foreground/50 line-through cursor-not-allowed hover:bg-transparent'
            )}
            onClick={canDelete ? handleDelete : undefined}
            disabled={isDeleting || !canDelete}
            data-testid="node-preview-delete-btn"
          >
            <Trash2 className={cn('w-3.5 h-3.5 mr-1.5', !canDelete && 'opacity-50')} />
            <span className={cn(!canDelete && 'opacity-50')}>
              {isDeleting ? 'Deleting...' : canDelete ? 'Delete Card' : `Delete Card (${predecessorCount} link${predecessorCount > 1 ? 's' : ''})`}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )

  return createPortal(panelContent, portalContainer)
})

// Compact completion badge component
function CompletionBadge({
  done,
  label,
  icon: Icon,
  isHalloween
}: {
  done: boolean
  label: string
  icon: React.ComponentType<{ className?: string }>
  isHalloween: boolean
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
        done
          ? isHalloween
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-emerald-500/20 text-emerald-600'
          : isHalloween
            ? 'bg-purple-900/30 text-purple-400/50'
            : 'bg-muted text-muted-foreground/50'
      )}
      title={label}
    >
      <Icon className="w-2.5 h-2.5" />
    </div>
  )
}

NodePreviewPanel.displayName = 'NodePreviewPanel'
