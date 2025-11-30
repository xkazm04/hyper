'use client'

import { useMemo } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { FileText, BookOpen, User, Cpu } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { extractPreviewTheme, themeToCSS } from '@/lib/utils/previewTheme'

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

  // Build 2x2 grid - fill from bottom-right to top-left
  const getGridChoices = () => {
    const grid: (typeof cardChoices[0] | null)[] = [null, null, null, null]
    const count = cardChoices.length
    
    if (count === 0) return grid
    if (count === 1) {
      grid[3] = cardChoices[0]
    } else if (count === 2) {
      grid[2] = cardChoices[0]
      grid[3] = cardChoices[1]
    } else if (count === 3) {
      grid[1] = cardChoices[0]
      grid[2] = cardChoices[1]
      grid[3] = cardChoices[2]
    } else {
      grid[0] = cardChoices[0]
      grid[1] = cardChoices[1]
      grid[2] = cardChoices[2]
      grid[3] = cardChoices[3]
    }
    return grid
  }

  const gridChoices = getGridChoices()

  // Get speaker icon based on type
  const getSpeakerIcon = () => {
    switch (currentCard.speakerType) {
      case 'narrator':
        return <BookOpen className="w-3.5 h-3.5" />
      case 'system':
        return <Cpu className="w-3.5 h-3.5" />
      case 'character':
      default:
        return <User className="w-3.5 h-3.5" />
    }
  }

  // Get shadow style class
  const getShadowClass = () => {
    switch (previewTheme.shadowStyle) {
      case 'none':
        return ''
      case 'soft':
        return 'shadow-lg'
      case 'glow':
        return 'shadow-lg shadow-[var(--preview-accent)]/30'
      case 'hard':
      default:
        return 'shadow-[6px_6px_0px_0px_hsl(var(--border))]'
    }
  }

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

        {/* Card Frame - 1:1 ratio with theme styling */}
        <div
          className={cn(
            "relative bg-card overflow-hidden aspect-square",
            getShadowClass()
          )}
          style={{
            borderRadius: themeStyles['--preview-border-radius'],
            borderWidth: themeStyles['--preview-border-width'],
            borderStyle: themeStyles['--preview-border-style'] as any,
            borderColor: 'hsl(var(--border))',
            ...themeStyles as any,
          }}
          data-story-card
          data-testid="story-card-preview"
        >
          {/* Card Image - top portion */}
          <div 
            className="relative w-full h-[55%] bg-muted overflow-hidden"
            style={{
              borderBottomWidth: themeStyles['--preview-border-width'],
              borderBottomStyle: themeStyles['--preview-border-style'] as any,
              borderBottomColor: 'hsl(var(--border))',
            }}
          >
            {currentCard.imageUrl ? (
              <>
                <Image
                  src={currentCard.imageUrl}
                  alt={currentCard.title || 'Card image'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
                {/* Overlay for message readability */}
                {currentCard.message && (
                  <div 
                    className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"
                    style={{ opacity: previewTheme.overlayOpacity }}
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No image</p>
                </div>
              </div>
            )}
            
            {/* Message bubble overlay - positioned at bottom of image */}
            {currentCard.message && (
              <div className="absolute bottom-2 left-2 right-2">
                <div 
                  className="p-2.5"
                  style={{
                    backgroundColor: themeStyles['--preview-message-bg'],
                    color: themeStyles['--preview-message-text'],
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: themeStyles['--preview-message-border'],
                    borderRadius: themeStyles['--preview-border-radius'],
                    boxShadow: previewTheme.shadowStyle === 'hard' 
                      ? `2px 2px 0px 0px ${themeStyles['--preview-message-border']}`
                      : previewTheme.shadowStyle === 'glow'
                        ? `0 0 10px ${themeStyles['--preview-accent']}40`
                        : 'none',
                    fontFamily: themeStyles['--preview-font-family'],
                  }}
                  data-testid="card-preview-message"
                >
                  {/* Speaker label */}
                  {currentCard.speaker && (
                    <div 
                      className="flex items-center gap-1.5 mb-1 text-xs font-bold opacity-70"
                    >
                      {getSpeakerIcon()}
                      <span>{currentCard.speaker}</span>
                    </div>
                  )}
                  <p 
                    className={cn(
                      "text-sm leading-snug",
                      currentCard.speakerType === 'narrator' && 'italic',
                      currentCard.speakerType === 'system' && 'font-mono text-xs'
                    )}
                  >
                    {currentCard.message}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom section - choices */}
          <div className="h-[45%] p-3 flex flex-col">
            {/* 2x2 Choices Grid */}
            {cardChoices.length > 0 ? (
              <div className="flex-1 grid grid-cols-2 gap-2" data-testid="card-preview-choices">
                {gridChoices.map((choice, index) => (
                  <div
                    key={choice?.id ?? `empty-${index}`}
                    className={cn(
                      "transition-all",
                      choice ? "cursor-pointer" : "bg-transparent"
                    )}
                    style={choice ? {
                      backgroundColor: themeStyles['--preview-choice-bg'],
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderColor: themeStyles['--preview-choice-border'],
                      borderRadius: themeStyles['--preview-border-radius'],
                      boxShadow: previewTheme.shadowStyle === 'hard' 
                        ? `2px 2px 0px 0px ${themeStyles['--preview-choice-border']}`
                        : 'none',
                    } : undefined}
                  >
                    {choice && (
                      <button
                        disabled
                        className="w-full h-full px-2 py-1.5 text-xs font-semibold text-center flex items-center justify-center leading-tight"
                        style={{
                          color: themeStyles['--preview-choice-text'],
                          fontFamily: themeStyles['--preview-font-family'],
                        }}
                        data-testid={`preview-choice-${index}`}
                      >
                        {choice.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* End card indicator */
              <div className="flex-1 flex items-center justify-center" data-testid="card-preview-end">
                <div 
                  className="text-center px-4 py-3"
                  style={{
                    backgroundColor: themeStyles['--preview-choice-bg'],
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderColor: themeStyles['--preview-choice-border'],
                    borderRadius: themeStyles['--preview-border-radius'],
                    boxShadow: previewTheme.shadowStyle === 'hard' 
                      ? `2px 2px 0px 0px ${themeStyles['--preview-choice-border']}`
                      : 'none',
                  }}
                >
                  <p 
                    className="text-sm font-bold"
                    style={{ 
                      color: themeStyles['--preview-choice-text'],
                      fontFamily: themeStyles['--preview-title-font'],
                    }}
                  >
                    ✦ The End ✦
                  </p>
                  <p 
                    className="text-xs mt-1 opacity-70"
                    style={{ color: themeStyles['--preview-choice-text'] }}
                  >
                    No choices configured
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

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
