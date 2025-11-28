'use client'

import { cn } from '@/lib/utils'
import { AVATAR_STYLES } from '../../lib/characterPromptComposer'

export type AvatarStyle = 'pixel' | 'chibi' | 'portrait' | 'icon'

interface AvatarStyleSelectorProps {
  selectedStyle: AvatarStyle
  loading: boolean
  onSelectStyle: (style: AvatarStyle) => void
}

export function AvatarStyleSelector({
  selectedStyle,
  loading,
  onSelectStyle,
}: AvatarStyleSelectorProps) {
  return (
    <div className="bg-card rounded-lg border-2 border-border p-4 space-y-4 halloween-bat-silhouette">
      <h3 className="text-sm font-semibold">Avatar Style</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AVATAR_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelectStyle(style.id as AvatarStyle)}
            disabled={loading}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all',
              'hover:bg-muted active:scale-[0.98]',
              selectedStyle === style.id
                ? 'border-primary bg-primary/10 shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                : 'border-border hover:border-border/80'
            )}
          >
            <span className="text-2xl">{style.icon}</span>
            <span className="text-xs font-medium">{style.label}</span>
            <span className="text-[10px] text-muted-foreground text-center">
              {style.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
