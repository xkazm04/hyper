'use client'

import { useMemo } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { FileText } from 'lucide-react'
import { CardDisplay, CardDisplayTheme } from '@/components/player/sub_StoryPlayer/CardDisplay'
import { extractPreviewTheme, themeToCSS } from '@/lib/utils/previewTheme'

/**
 * CardPreview - Live preview of the current story card
 *
 * Uses the shared CardDisplay component with 'preview' variant
 * for consistent sizing, spacing, and UI with the player.
 */
export default function CardPreview() {
  const { currentCard, storyStack, choices } = useEditor()

  // Extract preview theme from stack's art style
  const previewTheme = useMemo(() => {
    if (storyStack?.previewTheme) {
      return storyStack.previewTheme
    }
    // Fall back to art style extraction or default
    return extractPreviewTheme(storyStack?.artStyleId || null)
  }, [storyStack?.previewTheme, storyStack?.artStyleId])

  // Convert theme to CSS variables
  const themeStyles = useMemo(() => themeToCSS(previewTheme), [previewTheme])

  // Convert to CardDisplay theme format
  const cardTheme: CardDisplayTheme = useMemo(() => ({
    borderRadius: themeStyles['--preview-border-radius'],
    borderWidth: themeStyles['--preview-border-width'],
    borderStyle: themeStyles['--preview-border-style'],
    shadowStyle: previewTheme.shadowStyle,
    fontFamily: themeStyles['--preview-font-family'],
    titleFont: themeStyles['--preview-title-font'],
    overlayOpacity: previewTheme.overlayOpacity,
    choiceBg: themeStyles['--preview-choice-bg'],
    choiceText: themeStyles['--preview-choice-text'],
    choiceBorder: themeStyles['--preview-choice-border'],
    messageBg: themeStyles['--preview-message-bg'],
    messageText: themeStyles['--preview-message-text'],
    messageBorder: themeStyles['--preview-message-border'],
    accent: themeStyles['--preview-accent'],
  }), [themeStyles, previewTheme.shadowStyle, previewTheme.overlayOpacity])

  if (!currentCard) {
    return (
      <div className="h-full flex items-center justify-center" data-testid="card-preview-empty">
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

  // Filter choices for the current card and sort by orderIndex
  const cardChoices = choices
    .filter(choice => choice.storyCardId === currentCard.id)
    .sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="h-full overflow-auto p-4" data-testid="card-preview">
      <div className="max-w-sm mx-auto">
        {/* Preview Header - with card title */}
        <div className="mb-3 pb-2 border-b-2 border-border flex items-center justify-between gap-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest shrink-0">
            Live Preview
          </h2>
          <h3
            className="text-sm font-semibold text-foreground truncate"
            style={{ fontFamily: themeStyles['--preview-title-font'] }}
            title={currentCard.title || 'Untitled Card'}
          >
            {currentCard.title || 'Untitled Card'}
          </h3>
        </div>

        {/* Card Display - using shared component */}
        <CardDisplay
          card={currentCard}
          choices={cardChoices}
          theme={cardTheme}
          variant="preview"
          disabled
        />

        {/* Story info footer */}
        {storyStack && (
          <div className="mt-3 text-center text-xs text-muted-foreground" data-testid="card-preview-footer">
            <p className="font-semibold">{storyStack.name}</p>
            {storyStack.description && (
              <p className="mt-0.5 opacity-70 line-clamp-1">{storyStack.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
