'use client'

import { useEditor } from '@/contexts/EditorContext'
import { Button } from '@/components/ui/button'
import { Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CharacterListProps {
  onAddCharacter: () => void
  onSwitchToCharacters?: () => void
}

export default function CharacterList({ onAddCharacter, onSwitchToCharacters }: CharacterListProps) {
  const { characters, currentCharacterId, setCurrentCharacterId } = useEditor()

  const handleSelectCharacter = (characterId: string) => {
    setCurrentCharacterId(characterId)
    // Switch to characters tab when selecting a character
    onSwitchToCharacters?.()
  }

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
          <div className="space-y-1">
            {characters
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((character, index) => (
                <button
                  key={character.id}
                  onClick={() => handleSelectCharacter(character.id)}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded border transition-all touch-manipulation',
                    'hover:bg-muted active:scale-[0.98]',
                    currentCharacterId === character.id
                      ? 'bg-primary/10 border-primary'
                      : 'border-transparent hover:border-border'
                  )}
                  data-testid={`character-item-${character.id}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="shrink-0 w-5 h-5 rounded bg-muted flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">
                        {character.name || 'Unnamed Character'}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
