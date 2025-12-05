'use client'

/**
 * CharacterList Component
 *
 * Displays the list of characters in the story with:
 * - Visual reactivity on hover and click
 * - Right-click context menu for deletion
 * - Switches to 'characters' tab when clicking a character
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { Button } from '@/components/ui/button'
import { Plus, User, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/lib/context/ToastContext'
import { motion } from 'framer-motion'
import { useSidebarNavigationStore, selectSwitchToCharacters } from '../lib/sidebarNavigationStore'
import { Character } from '@/lib/types'

interface ContextMenuState {
  isOpen: boolean
  x: number
  y: number
  characterId: string | null
}

interface CharacterListProps {
  onAddCharacter: () => void
  onSwitchToCharacters?: () => void
}

export default function CharacterList({ onAddCharacter }: CharacterListProps) {
  const { characters, currentCharacterId, setCurrentCharacterId, storyStack, deleteCharacter } = useEditor()
  const { success, error: showError } = useToast()
  const switchToCharacters = useSidebarNavigationStore(selectSwitchToCharacters)
  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    characterId: null,
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

  // Handle right-click on character
  const handleContextMenu = useCallback((e: React.MouseEvent, characterId: string) => {
    e.preventDefault()
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      characterId,
    })
  }, [])

  // Handle delete character
  const handleDeleteCharacter = useCallback(async (characterId: string) => {
    setContextMenu(prev => ({ ...prev, isOpen: false }))

    // Optimistically remove from UI
    deleteCharacter(characterId)

    // Delete from database
    if (storyStack?.id) {
      try {
        const response = await fetch(`/api/stories/${storyStack.id}/characters/${characterId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to delete character')
        success('Character deleted')
      } catch (err) {
        showError('Failed to delete character')
        console.error('Failed to delete character:', err)
      }
    }
  }, [deleteCharacter, storyStack?.id, success, showError])

  // Handle character selection - also switches to characters tab
  const handleSelectCharacter = useCallback((characterId: string) => {
    setCurrentCharacterId(characterId)
    switchToCharacters()
  }, [setCurrentCharacterId, switchToCharacters])

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b-2 border-border">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="font-bold text-xs sm:text-sm uppercase tracking-wide">Characters</h3>
          <Button
            size="sm"
            onClick={onAddCharacter}
            className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))] hover:-translate-x-px hover:-translate-y-px transition-all touch-manipulation"
            data-testid="add-character-btn"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {characters.length} {characters.length === 1 ? 'character' : 'characters'}
        </p>
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto p-2">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <User className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/30 mb-3" />
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">No characters yet</p>
            <Button
              size="sm"
              onClick={onAddCharacter}
              className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] touch-manipulation"
              data-testid="add-first-character-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Character
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {[...characters]
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((character, index) => (
                <CharacterItem
                  key={character.id}
                  character={character}
                  index={index}
                  isSelected={currentCharacterId === character.id}
                  onClick={handleSelectCharacter}
                  onContextMenu={handleContextMenu}
                />
              ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && contextMenu.characterId && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 min-w-[160px] bg-popover border border-border rounded-md shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-100"
          style={{
            left: contextMenu.x,
            top: contextMenu.y - 50,
          }}
        >
          <button
            onClick={() => handleDeleteCharacter(contextMenu.characterId!)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Character
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Character Item Sub-component
// ============================================================================

interface CharacterItemProps {
  character: Character
  index: number
  isSelected: boolean
  onClick: (characterId: string) => void
  onContextMenu: (e: React.MouseEvent, characterId: string) => void
}

function CharacterItem({
  character,
  index,
  isSelected,
  onClick,
  onContextMenu,
}: CharacterItemProps) {
  const [isPressed, setIsPressed] = useState(false)

  const handleClick = useCallback(() => {
    setIsPressed(true)
    onClick(character.id)
    setTimeout(() => setIsPressed(false), 150)
  }, [character.id, onClick])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    onContextMenu(e, character.id)
  }, [character.id, onContextMenu])

  // Get completion indicators
  const hasName = Boolean(character.name && character.name.trim())
  const hasAppearance = Boolean(character.appearance && character.appearance.trim())
  const hasAvatar = Boolean(character.avatarUrl)

  return (
    <motion.button
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      animate={{
        scale: isPressed ? 0.97 : 1,
      }}
      transition={{ duration: 0.1, ease: 'easeOut' }}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150',
        'border-2',
        'cursor-pointer',
        // Selected state
        isSelected
          ? 'bg-primary/15 border-primary shadow-sm'
          : 'bg-card border-border/50',
        // Hover state (non-selected)
        !isSelected && 'hover:bg-muted/80 hover:border-muted-foreground/40 hover:shadow-sm',
        // Active/pressed state
        'active:scale-[0.98] active:shadow-none'
      )}
      data-testid={`character-item-${character.id}`}
    >
      <div className="flex items-center gap-2.5">
        {/* Avatar or Index */}
        {hasAvatar ? (
          <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-muted">
            <img
              src={character.avatarUrl!}
              alt={character.name || 'Character'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={cn(
            'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
            isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            {index + 1}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Name */}
          <div className={cn(
            'font-medium text-xs truncate',
            isSelected ? 'text-primary' : 'text-foreground'
          )}>
            {character.name || 'Unnamed Character'}
          </div>

          {/* Completion indicators */}
          <div className="flex items-center gap-1 mt-1">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                hasName ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              )}
              title={`Name: ${hasName ? 'Done' : 'Missing'}`}
            />
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                hasAppearance ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              )}
              title={`Appearance: ${hasAppearance ? 'Done' : 'Missing'}`}
            />
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                hasAvatar ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              )}
              title={`Avatar: ${hasAvatar ? 'Done' : 'Missing'}`}
            />
          </div>
        </div>
      </div>
    </motion.button>
  )
}
