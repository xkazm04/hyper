'use client'

import { useRef, useEffect, useState } from 'react'
import { StoryCard } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronRight, GripVertical, FileText } from 'lucide-react'

interface OutlineNodeProps {
  card: StoryCard
  index: number
  isSelected: boolean
  isExpanded: boolean
  hasChildren: boolean
  depth: number
  onSelect: (cardId: string) => void
  onToggleExpand: (cardId: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent, index: number) => void
  isDragOver: boolean
  tabIndex: number
  isCommandHighlighted?: boolean
}

export default function OutlineNode({
  card,
  index,
  isSelected,
  isExpanded,
  hasChildren,
  depth,
  onSelect,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragOver,
  tabIndex,
  isCommandHighlighted = false,
}: OutlineNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [showHighlight, setShowHighlight] = useState(false)

  // Handle command highlight animation
  useEffect(() => {
    if (isCommandHighlighted) {
      setShowHighlight(true)
      const timer = setTimeout(() => {
        setShowHighlight(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [isCommandHighlighted])

  const handleClick = () => {
    onSelect(card.id)
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand(card.id)
  }

  return (
    <div
      ref={nodeRef}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-level={depth + 1}
      tabIndex={tabIndex}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, index)}
      onClick={handleClick}
      data-testid={`outline-node-${card.id}`}
      className={cn(
        'group flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer transition-all',
        'hover:bg-muted active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-muted/80',
        isSelected && 'bg-primary/10 border border-primary',
        !isSelected && 'border border-transparent',
        isDragOver && 'border-dashed border-primary bg-primary/5',
        showHighlight && 'command-target-highlight command-target-pop'
      )}
      style={{ paddingLeft: `${depth * 16 + 8}px` }}
    >
      {/* Drag Handle */}
      <div
        className="shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        data-testid={`outline-drag-handle-${card.id}`}
      >
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
      </div>

      {/* Expand/Collapse Button */}
      <button
        onClick={handleExpandClick}
        className={cn(
          'shrink-0 w-4 h-4 flex items-center justify-center rounded transition-transform',
          hasChildren ? 'hover:bg-muted' : 'invisible'
        )}
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
        data-testid={`outline-expand-btn-${card.id}`}
        tabIndex={-1}
      >
        <ChevronRight
          className={cn(
            'w-3 h-3 text-muted-foreground transition-transform',
            isExpanded && 'rotate-90'
          )}
        />
      </button>

      {/* Thumbnail Preview */}
      <div
        className="shrink-0 w-8 h-6 rounded bg-muted border border-border overflow-hidden"
        data-testid={`outline-thumbnail-${card.id}`}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-3 h-3 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Card Title */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-xs font-medium truncate block',
            isSelected ? 'text-primary' : 'text-foreground'
          )}
        >
          {card.title || 'Untitled Card'}
        </span>
      </div>

      {/* Order Index Badge */}
      <div className="shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center">
        <span className="text-[10px] font-bold text-muted-foreground">
          {index + 1}
        </span>
      </div>
    </div>
  )
}
