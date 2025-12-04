'use client'

import { useRef, useEffect, useState } from 'react'
import { StoryCard, Choice } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronRight, GripVertical, FileText, Trash2, Type, ImageIcon, GitBranch, Volume2 } from 'lucide-react'

interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
}

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
  onDeleteCard?: (cardId: string) => void
  /** Choices for this card - used to show completion status */
  cardChoices?: Choice[]
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
  onDeleteCard,
  cardChoices = [],
}: OutlineNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showHighlight, setShowHighlight] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isOpen: false, x: 0, y: 0 })

  // Completion status
  const hasTitle = Boolean(card.title && card.title.trim())
  const hasContent = Boolean(card.content && card.content.trim())
  const hasImage = Boolean(card.imageUrl)
  const hasAudio = Boolean(card.audioUrl)
  const hasChoices = cardChoices.length > 0

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

  // Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu.isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu({ isOpen: false, x: 0, y: 0 })
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu({ isOpen: false, x: 0, y: 0 })
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu.isOpen])

  const handleClick = () => {
    onSelect(card.id)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    })
  }

  const handleDelete = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0 })
    if (onDeleteCard) {
      onDeleteCard(card.id)
    }
  }

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleExpand(card.id)
  }

  return (
    <>
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
        onContextMenu={handleContextMenu}
        data-testid={`outline-node-${card.id}`}
        className={cn(
          'group flex flex-col rounded cursor-pointer transition-all',
          'hover:bg-muted active:scale-[0.98]',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-muted/80',
          isSelected && 'bg-primary/10 border border-primary',
          !isSelected && 'border border-transparent',
          isDragOver && 'border-dashed border-primary bg-primary/5',
          showHighlight && 'command-target-highlight command-target-pop'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Main Row */}
        <div className="flex items-center gap-1 px-2 py-1.5">
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

        {/* Completion Indicators Row */}
        <div className="flex items-center gap-1 px-2 pb-1.5 ml-[26px]">
          {/* Title indicator */}
          <div
            className={cn(
              'w-3.5 h-3.5 rounded flex items-center justify-center',
              hasTitle
                ? 'bg-emerald-500/20 text-emerald-600'
                : 'bg-muted text-muted-foreground/40'
            )}
            title={`Title: ${hasTitle ? 'Done' : 'Missing'}`}
          >
            <Type className="w-2 h-2" />
          </div>
          {/* Content indicator */}
          <div
            className={cn(
              'w-3.5 h-3.5 rounded flex items-center justify-center',
              hasContent
                ? 'bg-emerald-500/20 text-emerald-600'
                : 'bg-muted text-muted-foreground/40'
            )}
            title={`Content: ${hasContent ? 'Done' : 'Missing'}`}
          >
            <FileText className="w-2 h-2" />
          </div>
          {/* Image indicator */}
          <div
            className={cn(
              'w-3.5 h-3.5 rounded flex items-center justify-center',
              hasImage
                ? 'bg-emerald-500/20 text-emerald-600'
                : 'bg-muted text-muted-foreground/40'
            )}
            title={`Image: ${hasImage ? 'Done' : 'Missing'}`}
          >
            <ImageIcon className="w-2 h-2" />
          </div>
          {/* Audio indicator */}
          <div
            className={cn(
              'w-3.5 h-3.5 rounded flex items-center justify-center',
              hasAudio
                ? 'bg-emerald-500/20 text-emerald-600'
                : 'bg-muted text-muted-foreground/40'
            )}
            title={`Audio: ${hasAudio ? 'Done' : 'Missing'}`}
          >
            <Volume2 className="w-2 h-2" />
          </div>
          {/* Choices indicator */}
          <div
            className={cn(
              'w-3.5 h-3.5 rounded flex items-center justify-center',
              hasChoices
                ? 'bg-emerald-500/20 text-emerald-600'
                : 'bg-muted text-muted-foreground/40'
            )}
            title={`Choices: ${hasChoices ? `${cardChoices.length} choice${cardChoices.length !== 1 ? 's' : ''}` : 'None'}`}
          >
            <GitBranch className="w-2 h-2" />
          </div>
        </div>
      </div>

      {/* Context Menu - positioned 50px higher */}
      {contextMenu.isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[120px] rounded-md border border-border shadow-lg py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y - 50,
            backgroundColor: 'hsl(var(--popover))',
          }}
          role="menu"
          aria-label="Card actions"
          data-testid={`outline-context-menu-${card.id}`}
        >
          <button
            onClick={handleDelete}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left',
              'hover:bg-destructive/10 text-destructive',
              'focus:outline-none focus:bg-destructive/10'
            )}
            role="menuitem"
            data-testid={`outline-delete-btn-${card.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Card
          </button>
        </div>
      )}
    </>
  )
}
