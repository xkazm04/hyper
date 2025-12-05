'use client'

/**
 * OutlineSidebar Component
 *
 * Displays the selected card with its predecessor and successors in a focused view.
 * When no card is selected, shows a prompt to open Story Graph.
 * Right-click context menu for card deletion.
 *
 * Features:
 * - Visual reactivity on card hover and click
 * - Switches to 'cards' tab when clicking a card
 * - Halloween effect: spider-web-corner decoration
 */

import { useMemo, useCallback, useState, useRef, useEffect } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { cn } from '@/lib/utils'
import { OutlineActions } from './components'
import { OutlineCard } from './OutlineCard'
import { Network, ChevronUp, ChevronDown, MousePointerClick, Trash2 } from 'lucide-react'
import { useToast } from '@/lib/context/ToastContext'
import { useSidebarNavigationStore, selectSwitchToCards } from '../lib/sidebarNavigationStore'

interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  cardId: string | null
}

interface OutlineSidebarProps {
  onAddCard: () => void
  onDeleteCard?: (cardId: string) => Promise<void>
  onOpenStoryGraph?: () => void
}

export default function OutlineSidebar({
  onAddCard,
  onOpenStoryGraph,
}: OutlineSidebarProps) {
  const { storyCards, storyStack, currentCardId, setCurrentCardId, choices, deleteCard } = useEditor()
  const { success, error: showError } = useToast()
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const switchToCards = useSidebarNavigationStore(selectSwitchToCards)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    cardId: null,
  })

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, isOpen: false }))
      }
    }
    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [contextMenu.isOpen])

  // Check if a card can be deleted (no predecessors pointing to it)
  const canDeleteCard = useCallback((cardId: string) => {
    const predecessorCount = choices.filter(c => c.targetCardId === cardId).length
    return predecessorCount === 0
  }, [choices])

  // Get predecessor count for a card
  const getPredecessorCount = useCallback((cardId: string) => {
    return choices.filter(c => c.targetCardId === cardId).length
  }, [choices])

  // Handle right-click on card
  const handleContextMenu = useCallback((e: React.MouseEvent, cardId: string) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      cardId,
    })
  }, [])

  // Handle delete card (immediate, no confirmation)
  const handleDeleteCard = useCallback(async (cardId: string) => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))

    if (!canDeleteCard(cardId)) return

    // Optimistically remove from UI
    deleteCard(cardId)

    // Delete from database
    if (storyStack?.id) {
      try {
        const response = await fetch(`/api/stories/${storyStack.id}/cards/${cardId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete card')
        success('Card deleted')
      } catch (err) {
        showError('Failed to delete card')
        console.error('Failed to delete card:', err)
      }
    }
  }, [canDeleteCard, deleteCard, storyStack?.id, success, showError])

  // Find the current card
  const currentCard = useMemo(() => {
    return storyCards.find(c => c.id === currentCardId) || null
  }, [storyCards, currentCardId])

  // Find predecessor cards (cards that have choices pointing to current card)
  const predecessors = useMemo(() => {
    if (!currentCardId) return []
    const predecessorChoices = choices.filter(c => c.targetCardId === currentCardId)
    const predecessorIds = [...new Set(predecessorChoices.map(c => c.storyCardId))]
    return storyCards.filter(card => predecessorIds.includes(card.id))
  }, [choices, storyCards, currentCardId])

  // Find successor cards (cards that current card's choices point to)
  const successors = useMemo(() => {
    if (!currentCardId) return []
    const successorChoices = choices.filter(c => c.storyCardId === currentCardId)
    const successorIds = [...new Set(successorChoices.map(c => c.targetCardId))]
    return storyCards.filter(card => successorIds.includes(card.id))
  }, [choices, storyCards, currentCardId])

  // Calculate the level (depth) of the current card from the start
  const currentLevel = useMemo(() => {
    if (!currentCardId || storyCards.length === 0) return null

    const sortedCards = [...storyCards].sort((a, b) => a.orderIndex - b.orderIndex)
    const firstCardId = sortedCards[0]?.id
    if (!firstCardId) return null

    if (currentCardId === firstCardId) return 1

    // BFS to find shortest path from first card to current card
    const visited = new Set<string>()
    const queue: Array<{ cardId: string; level: number }> = [{ cardId: firstCardId, level: 1 }]
    visited.add(firstCardId)

    while (queue.length > 0) {
      const { cardId, level } = queue.shift()!
      const cardChoices = choices.filter(c => c.storyCardId === cardId)
      for (const choice of cardChoices) {
        if (choice.targetCardId === currentCardId) {
          return level + 1
        }
        if (!visited.has(choice.targetCardId)) {
          visited.add(choice.targetCardId)
          queue.push({ cardId: choice.targetCardId, level: level + 1 })
        }
      }
    }

    return null // Orphan
  }, [currentCardId, storyCards, choices])

  // Handle card selection - also switches to cards tab
  const handleSelectCard = useCallback((cardId: string) => {
    setCurrentCardId(cardId)
    switchToCards()
  }, [setCurrentCardId, switchToCards])

  // Empty state - no cards exist
  if (storyCards.length === 0) {
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
          cardCount={0}
          onAddCard={onAddCard}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <MousePointerClick className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-xs text-muted-foreground">
            No cards yet. Add your first card to get started.
          </p>
        </div>
      </div>
    )
  }

  // No card selected state - prompt to open Story Graph
  if (!currentCard) {
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
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Network className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-xs text-muted-foreground mb-2">
            Select a card to see its connections
          </p>
          {onOpenStoryGraph && (
            <button
              onClick={onOpenStoryGraph}
              className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
            >
              <Network className="w-5 h-5" />
              Open Story Graph
            </button>
          )}
        </div>
      </div>
    )
  }

  // Main view - show selected card with predecessors and successors
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

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {/* Predecessors Section */}
          {predecessors.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                <ChevronUp className="w-4 h-4" />
                <span>From ({predecessors.length})</span>
              </div>
              <div className="space-y-1.5">
                {predecessors.map(card => (
                  <OutlineCard
                    key={card.id}
                    card={card}
                    isSelected={false}
                    choices={choices}
                    onClick={handleSelectCard}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Connection line from predecessors */}
          {predecessors.length > 0 && (
            <div className="flex justify-center py-1">
              <div className="w-0.5 h-4 bg-border rounded-full" />
            </div>
          )}

          {/* Current Card - Highlighted */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-2 text-[10px] uppercase tracking-wider text-primary font-semibold">
              <span>Selected</span>
              {currentLevel !== null ? (
                <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[9px] font-bold">
                  Level {currentLevel}
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded text-[9px] font-bold">
                  Orphan
                </span>
              )}
            </div>
            <OutlineCard
              card={currentCard}
              isSelected={true}
              choices={choices}
              onClick={handleSelectCard}
              onContextMenu={handleContextMenu}
            />
          </div>

          {/* Connection line to successors */}
          {successors.length > 0 && (
            <div className="flex justify-center py-1">
              <div className="w-0.5 h-4 bg-border rounded-full" />
            </div>
          )}

          {/* Successors Section */}
          {successors.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 px-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                <ChevronDown className="w-4 h-4" />
                <span>To ({successors.length})</span>
              </div>
              <div className="space-y-1.5">
                {successors.map(card => (
                  <OutlineCard
                    key={card.id}
                    card={card}
                    isSelected={false}
                    choices={choices}
                    onClick={handleSelectCard}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No connections state */}
          {predecessors.length === 0 && successors.length === 0 && (
            <div className="mt-4 text-center py-4">
              <p className="text-xs text-muted-foreground">
                No connections yet
              </p>
              {onOpenStoryGraph && (
                <button
                  onClick={onOpenStoryGraph}
                  className="mt-2 text-xs text-primary hover:underline font-medium flex items-center gap-1 mx-auto"
                >
                  <Network className="w-5 h-5" />
                  Open Story Graph to connect
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context Menu - positioned 50px higher */}
      {contextMenu.isOpen && contextMenu.cardId && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] bg-popover border border-border rounded-md shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-100"
          style={{
            left: contextMenu.x,
            top: contextMenu.y - 50,
          }}
        >
          {canDeleteCard(contextMenu.cardId) ? (
            <button
              onClick={() => handleDeleteCard(contextMenu.cardId!)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Card
            </button>
          ) : (
            <div className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground/50 cursor-not-allowed">
              <Trash2 className="w-3.5 h-3.5" />
              <span className="line-through">
                Delete Card ({getPredecessorCount(contextMenu.cardId)} link{getPredecessorCount(contextMenu.cardId) > 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
