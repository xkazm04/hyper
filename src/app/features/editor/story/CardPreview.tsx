'use client'

import { useEditor } from '@/contexts/EditorContext'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import Image from 'next/image'

export default function CardPreview() {
  const { currentCard, storyStack, choices } = useEditor()

  if (!currentCard) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Card Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a card to see the preview
          </p>
        </div>
      </div>
    )
  }

  // Filter choices for the current card
  const cardChoices = choices.filter(choice => choice.storyCardId === currentCard.id)

  return (
    <div className="h-full overflow-auto p-4" data-testid="card-preview">
      <div className="max-w-2xl mx-auto">
        {/* Preview Header */}
        <div className="mb-4 pb-3 border-b border-border">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Live Preview
          </h2>
        </div>

        {/* Story content */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden border-2 border-border">
          {/* Image */}
          {currentCard.imageUrl && (
            <div className="relative w-full aspect-video bg-muted">
              <Image
                src={currentCard.imageUrl}
                alt={currentCard.title || 'Card image'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 512px"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {/* Title */}
            <h1 className="text-2xl font-bold text-foreground mb-4 text-center leading-tight">
              {currentCard.title || 'Untitled Card'}
            </h1>

            {/* Story text */}
            {currentCard.content && (
              <div className="prose prose-sm max-w-none mb-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-center">
                  {currentCard.content}
                </p>
              </div>
            )}

            {/* Choices */}
            {cardChoices.length > 0 ? (
              <div className="space-y-2 mt-6">
                {cardChoices.map((choice, index) => (
                  <Button
                    key={choice.id}
                    disabled
                    className="w-full py-4 text-sm font-semibold rounded-lg bg-primary text-primary-foreground opacity-80 cursor-default"
                    data-testid={`preview-choice-${index}`}
                  >
                    {choice.label}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-block px-4 py-2 bg-muted rounded-lg border border-border">
                  <p className="text-sm font-semibold text-foreground">The End</p>
                  <p className="text-xs text-muted-foreground mt-1">No choices configured</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Story info footer */}
        {storyStack && (
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <p className="font-medium">{storyStack.name}</p>
            {storyStack.description && (
              <p className="mt-1 opacity-70">{storyStack.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
