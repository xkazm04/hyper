'use client'

import { useMemo } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import Image from 'next/image'
import { Target, GripVertical, Trash2, ArrowRight, AlertCircle, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Choice, StoryCard } from '@/lib/types'
import { cn } from '@/lib/utils'

export interface ChoiceListProps {
  choices: Choice[]
  editingChoiceId: string | null
  isSaving: boolean
  otherCards: StoryCard[]
  onLabelChange: (choiceId: string, label: string) => void
  onLabelBlur: (choiceId: string) => void
  onFocus: (choiceId: string) => void
  onTargetChange: (choiceId: string, targetCardId: string) => void
  onDelete: (choiceId: string) => void
  getTargetCardTitle: (targetCardId: string) => string
  isTargetValid: (targetCardId: string) => boolean
}

/**
 * Creates a truncated excerpt from content (max 100 chars).
 */
function getContentExcerpt(content: string | null): string | null {
  if (!content) return null
  const text = content.trim()
  if (text.length <= 100) return text
  return text.slice(0, 100).trim() + '...'
}

/**
 * Internal component for rendering the hover preview popover.
 * Displays a target card's title, image, and content excerpt.
 */
function TargetCardPreview({
  targetCard,
  children,
}: {
  targetCard: StoryCard | null
  children: React.ReactNode
}) {
  if (!targetCard) {
    return <>{children}</>
  }

  const contentExcerpt = getContentExcerpt(targetCard.content)

  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="right"
            align="start"
            sideOffset={8}
            className={cn(
              'z-50 w-64 rounded-lg border-2 border-border bg-card shadow-lg',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2',
              'data-[side=top]:slide-in-from-bottom-2'
            )}
            data-testid="choice-preview-popover"
          >
            {/* Image section */}
            {targetCard.imageUrl ? (
              <div className="relative w-full h-28 overflow-hidden rounded-t-md">
                <Image
                  src={targetCard.imageUrl}
                  alt={targetCard.title || 'Card preview'}
                  fill
                  className="object-cover"
                  sizes="256px"
                  data-testid="choice-preview-image"
                />
              </div>
            ) : (
              <div
                className="w-full h-20 bg-muted/50 rounded-t-md flex items-center justify-center"
                data-testid="choice-preview-no-image"
              >
                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}

            {/* Content section */}
            <div className="p-3 space-y-2">
              {/* Title */}
              <h4
                className="font-semibold text-sm text-foreground line-clamp-1"
                data-testid="choice-preview-title"
              >
                {targetCard.title || 'Untitled Card'}
              </h4>

              {/* Content excerpt */}
              {contentExcerpt ? (
                <p
                  className="text-xs text-muted-foreground line-clamp-3"
                  data-testid="choice-preview-excerpt"
                >
                  {contentExcerpt}
                </p>
              ) : (
                <p
                  className="text-xs text-muted-foreground/60 italic"
                  data-testid="choice-preview-no-content"
                >
                  No content yet
                </p>
              )}
            </div>

            {/* Arrow pointer */}
            <TooltipPrimitive.Arrow
              className="fill-card stroke-border stroke-2"
              width={12}
              height={6}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

/**
 * Internal component for rendering a single choice item.
 */
function ChoiceListItem({
  choice,
  isEditing,
  isSaving,
  otherCards,
  onLabelChange,
  onLabelBlur,
  onFocus,
  onTargetChange,
  onDelete,
  getTargetCardTitle,
  isTargetValid,
}: {
  choice: Choice
  isEditing: boolean
  isSaving: boolean
  otherCards: StoryCard[]
  onLabelChange: (choiceId: string, label: string) => void
  onLabelBlur: (choiceId: string) => void
  onFocus: (choiceId: string) => void
  onTargetChange: (choiceId: string, targetCardId: string) => void
  onDelete: (choiceId: string) => void
  getTargetCardTitle: (targetCardId: string) => string
  isTargetValid: (targetCardId: string) => boolean
}) {
  const isValid = isTargetValid(choice.targetCardId)

  // Find the target card for the hover preview
  const targetCard = useMemo(() => {
    return otherCards.find((card) => card.id === choice.targetCardId) || null
  }, [otherCards, choice.targetCardId])

  return (
    <div
      className={cn(
        'border-2 rounded-lg p-4 bg-card transition-all duration-200 halloween-skeleton-rattle',
        isEditing
          ? 'border-primary shadow-[4px_4px_0px_0px_hsl(var(--primary)/0.3)]'
          : 'border-border shadow-[2px_2px_0px_0px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]'
      )}
      data-testid={`choice-item-${choice.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          className="mt-2.5 cursor-move text-muted-foreground hover:text-foreground
                     opacity-50 hover:opacity-100 transition-opacity"
          title="Drag to reorder"
          data-testid={`choice-drag-handle-${choice.id}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Choice Content */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Label Input */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Choice Label
            </Label>
            <Input
              value={choice.label}
              onChange={(e) => onLabelChange(choice.id, e.target.value)}
              onBlur={() => onLabelBlur(choice.id)}
              onFocus={() => onFocus(choice.id)}
              placeholder="e.g., Go north, Fight the dragon, Open the door..."
              className="border-0 bg-muted/50 focus:bg-background focus:ring-0 focus:outline-none
                         shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] halloween-candle-flicker-focus"
              disabled={isSaving}
              data-testid={`choice-label-input-${choice.id}`}
            />
          </div>

          {/* Target Card Select */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <ArrowRight className="w-3 h-3" />
              Target Card
            </Label>
            <TargetCardPreview targetCard={targetCard}>
              <div>
                <Select
                  value={choice.targetCardId}
                  onValueChange={(value) => onTargetChange(choice.id, value)}
                  disabled={isSaving}
                >
                  <SelectTrigger className="border-0 bg-muted/50 focus:ring-0" data-testid={`choice-target-select-${choice.id}`}>
                    <SelectValue>
                      {getTargetCardTitle(choice.targetCardId)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-2 border-border shadow-lg">
                    {otherCards.map(card => (
                      <SelectItem key={card.id} value={card.id} data-testid={`choice-target-option-${card.id}`}>
                        {card.title || 'Untitled Card'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TargetCardPreview>

            {!isValid && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-destructive">
                <AlertCircle className="w-3 h-3" />
                <span>Target card no longer exists</span>
              </div>
            )}
          </div>
        </div>

        {/* Delete Button */}
        <Button
          onClick={() => onDelete(choice.id)}
          disabled={isSaving}
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          data-testid={`choice-delete-btn-${choice.id}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

/**
 * ChoiceList Component
 *
 * Unified component for rendering a list of choice items with:
 * - Inline editing of choice labels
 * - Target card selection with hover preview
 * - Delete functionality
 * - Empty state when no choices exist
 *
 * Previously split across ChoiceItem and ChoicePreviewPopover,
 * now consolidated for simpler maintenance.
 */
export function ChoiceList({
  choices,
  editingChoiceId,
  isSaving,
  otherCards,
  onLabelChange,
  onLabelBlur,
  onFocus,
  onTargetChange,
  onDelete,
  getTargetCardTitle,
  isTargetValid,
}: ChoiceListProps) {
  if (choices.length === 0) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-border rounded-lg bg-muted/30" data-testid="choice-list-empty">
        <Target className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">No choices yet</p>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Add choices to let players navigate between cards and shape their story
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="choice-list">
      {choices.map((choice) => (
        <ChoiceListItem
          key={choice.id}
          choice={choice}
          isEditing={editingChoiceId === choice.id}
          isSaving={isSaving}
          otherCards={otherCards}
          onLabelChange={onLabelChange}
          onLabelBlur={onLabelBlur}
          onFocus={onFocus}
          onTargetChange={onTargetChange}
          onDelete={onDelete}
          getTargetCardTitle={getTargetCardTitle}
          isTargetValid={isTargetValid}
        />
      ))}
    </div>
  )
}
