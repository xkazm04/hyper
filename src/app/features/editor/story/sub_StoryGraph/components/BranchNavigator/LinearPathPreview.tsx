'use client'

import { memo, useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { PathNode } from '../../hooks/useBranchPath'
import {
  Play,
  GripVertical,
  ArrowDown,
  FileText,
  ImageIcon
} from 'lucide-react'

export interface LinearPathPreviewProps {
  /** The linear path of cards to display */
  path: PathNode[]
  /** Currently selected card ID (for highlighting) */
  currentCardId: string | null
  /** First card ID (for start indicator) */
  firstCardId: string | null
  /** Callback when a card is clicked */
  onCardClick?: (cardId: string) => void
  /** Callback when cards are reordered via drag */
  onReorder?: (fromIndex: number, toIndex: number) => void
  /** Halloween theme flag */
  isHalloween: boolean
}

/**
 * LinearPathPreview - Displays a linear list of cards in the selected path
 *
 * Features:
 * - Scrollable list of card previews
 * - Click to navigate to a card
 * - Optional drag-to-reorder functionality
 * - Visual indicators for start card, current selection, content status
 */
export const LinearPathPreview = memo(function LinearPathPreview({
  path,
  currentCardId,
  firstCardId,
  onCardClick,
  onReorder,
  isHalloween
}: LinearPathPreviewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragCounter = useRef(0)

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!onReorder) return
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    setDraggedIndex(index)
  }, [onReorder])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragCounter.current = 0
  }, [])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  // Handle drag enter
  const handleDragEnter = useCallback((index: number) => {
    if (draggedIndex === null || draggedIndex === index) return
    dragCounter.current++
    setDragOverIndex(index)
  }, [draggedIndex])

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragOverIndex(null)
    }
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (!isNaN(fromIndex) && fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex)
    }
    handleDragEnd()
  }, [onReorder, handleDragEnd])

  if (path.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'max-h-64 overflow-y-auto rounded-lg border',
        isHalloween ? 'border-orange-500/20 bg-purple-900/20' : 'border-border bg-muted/20'
      )}
      data-testid="linear-path-preview"
    >
      <div className="p-1.5 space-y-1">
        {path.map((node, index) => {
          const isFirst = node.card.id === firstCardId
          const isCurrent = node.card.id === currentCardId
          const isDragging = draggedIndex === index
          const isDragOver = dragOverIndex === index
          const hasContent = Boolean(node.card.content?.trim())
          const hasImage = Boolean(node.card.imageUrl)
          const isLastInPath = index === path.length - 1

          return (
            <div key={node.card.id}>
              {/* Card item */}
              <div
                draggable={!!onReorder && !isFirst}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onClick={() => onCardClick?.(node.card.id)}
                className={cn(
                  'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all',
                  'border-2',
                  isDragging && 'opacity-50',
                  isDragOver && (isHalloween
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-primary bg-primary/10'),
                  !isDragOver && !isDragging && (
                    isCurrent
                      ? isHalloween
                        ? 'bg-orange-500/20 border-orange-500/50'
                        : 'bg-primary/10 border-primary/50'
                      : 'border-transparent hover:bg-muted/50 hover:border-border/50'
                  )
                )}
                data-testid={`path-card-${index}`}
              >
                {/* Drag handle (only if reorder is enabled and not first card) */}
                {onReorder && !isFirst && (
                  <div className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing',
                    isHalloween ? 'text-purple-200/40' : 'text-muted-foreground/40'
                  )}>
                    <GripVertical className="w-3 h-3" />
                  </div>
                )}

                {/* Position indicator */}
                <div className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                  'text-[10px] font-bold',
                  isFirst
                    ? isHalloween
                      ? 'bg-orange-500/30 text-orange-300'
                      : 'bg-primary/20 text-primary'
                    : isCurrent
                      ? isHalloween
                        ? 'bg-orange-500/20 text-orange-300'
                        : 'bg-primary/15 text-primary'
                      : isHalloween
                        ? 'bg-purple-900/50 text-purple-200/60'
                        : 'bg-muted text-muted-foreground'
                )}>
                  {isFirst ? (
                    <Play className="w-2.5 h-2.5" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* Card info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-xs font-medium truncate',
                    isCurrent
                      ? isHalloween ? 'text-orange-100' : 'text-foreground'
                      : isHalloween ? 'text-purple-100' : 'text-foreground/80'
                  )}>
                    {node.card.title || 'Untitled'}
                  </p>

                  {/* Content excerpt */}
                  {hasContent && (
                    <p className={cn(
                      'text-[10px] truncate mt-0.5',
                      isHalloween ? 'text-purple-200/50' : 'text-muted-foreground/70'
                    )}>
                      {node.card.content!.slice(0, 50)}...
                    </p>
                  )}
                </div>

                {/* Status indicators */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasContent && (
                    <FileText className={cn(
                      'w-3 h-3',
                      isHalloween ? 'text-purple-300/40' : 'text-muted-foreground/40'
                    )} />
                  )}
                  {hasImage && (
                    <ImageIcon className={cn(
                      'w-3 h-3',
                      isHalloween ? 'text-purple-300/40' : 'text-muted-foreground/40'
                    )} />
                  )}
                </div>
              </div>

              {/* Arrow connector (except for last item) */}
              {!isLastInPath && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className={cn(
                    'w-3 h-3',
                    isHalloween ? 'text-purple-200/30' : 'text-muted-foreground/30'
                  )} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})

LinearPathPreview.displayName = 'LinearPathPreview'
