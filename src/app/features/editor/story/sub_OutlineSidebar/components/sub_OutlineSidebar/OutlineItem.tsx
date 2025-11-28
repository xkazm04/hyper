'use client'

/**
 * OutlineItem Component
 * 
 * Renders a single item in the outline tree with drag-and-drop support.
 * Wraps OutlineNode with additional tree-specific functionality.
 */

import { KeyboardEvent } from 'react'
import { StoryCard } from '@/lib/types'
import OutlineNode from '../OutlineNode'

interface OutlineItemProps {
  card: StoryCard
  index: number
  isSelected: boolean
  isExpanded: boolean
  hasChildren: boolean
  focusedIndex: number
  dragOverIndex: number | null
  draggedIndex: number | null
  onSelect: (cardId: string) => void
  onToggleExpand: (cardId: string) => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDrop: (e: React.DragEvent, dropIndex: number) => void
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, cardId: string, index: number) => void
}

export function OutlineItem({
  card,
  index,
  isSelected,
  isExpanded,
  hasChildren,
  focusedIndex,
  dragOverIndex,
  draggedIndex,
  onSelect,
  onToggleExpand,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onKeyDown,
}: OutlineItemProps) {
  return (
    <OutlineNode
      card={card}
      index={index}
      isSelected={isSelected}
      isExpanded={isExpanded}
      hasChildren={hasChildren}
      depth={0}
      onSelect={onSelect}
      onToggleExpand={onToggleExpand}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      isDragOver={dragOverIndex === index && draggedIndex !== index}
      tabIndex={focusedIndex === index ? 0 : -1}
      onKeyDown={onKeyDown}
    />
  )
}
