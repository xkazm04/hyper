'use client'

/**
 * OutlineCard Component
 *
 * A single card item in the outline sidebar with:
 * - Completion indicators (title, content, image, audio, choices)
 * - Visual reactivity on hover and click
 * - Right-click context menu for deletion
 * - Click animation feedback
 */

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { StoryCard, Choice } from '@/lib/types'
import { Type, FileText, ImageIcon, GitBranch, Volume2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface OutlineCardProps {
  card: StoryCard
  isSelected?: boolean
  choices: Choice[]
  onClick: (cardId: string) => void
  onContextMenu: (e: React.MouseEvent, cardId: string) => void
}

export function OutlineCard({
  card,
  isSelected = false,
  choices,
  onClick,
  onContextMenu,
}: OutlineCardProps) {
  const [isPressed, setIsPressed] = useState(false)

  const hasTitle = Boolean(card.title && card.title.trim())
  const hasContent = Boolean(card.content && card.content.trim())
  const hasImage = Boolean(card.imageUrl)
  const hasAudio = Boolean(card.audioUrl)
  const cardChoices = choices.filter(c => c.storyCardId === card.id)
  const hasChoices = cardChoices.length > 0

  const handleClick = useCallback(() => {
    setIsPressed(true)
    onClick(card.id)
    // Reset press state after animation
    setTimeout(() => setIsPressed(false), 150)
  }, [card.id, onClick])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    onContextMenu(e, card.id)
  }, [card.id, onContextMenu])

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
        'border-2 text-xs',
        'cursor-pointer',
        // Selected state
        isSelected
          ? 'bg-primary/15 border-primary text-primary font-medium shadow-sm'
          : 'bg-card border-border/50',
        // Hover state (non-selected)
        !isSelected && 'hover:bg-muted/80 hover:border-muted-foreground/40 hover:shadow-sm',
        // Active/pressed state
        'active:scale-[0.98] active:shadow-none'
      )}
      data-testid={`outline-card-${card.id}`}
    >
      {/* Card title */}
      <span className={cn(
        'line-clamp-1 font-medium',
        isSelected ? 'text-primary' : 'text-foreground'
      )}>
        {card.title || 'Untitled Card'}
      </span>

      {/* Completion Indicators Row */}
      <div className="flex items-center gap-1 mt-2">
        <CompletionIndicator
          done={hasTitle}
          icon={Type}
          label="Title"
          isSelected={isSelected}
        />
        <CompletionIndicator
          done={hasContent}
          icon={FileText}
          label="Content"
          isSelected={isSelected}
        />
        <CompletionIndicator
          done={hasImage}
          icon={ImageIcon}
          label="Image"
          isSelected={isSelected}
        />
        <CompletionIndicator
          done={hasAudio}
          icon={Volume2}
          label="Audio"
          isSelected={isSelected}
        />
        <CompletionIndicator
          done={hasChoices}
          icon={GitBranch}
          label={hasChoices ? `${cardChoices.length} choices` : 'No choices'}
          isSelected={isSelected}
        />
      </div>
    </motion.button>
  )
}

// ============================================================================
// Completion Indicator Sub-component
// ============================================================================

interface CompletionIndicatorProps {
  done: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  isSelected?: boolean
}

function CompletionIndicator({ done, icon: Icon, label, isSelected }: CompletionIndicatorProps) {
  return (
    <div
      className={cn(
        'w-5 h-5 rounded flex items-center justify-center transition-colors',
        done
          ? isSelected
            ? 'bg-primary/30 text-primary'
            : 'bg-emerald-500/20 text-emerald-600'
          : 'bg-muted text-muted-foreground/40'
      )}
      title={`${label}: ${done ? 'Done' : 'Missing'}`}
    >
      <Icon className="w-3.5 h-3.5" />
    </div>
  )
}
