'use client'

import { useCallback } from 'react'
import { User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Character } from '@/lib/types'

interface CharacterCardsEmptyViewProps {
  characters: Character[]
  selectedCharacterId: string | null
  onCharacterSelect: (characterId: string) => void
}

/**
 * Displays all characters in a 4x4 grid with avatars when no character is selected.
 * Clicking a character avatar selects it, same as selecting from CharacterList.
 */
export function CharacterCardsEmptyView({
  characters,
  selectedCharacterId,
  onCharacterSelect,
}: CharacterCardsEmptyViewProps) {
  const handleSelect = useCallback((characterId: string) => {
    onCharacterSelect(characterId)
  }, [onCharacterSelect])

  if (characters.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-muted p-6" data-testid="character-cards-empty-view">
        <Users className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-base font-semibold text-foreground mb-1">No Characters</h3>
        <p className="text-sm text-muted-foreground text-center">
          Add characters to your story to see them here
        </p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-muted" data-testid="character-cards-empty-view">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="font-bold text-sm uppercase tracking-wide text-foreground">Characters</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Select a character to edit
        </p>
      </div>

      {/* Character Grid - 4x4 layout */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-4 gap-3">
          {characters
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((character) => (
              <button
                key={character.id}
                onClick={() => handleSelect(character.id)}
                className={cn(
                  'aspect-square rounded-lg border-2 transition-all',
                  'flex flex-col items-center justify-center gap-1 p-2',
                  'hover:border-primary hover:bg-primary/5',
                  'focus:outline-none focus:ring-2 focus:ring-primary/50',
                  selectedCharacterId === character.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card'
                )}
                data-testid={`character-avatar-${character.id}`}
                title={character.name || 'Unnamed Character'}
              >
                {/* Avatar */}
                <div className="w-full aspect-square rounded-md overflow-hidden bg-muted border border-border">
                  {character.avatarUrl ? (
                    <img
                      src={character.avatarUrl}
                      alt={character.name || 'Character avatar'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-1/2 h-1/2 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
                  {character.name || 'Unnamed'}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )
}
