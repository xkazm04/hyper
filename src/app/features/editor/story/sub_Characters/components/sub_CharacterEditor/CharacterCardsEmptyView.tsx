'use client'

import { useState, useCallback } from 'react'
import { User } from 'lucide-react'
import CharacterCardList from '@/app/features/editor/story/sub_CharacterCards/components/CharacterCardList'
import CreateCharacterCardDialog from '@/app/features/editor/story/sub_CharacterCards/components/CreateCharacterCardDialog'
import type { Character, CharacterCard, CreateCharacterCardInput } from '@/lib/types'

interface CharacterCardsEmptyViewProps {
  storyStackId: string
  characters: Character[]
  characterCards: CharacterCard[]
  onCardSelect: (cardId: string) => void
  onCharacterSelect: (characterId: string) => void
  onCreateCard: (input: CreateCharacterCardInput) => Promise<void>
  onDeleteCard: (cardId: string) => Promise<void>
}

/**
 * Displays the character card list when no character is selected.
 * Allows users to browse, create, and manage character cards from the empty state.
 */
export function CharacterCardsEmptyView({
  storyStackId,
  characters,
  characterCards,
  onCardSelect,
  onCharacterSelect,
  onCreateCard,
  onDeleteCard,
}: CharacterCardsEmptyViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  const handleSelect = useCallback((cardId: string) => {
    setSelectedCardId(cardId)
    onCardSelect(cardId)

    // Also select the associated character
    const card = characterCards.find(c => c.id === cardId)
    if (card) {
      onCharacterSelect(card.characterId)
    }
  }, [characterCards, onCardSelect, onCharacterSelect])

  const handleEdit = useCallback((cardId: string) => {
    // Selecting the card will navigate to the character
    handleSelect(cardId)
  }, [handleSelect])

  const handleDelete = useCallback(async (cardId: string) => {
    await onDeleteCard(cardId)
    if (selectedCardId === cardId) {
      setSelectedCardId(null)
    }
  }, [onDeleteCard, selectedCardId])

  const handleCreate = useCallback(async (input: CreateCharacterCardInput) => {
    await onCreateCard(input)
  }, [onCreateCard])

  return (
    <div className="h-full flex flex-col bg-muted" data-testid="character-cards-empty-view">
      {/* Character Card List */}
      <div className="flex-1 overflow-hidden border-b border-border">
        <CharacterCardList
          characterCards={characterCards}
          characters={characters}
          selectedCardId={selectedCardId}
          onSelect={handleSelect}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreateNew={() => setIsDialogOpen(true)}
        />
      </div>

      {/* Empty State Message */}
      <div className="flex-shrink-0 p-6 text-center bg-muted">
        <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">No Character Selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a character card above or choose a character from the list to start editing
        </p>
      </div>

      {/* Create Character Card Dialog */}
      <CreateCharacterCardDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        characters={characters}
        storyStackId={storyStackId}
        onCreate={handleCreate}
      />
    </div>
  )
}
