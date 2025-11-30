'use client'

import { User, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CharacterCard, Character } from '@/lib/types'

interface CharacterCardListProps {
  characterCards: CharacterCard[]
  characters: Character[]
  selectedCardId: string | null
  onSelect: (cardId: string) => void
  onEdit: (cardId: string) => void
  onDelete: (cardId: string) => void
  onCreateNew: () => void
}

export default function CharacterCardList({
  characterCards,
  characters,
  selectedCardId,
  onSelect,
  onEdit,
  onDelete,
  onCreateNew,
}: CharacterCardListProps) {
  // Build a map for quick character lookup
  const characterMap = new Map(characters.map(c => [c.id, c]))

  const getCharacterForCard = (card: CharacterCard): Character | undefined => {
    return characterMap.get(card.characterId)
  }

  return (
    <div className="flex flex-col h-full" data-testid="character-card-list">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Character Cards</span>
          <span className="text-xs text-muted-foreground">({characterCards.length})</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onCreateNew}
          title="Create Character Card"
          data-testid="create-character-card-trigger"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {characterCards.length === 0 ? (
          <div className="p-4 text-center">
            <User className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground mb-2">No character cards yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateNew}
              className="gap-1"
              data-testid="create-first-character-card-btn"
            >
              <Plus className="w-3 h-3" />
              Create First Card
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {characterCards.map(card => {
              const character = getCharacterForCard(card)
              const title = card.title || character?.name || 'Unknown Character'
              const imageUrl = card.showAvatar && character?.avatarUrl
                ? character.avatarUrl
                : character?.imageUrls[Math.min(card.imageIndex, (character?.imageUrls.length || 1) - 1)]

              return (
                <li
                  key={card.id}
                  className={`group flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedCardId === card.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => onSelect(card.id)}
                  data-testid={`character-card-item-${card.id}`}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded border border-border overflow-hidden bg-muted flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {character?.name || 'Missing character'}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`character-card-actions-${card.id}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(card.id)
                        }}
                        data-testid={`edit-character-card-${card.id}`}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(card.id)
                        }}
                        className="text-destructive"
                        data-testid={`delete-character-card-${card.id}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
