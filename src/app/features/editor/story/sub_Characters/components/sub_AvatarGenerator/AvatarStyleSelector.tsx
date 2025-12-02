'use client'

import { cn } from '@/lib/utils'
import { AVATAR_STYLES } from '../../lib/characterPromptComposer'

export type AvatarStyle = 'pixel' | 'chibi' | 'portrait' | 'rpg' | 'cartoon' | 'handdrawn' | 'gothic' | 'story'

interface AvatarStyleSelectorProps {
  selectedStyle: AvatarStyle
  loading: boolean
  hasStoryArtStyle?: boolean
  onSelectStyle: (style: AvatarStyle) => void
}

export function AvatarStyleSelector({
  selectedStyle,
  loading,
  hasStoryArtStyle = false,
  onSelectStyle,
}: AvatarStyleSelectorProps) {
  return (
    <div
      className="bg-card rounded-lg border-2 border-border p-4 space-y-4 halloween-bat-silhouette"
      data-testid="avatar-style-selector"
    >
      <h3 className="text-sm font-semibold">Avatar Style</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AVATAR_STYLES.map((style) => {
          // Disable "story" style if no story art style is defined
          const isStoryStyle = style.id === 'story'
          const isDisabled = loading || (isStoryStyle && !hasStoryArtStyle)

          return (
            <button
              key={style.id}
              onClick={() => onSelectStyle(style.id as AvatarStyle)}
              disabled={isDisabled}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
                'hover:bg-muted active:scale-[0.98]',
                selectedStyle === style.id
                  ? 'border-primary bg-primary/10 shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                  : 'border-border hover:border-border/80',
                isDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
              title={isStoryStyle && !hasStoryArtStyle ? 'Set a story art style first' : undefined}
              data-testid={`avatar-style-${style.id}`}
            >
              <span className="text-2xl">{style.icon}</span>
              <span className="text-xs font-medium">{style.label}</span>
              <span className="text-[10px] text-muted-foreground text-center">
                {style.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
