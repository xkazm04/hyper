'use client'

/**
 * OutlineSidebar Component
 * 
 * Displays a hierarchical outline of story cards with drag-and-drop reordering.
 * 
 * Halloween Effect: spider-web-corner decoration
 */

import { useState, useCallback, useRef, KeyboardEvent, useEffect } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { cn } from '@/lib/utils'
import { StoryCard } from '@/lib/types'
import { OutlineActions, OutlineTree } from './components/sub_OutlineSidebar'

interface OutlineSidebarProps {
  onAddCard: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function OutlineSidebar({
  onAddCard,
  isCollapsed = false,
  onToggleCollapse,
}: OutlineSidebarProps) {
  const { storyCards, currentCardId, setCurrentCardId, setStoryCards, choices } = useEditor()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [focusedIndex, setFocusedIndex] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedCards = [...storyCards].sort((a, b) => a.orderIndex - b.orderIndex)

  const getChildCards = useCallback((cardId: string): StoryCard[] => {
    const cardChoices = choices.filter(c => c.storyCardId === cardId)
    const targetIds = cardChoices.map(c => c.targetCardId)
    return sortedCards.filter(card => targetIds.includes(card.id))
  }, [choices, sortedCards])

  const handleSelect = useCallback((cardId: string) => {
    setCurrentCardId(cardId)
    const index = sortedCards.findIndex(c => c.id === cardId)
    if (index !== -1) setFocusedIndex(index)
  }, [setCurrentCardId, sortedCards])

  const handleToggleExpand = useCallback((cardId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }, [])


  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (dragIndex === dropIndex || isNaN(dragIndex)) {
      handleDragEnd()
      return
    }
    const reorderedCards = [...sortedCards]
    const [draggedCard] = reorderedCards.splice(dragIndex, 1)
    reorderedCards.splice(dropIndex, 0, draggedCard)
    const updatedCards = reorderedCards.map((card, index) => ({ ...card, orderIndex: index }))
    setStoryCards(updatedCards)
    handleDragEnd()
  }, [sortedCards, setStoryCards, handleDragEnd])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, cardId: string, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (index < sortedCards.length - 1) {
          setFocusedIndex(index + 1)
          setCurrentCardId(sortedCards[index + 1].id)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (index > 0) {
          setFocusedIndex(index - 1)
          setCurrentCardId(sortedCards[index - 1].id)
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (!expandedNodes.has(cardId) && getChildCards(cardId).length > 0) handleToggleExpand(cardId)
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (expandedNodes.has(cardId)) handleToggleExpand(cardId)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleSelect(cardId)
        break
      case 'Home':
        e.preventDefault()
        if (sortedCards.length > 0) {
          setFocusedIndex(0)
          setCurrentCardId(sortedCards[0].id)
        }
        break
      case 'End':
        e.preventDefault()
        if (sortedCards.length > 0) {
          setFocusedIndex(sortedCards.length - 1)
          setCurrentCardId(sortedCards[sortedCards.length - 1].id)
        }
        break
    }
  }, [sortedCards, setCurrentCardId, expandedNodes, handleToggleExpand, getChildCards, handleSelect])

  useEffect(() => {
    if (currentCardId) {
      const index = sortedCards.findIndex(c => c.id === currentCardId)
      if (index !== -1 && index !== focusedIndex) setFocusedIndex(index)
    }
  }, [currentCardId, sortedCards, focusedIndex])


  if (isCollapsed) {
    return (
      <div
        className={cn(
          'h-full flex flex-col bg-card border-r-2 border-border w-12',
          'halloween-web-corner',
          'halloween-ethereal-glow',
          'halloween-cobweb'
        )}
        data-testid="outline-sidebar-collapsed"
      >
        <OutlineActions
          cardCount={storyCards.length}
          isCollapsed={true}
          onAddCard={onAddCard}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-card lg:border-r-2 border-border',
        'halloween-web-corner',
        'halloween-ethereal-glow',
        'halloween-cobweb'
      )}
      data-testid="outline-sidebar"
    >
      <OutlineActions
        cardCount={storyCards.length}
        isCollapsed={false}
        onAddCard={onAddCard}
        onToggleCollapse={onToggleCollapse}
      />

      <OutlineTree
        ref={containerRef}
        sortedCards={sortedCards}
        currentCardId={currentCardId}
        expandedNodes={expandedNodes}
        focusedIndex={focusedIndex}
        dragOverIndex={dragOverIndex}
        draggedIndex={draggedIndex}
        getChildCards={getChildCards}
        onAddCard={onAddCard}
        onSelect={handleSelect}
        onToggleExpand={handleToggleExpand}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
