'use client'

import { User, ImageIcon } from 'lucide-react'
import { Character } from '@/lib/types'

interface CharacterHeaderProps {
  character: Character
}

export function CharacterHeader({ character }: CharacterHeaderProps) {
  return (
    <header
      className="flex-shrink-0 p-3 sm:p-4 border-b border-border bg-card halloween-spider-web-corner"
      data-testid="character-editor-header"
    >
      <div className="max-w-3xl mx-auto flex items-center gap-3">
        {/* Avatar thumbnail */}
        <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-border bg-muted flex-shrink-0">
          {character.avatarUrl ? (
            <img
              src={character.avatarUrl}
              alt={`${character.name} avatar`}
              className="w-full h-full object-cover"
            />
          ) : character.imageUrls && character.imageUrls.length > 0 ? (
            <img
              src={character.imageUrls[0]}
              alt={`${character.name} reference image`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground/50" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Character info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">
            {character.name || 'Unnamed Character'}
          </h2>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" aria-hidden="true" />
              <span>{character.imageUrls?.length || 0}/10 images</span>
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" aria-hidden="true" />
              <span>{character.avatarUrl ? 'Avatar set' : 'No avatar'}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

interface EmptyCharacterStateProps {}

export function EmptyCharacterState({}: EmptyCharacterStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-muted">
      <div className="text-center">
        <User className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Character Selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a character from the list or create a new one to start editing
        </p>
      </div>
    </div>
  )
}
