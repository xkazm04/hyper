'use client'

/**
 * OutlineSidebar Component
 *
 * Displays a hierarchical outline of story cards with drag-and-drop reordering.
 *
 * Halloween Effect: spider-web-corner decoration
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { cn } from '@/lib/utils'
import { StoryCard } from '@/lib/types'
import { OutlineActions, OutlineTree } from './components/sub_OutlineSidebar'
import { useCommandRipple } from '../sub_CommandPalette/lib/CommandRippleContext'

interface OutlineSidebarProps {
  onAddCard: () => void
}

export default function OutlineSidebar({
  onAddCard,
}: OutlineSidebarProps) {
  const { storyCards, storyStack, currentCardId, setCurrentCardId, setStoryCards, choices } = useEditor()
  const { highlightedTargetId } = useCommandRipple()
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

  const handleDrop = useCallback(async (e: React.DragEvent, dropIndex: number) => {
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

    // Persist reorder to database
    if (storyStack?.id) {
      try {
        await fetch(`/api/stories/${storyStack.id}/cards/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardOrders: updatedCards.map(card => ({ id: card.id, orderIndex: card.orderIndex }))
          })
        })
      } catch (error) {
        console.error('Failed to persist card reorder:', error)
      }
    }
  }, [sortedCards, setStoryCards, handleDragEnd, storyStack?.id])

  useEffect(() => {
    if (currentCardId) {
      const index = sortedCards.findIndex(c => c.id === currentCardId)
      if (index !== -1 && index !== focusedIndex) setFocusedIndex(index)
    }
  }, [currentCardId, sortedCards, focusedIndex])

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-card',
        'halloween-web-corner',
        'halloween-ethereal-glow',
        'halloween-cobweb'
      )}
      data-testid="outline-sidebar"
    >
      <OutlineActions
        cardCount={storyCards.length}
        onAddCard={onAddCard}
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
        highlightedCardId={highlightedTargetId}
      />
    </div>
  )
}
