'use client'

import { cn } from '@/lib/utils'
import { Check, X, Loader2 } from 'lucide-react'

// ============================================================================
// Content Editor - Inline textarea for editing card content
// ============================================================================

interface ContentEditorProps {
  content: string
  onChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
  isSaving: boolean
  isHalloween?: boolean
}

export function ContentEditor({
  content,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isHalloween,
}: ContentEditorProps) {
  return (
    <div
      className={cn(
        'space-y-2 p-3 rounded-lg border',
        isHalloween
          ? 'bg-purple-900/30 border-purple-500/30'
          : 'bg-muted/30 border-border'
      )}
    >
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full min-h-[100px] p-3 rounded-lg text-sm',
          'bg-card border border-border resize-none',
          'focus:outline-none focus:ring-2',
          isHalloween
            ? 'focus:ring-orange-500/50 text-purple-100'
            : 'focus:ring-primary/50'
        )}
        placeholder="Enter scene content..."
        disabled={isSaving}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={isSaving}
          className={cn(
            'flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2',
            isHalloween
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
            isSaving && 'opacity-70 cursor-wait'
          )}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Save
        </button>
        <button
          onClick={onCancel}
          disabled={isSaving}
          className={cn(
            'px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-1',
            'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  )
}
