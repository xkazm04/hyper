'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import Image from 'next/image'
import { StoryCard } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'

export interface ChoicePreviewPopoverProps {
  targetCard: StoryCard | null
  children: React.ReactNode
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
 * A hover preview popover that displays a target card's title, image, and content excerpt.
 * Uses Radix Tooltip primitive for reliable hover behavior.
 */
export function ChoicePreviewPopover({
  targetCard,
  children,
}: ChoicePreviewPopoverProps) {
  // Don't wrap if no valid target card
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
